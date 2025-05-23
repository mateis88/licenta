const Request = require('../models/request_schema');
const { validationResult } = require('express-validator');
const User = require('../models/user_schema');

// Create a new leave request
exports.createRequest = async (req, res) => {
    try {
        console.log('[Request] Creating new request:', {
            body: req.body,
            user: req.userId,
            headers: {
                'content-type': req.headers['content-type'],
                'authorization': req.headers.authorization ? 'Bearer [HIDDEN]' : 'Not provided'
            }
        });

        // Validate request data
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error('[Request] Validation errors:', {
                errors: errors.array(),
                body: req.body
            });
            return res.status(400).json({
                message: 'Invalid request data',
                details: errors.array()
            });
        }

        const { email, type, startDate, endDate, documents } = req.body;

        // Log the parsed data
        console.log('[Request] Parsed request data:', {
            email,
            type,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            documentsCount: documents?.length || 0
        });

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Reset time part for date comparison

        console.log('[Request] Date validation:', {
            start: start.toISOString(),
            end: end.toISOString(),
            now: now.toISOString()
        });

        if (start < now) {
            console.log('[Request] Invalid start date:', {
                start: start.toISOString(),
                now: now.toISOString()
            });
            return res.status(400).json({
                message: 'Invalid start date',
                details: 'Start date cannot be in the past'
            });
        }

        if (end < start) {
            console.log('[Request] Invalid end date:', {
                start: start.toISOString(),
                end: end.toISOString()
            });
            return res.status(400).json({
                message: 'Invalid end date',
                details: 'End date must be after or equal to start date'
            });
        }

        // Check for overlapping requests (any status)
        const overlappingRequest = await Request.findOne({
            email: email,
            $or: [
                // New request starts during an existing request
                {
                    startDate: { $lte: start },
                    endDate: { $gte: start }
                },
                // New request ends during an existing request
                {
                    startDate: { $lte: end },
                    endDate: { $gte: end }
                },
                // New request completely contains an existing request
                {
                    startDate: { $gte: start },
                    endDate: { $lte: end }
                }
            ]
        });

        if (overlappingRequest) {
            const formatDate = (date) => {
                return new Date(date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            };

            console.log('[Request] Found overlapping request:', {
                existingRequest: {
                    id: overlappingRequest._id,
                    startDate: overlappingRequest.startDate,
                    endDate: overlappingRequest.endDate,
                    status: overlappingRequest.status
                },
                newRequest: {
                    startDate: start,
                    endDate: end
                }
            });

            const statusText = overlappingRequest.status.charAt(0).toUpperCase() + overlappingRequest.status.slice(1);
            return res.status(400).json({
                message: 'Overlapping leave request',
                details: `You have a ${statusText.toLowerCase()} leave request that overlaps with your requested dates`
            });
        }

        // Create new request
        const request = new Request({
            email,
            type,
            startDate: start,
            endDate: end,
            documents: documents || [],
            status: 'pending'
        });

        // Save request
        const savedRequest = await request.save();
        console.log('[Request] Request created successfully:', {
            id: savedRequest._id,
            email: savedRequest.email,
            type: savedRequest.type,
            startDate: savedRequest.startDate,
            endDate: savedRequest.endDate,
            status: savedRequest.status
        });

        res.status(201).json({
            message: 'Leave request created successfully',
            request: savedRequest
        });
    } catch (error) {
        console.error('[Request] Error creating request:', {
            error: error.message,
            stack: error.stack,
            body: req.body
        });
        res.status(500).json({
            message: 'Failed to create leave request',
            details: error.message
        });
    }
};

// Get all requests for a user
exports.getUserRequests = async (req, res) => {
    try {
        const { email } = req.params;
        
        const requests = await Request.find({ email })
            .sort({ createdAt: -1 }); // Most recent first

        res.status(200).json({
            message: 'Requests retrieved successfully',
            requests
        });
    } catch (error) {
        console.error('[Request] Error getting user requests:', error);
        res.status(500).json({
            message: 'Failed to get requests',
            details: error.message
        });
    }
};

