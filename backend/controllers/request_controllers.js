const Request = require('../models/request_schema');
const { validationResult } = require('express-validator');

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

        // Find the request and verify ownership
        const request = await Request.findOne({ _id: requestId, email });
        
        if (!request) {
            return res.status(404).json({
                message: 'Request not found or you do not have permission to delete it'
            });
        }

        // Only allow deletion of pending requests
        if (request.status !== 'pending') {
            return res.status(400).json({
                message: 'Only pending requests can be deleted'
            });
        }

        // Delete the request
        await Request.deleteOne({ _id: requestId });

        res.status(200).json({
            message: 'Request deleted successfully'
        });
    } catch (error) {
        console.error('[Request] Error deleting request:', error);
        res.status(500).json({
            message: 'Failed to delete request',
            details: error.message
        });
    }
}; 