// Delete a request
exports.deleteRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const email = req.userEmail; // Get email from authenticated user

        console.log('[Request] Delete request attempt:', {
            requestId,
            email,
            userStatus: req.userStatus,
            headers: {
                authorization: req.headers.authorization ? 'Bearer [HIDDEN]' : 'Not provided'
            }
        });

        if (!requestId) {
            console.log('[Request] No request ID provided');
            return res.status(400).json({
                message: 'Request ID is required'
            });
        }

        if (!email) {
            console.log('[Request] No user email in request');
            return res.status(401).json({
                message: 'User not authenticated'
            });
        }

        // First find the request without email filter to check if it exists
        const request = await Request.findById(requestId);
        
        console.log('[Request] Found request:', request ? {
            id: request._id,
            email: request.email,
            status: request.status,
            matchesUser: request.email === email
        } : 'No request found');

        if (!request) {
            console.log('[Request] Request not found:', requestId);
            return res.status(404).json({
                message: 'Request not found'
            });
        }

        // Then verify ownership
        if (request.email !== email) {
            console.log('[Request] Ownership mismatch:', {
                requestEmail: request.email,
                userEmail: email
            });
            return res.status(403).json({
                message: 'You do not have permission to delete this request'
            });
        }

        // Only allow deletion of pending requests
        if (request.status !== 'pending') {
            console.log('[Request] Attempted to delete non-pending request:', {
                requestId,
                status: request.status
            });
            return res.status(400).json({
                message: 'Only pending requests can be deleted'
            });
        }

        // Delete the request
        const deleteResult = await Request.deleteOne({ _id: requestId });
        
        console.log('[Request] Delete operation result:', deleteResult);

        if (deleteResult.deletedCount === 0) {
            console.log('[Request] Delete operation failed - no document deleted');
            return res.status(500).json({
                message: 'Failed to delete request - no document was deleted'
            });
        }

        res.status(200).json({
            message: 'Request deleted successfully'
        });
    } catch (error) {
        console.error('[Request] Error deleting request:', {
            error: error.message,
            stack: error.stack,
            requestId: req.params.requestId,
            email: req.userEmail
        });
        res.status(500).json({
            message: 'Failed to delete request',
            details: error.message
        });
    }
};

// Get all requests with user information (admin only)
exports.getAllRequests = async (req, res) => {
    try {
        // Check if user is admin
        if (req.userStatus !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Get all requests and populate user information
        const requests = await Request.find()
            .sort({ createdAt: -1 }) // Most recent first
            .lean(); // Convert to plain JavaScript objects

        // Get all unique user emails from requests
        const userEmails = [...new Set(requests.map(req => req.email))];
        
        // Fetch all users in one query
        const users = await User.find({ email: { $in: userEmails } })
            .select('firstName lastName email')
            .lean();

        // Create a map of users by email for easy lookup
        const userMap = users.reduce((map, user) => {
            map[user.email] = user;
            return map;
        }, {});

        // Attach user information to each request
        const requestsWithUsers = requests.map(request => ({
            ...request,
            email: userMap[request.email] || { email: request.email }
        }));

        res.status(200).json({
            message: 'All requests retrieved successfully',
            requests: requestsWithUsers
        });
    } catch (error) {
        console.error('[Request] Error getting all requests:', error);
        res.status(500).json({
            message: 'Failed to get requests',
            details: error.message
        });
    }
};

// Update request status (admin only)
exports.updateRequestStatus = async (req, res) => {
    try {
        // Check if user is admin
        if (req.userStatus !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required.'
            });
        }

        const { requestId } = req.params;
        const { status } = req.body;

        // Validate status
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({
                message: 'Invalid status. Must be either "approved", "rejected", or "pending"'
            });
        }

        // Find and update the request
        const request = await Request.findById(requestId);
        
        if (!request) {
            return res.status(404).json({
                message: 'Request not found'
            });
        }

        // Get the user
        const user = await User.findOne({ email: request.email });
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Calculate business days between start and end date
        const calculateBusinessDays = (startDate, endDate) => {
            let count = 0;
            const curDate = new Date(startDate.getTime());
            while (curDate <= endDate) {
                const dayOfWeek = curDate.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
                curDate.setDate(curDate.getDate() + 1);
            }
            return count;
        };

        // If the request is being approved and it's a paid leave request
        if (status === 'approved' && request.type === 'paid') {
            const businessDays = calculateBusinessDays(request.startDate, request.endDate);
            
            console.log('[Request] Processing paid leave approval:', {
                requestId: request._id,
                email: request.email,
                startDate: request.startDate,
                endDate: request.endDate,
                businessDays,
                currentPaidLeaveDays: user.paidLeaveDays,
                requestType: request.type,
                userId: user._id
            });

            // Get the current user data from database to verify
            const currentUser = await User.findById(user._id);
            console.log('[Request] Current user data from database:', {
                userId: currentUser._id,
                email: currentUser.email,
                paidLeaveDays: currentUser.paidLeaveDays,
                lastLeaveUpdate: currentUser.lastLeaveUpdate
            });
            
            // Check if user has enough paid leave days
            if (user.paidLeaveDays < businessDays) {
                console.log('[Request] Insufficient paid leave days:', {
                    userId: user._id,
                    email: user.email,
                    availableDays: user.paidLeaveDays,
                    requiredDays: businessDays
                });
                return res.status(400).json({
                    message: 'Insufficient paid leave days',
                    details: `User has ${user.paidLeaveDays} days remaining, but needs ${businessDays} days`
                });
            }

            // Store the old value for logging
            const oldPaidLeaveDays = user.paidLeaveDays;
            
            // Deduct the business days from user's paid leave days
            user.paidLeaveDays -= businessDays;
            user.lastLeaveUpdate = new Date();
            
            // Log before save
            console.log('[Request] About to save user with updated paid leave days:', {
                userId: user._id,
                email: user.email,
                oldPaidLeaveDays,
                newPaidLeaveDays: user.paidLeaveDays,
                deductedDays: businessDays,
                lastLeaveUpdate: user.lastLeaveUpdate
            });
            
            // Save and verify the update
            const savedUser = await user.save();
            console.log('[Request] User saved with updated paid leave days:', {
                userId: savedUser._id,
                email: savedUser.email,
                paidLeaveDays: savedUser.paidLeaveDays,
                lastLeaveUpdate: savedUser.lastLeaveUpdate
            });

            // Verify the update in database
            const verifiedUser = await User.findById(user._id);
            console.log('[Request] Verified user data in database:', {
                userId: verifiedUser._id,
                email: verifiedUser.email,
                paidLeaveDays: verifiedUser.paidLeaveDays,
                lastLeaveUpdate: verifiedUser.lastLeaveUpdate
            });

            // Double check if the update was successful
            if (verifiedUser.paidLeaveDays !== savedUser.paidLeaveDays) {
                console.error('[Request] Database update verification failed:', {
                    savedPaidLeaveDays: savedUser.paidLeaveDays,
                    verifiedPaidLeaveDays: verifiedUser.paidLeaveDays
                });
            }
        }
        // If the request is being rejected and it was previously approved and it's a paid leave request
        else if (status === 'rejected' && request.status === 'approved' && request.type === 'paid') {
            const businessDays = calculateBusinessDays(request.startDate, request.endDate);
            
            // Return the business days to user's paid leave days
            user.paidLeaveDays += businessDays;
            user.lastLeaveUpdate = new Date();
            await user.save();

            console.log('[Request] Restored paid leave days:', {
                userId: user._id,
                email: user.email,
                oldDays: user.paidLeaveDays - businessDays,
                newDays: user.paidLeaveDays,
                restoredDays: businessDays
            });
        }
        // If the request is being reverted to pending and it was previously approved and it's a paid leave request
        else if (status === 'pending' && request.status === 'approved' && request.type === 'paid') {
            const businessDays = calculateBusinessDays(request.startDate, request.endDate);
            
            // Return the business days to user's paid leave days
            user.paidLeaveDays += businessDays;
            user.lastLeaveUpdate = new Date();
            
            console.log('[Request] Restoring paid leave days for reverted request:', {
                userId: user._id,
                email: user.email,
                oldDays: user.paidLeaveDays - businessDays,
                newDays: user.paidLeaveDays,
                restoredDays: businessDays,
                requestId: request._id
            });
            
            await user.save();
        }

        // Update request status
        request.status = status;
        await request.save();

        // Get the complete user data
        const updatedUser = await User.findById(user._id).select('-password');
        const userResponse = {
            id: updatedUser._id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            birthDate: updatedUser.birthDate,
            department: updatedUser.department,
            status: updatedUser.status,
            profilePicture: updatedUser.profilePicture,
            bio: updatedUser.bio || '',
            phoneNumber: updatedUser.phoneNumber || '',
            paidLeaveDays: updatedUser.paidLeaveDays,
            lastLeaveUpdate: updatedUser.lastLeaveUpdate
        };

        res.status(200).json({
            message: `Request status updated to ${status} successfully`,
            request,
            user: userResponse
        });
    } catch (error) {
        console.error('[Request] Error updating request status:', error);
        res.status(500).json({
            message: 'Failed to update request status',
            details: error.message
        });
    }
}; 