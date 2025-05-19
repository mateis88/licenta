const User = require('../models/user_schema');
const Address = require('../models/address_schema');
const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

exports.login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed.');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email: email });
        if (!user) {
            const error = new Error('Invalid email or password.');
            error.statusCode = 401;
            throw error;
        }

        // Check password
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Invalid email or password.');
            error.statusCode = 401;
            throw error;
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id.toString(),
                email: user.email,
                status: user.status
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        const userResponse = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            birthDate: user.birthDate,
            status: user.status,
            profilePicture: user.profilePicture,
            bio: user.bio || '',
            phoneNumber: user.phoneNumber || ''
        };

        console.log('Login response user data:', JSON.stringify(userResponse, null, 2));

        res.status(200).json({
            message: 'Login successful',
            token: token,
            user: userResponse
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed.');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const { firstName, lastName, birthDate, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            const error = new Error('Email already exists.');
            error.statusCode = 422;
            throw error;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user with regular status
        const user = new User({
            firstName,
            lastName,
            birthDate: new Date(birthDate),
            email,
            password: hashedPassword,
            status: 'regular'
        });

        // Save user first
        const result = await user.save();

        // After successful user creation, create address entry
        try {
            const address = new Address({
                email: email // Only required field
            });
            await address.save();
        } catch (addressError) {
            // If address creation fails, delete the user and throw error
            await User.findByIdAndDelete(result._id);
            throw addressError;
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: result._id.toString(),
                email: result.email,
                status: result.status
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User created successfully.',
            token: token,
            user: {
                id: result._id,
                email: result.email,
                firstName: result.firstName,
                lastName: result.lastName,
                birthDate: result.birthDate,
                status: result.status
            }
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

// Get user profile
exports.getProfile = async (req, res, next) => {
    try {
        const userId = req.params.id;
        
        console.log('[getProfile] Fetching profile for user:', userId);
        
        const user = await User.findById(userId).select('-password');
            if (!user) {
                const error = new Error('User not found.');
                error.statusCode = 404;
                throw error;
            }

        console.log('[getProfile] Found user:', {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        });

        // Get the user's address
        const address = await Address.findOne({ email: user.email });
        console.log('[getProfile] Found address:', address);

        const userResponse = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            birthDate: user.birthDate,
            status: user.status,
            profilePicture: user.profilePicture,
            bio: user.bio || '',
            phoneNumber: user.phoneNumber || '',
            address: address ? {
                street: address.street || '',
                city: address.city || '',
                state: address.state || '',
                country: address.country || '',
                zipCode: address.zipCode || ''
            } : {
                street: '',
                city: '',
                state: '',
                country: '',
                zipCode: ''
            }
        };

        console.log('[getProfile] Sending response:', userResponse);

            res.status(200).json({
                message: 'Profile fetched successfully.',
            user: userResponse
            });
    } catch (err) {
        console.error('[getProfile] Error:', err);
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const tokenUserId = req.userId;
        
        console.log('Update Profile Request:', {
            paramsId: userId,
            tokenUserId: tokenUserId,
            headers: req.headers,
            body: req.body
        });

        // Validate user ID
        if (!userId || !tokenUserId) {
            console.error('Missing user ID:', { userId, tokenUserId });
            return res.status(400).json({ 
                message: 'User ID is required',
                details: 'Both URL parameter and token user ID must be present'
            });
        }

        // Validate if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(tokenUserId)) {
            console.error('Invalid user ID format:', { userId, tokenUserId });
            return res.status(400).json({ 
                message: 'Invalid user ID format',
                details: 'Both IDs must be valid MongoDB ObjectIds'
            });
        }

        // Check if user is trying to update their own profile
        if (userId !== tokenUserId) {
            console.error('User ID mismatch:', { 
                requestedId: userId, 
                tokenId: tokenUserId 
            });
            return res.status(403).json({ 
                message: 'Not authorized to update this profile',
                details: 'User can only update their own profile'
            });
        }

        // Extract address fields from the request body
        const addressFields = req.body.address || {};
        const { street, city, state, country, zipCode } = addressFields;
        
        // Remove address from userUpdates
        const { address: addressData, ...userUpdates } = req.body;
        console.log('Processing user updates:', userUpdates);
        console.log('Processing address updates:', addressFields);

        // Remove fields that shouldn't be updated
        const protectedFields = ['email', 'password', 'status', '_id', 'id'];
        protectedFields.forEach(field => delete userUpdates[field]);

        // Validate birthDate if provided
        if (userUpdates.birthDate) {
            try {
                const [day, month, year] = userUpdates.birthDate.split('/');
                // Create date in UTC to avoid timezone issues
                const birthDate = new Date(Date.UTC(year, month - 1, day));
                
                if (isNaN(birthDate.getTime())) {
                    return res.status(400).json({ 
                        message: 'Invalid birth date format',
                        details: 'Please use DD/MM/YYYY format'
                    });
                }
                
                if (birthDate >= new Date()) {
                    return res.status(400).json({ 
                        message: 'Invalid birth date',
                        details: 'Birth date cannot be in the future'
                    });
                }
                userUpdates.birthDate = birthDate;
            } catch (error) {
                console.error('Error processing birth date:', error);
                return res.status(400).json({ 
                    message: 'Invalid birth date format',
                    details: error.message
                });
            }
        }

        // Update user profile
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: userUpdates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update or create address
        let userAddress = await Address.findOne({ email: user.email });
        console.log('Found existing address:', userAddress);

        if (userAddress) {
            // Update existing address
            userAddress = await Address.findOneAndUpdate(
                { email: user.email },
                { 
                    $set: {
                        street: street || userAddress.street,
                        city: city || userAddress.city,
                        state: state || userAddress.state,
                        country: country || userAddress.country,
                        zipCode: zipCode || userAddress.zipCode
                    }
                },
                { new: true, runValidators: true }
            );
            console.log('Updated address:', userAddress);
        } else {
            // Create new address
            userAddress = new Address({
                email: user.email,
                street: street || '',
                city: city || '',
                state: state || '',
                country: country || '',
                zipCode: zipCode || ''
            });
            await userAddress.save();
            console.log('Created new address:', userAddress);
        }

        // Generate new token
        const token = jwt.sign(
            { 
                userId: user._id.toString(),
                email: user.email,
                status: user.status
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Transform user data to match frontend expectations
        const userResponse = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            birthDate: user.birthDate,
            status: user.status,
            profilePicture: user.profilePicture,
            bio: user.bio || '',
            phoneNumber: user.phoneNumber || '',
            address: {
                street: userAddress.street || '',
                city: userAddress.city || '',
                state: userAddress.state || '',
                country: userAddress.country || '',
                zipCode: userAddress.zipCode || ''
            }
        };

        res.json({
            message: 'Profile updated successfully',
            user: userResponse,
            token
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Validation error',
                details: Object.values(error.errors).map(err => err.message)
            });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                message: 'Invalid user ID format',
                details: error.message
            });
        }
        res.status(500).json({ 
            message: 'Error updating profile',
            details: error.message 
        });
    }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
    try {
    if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const userId = req.params.id;
        const tokenUserId = req.userId; // Get user ID from token

        console.log('Upload request:', {
            paramsId: userId,
            tokenUserId: tokenUserId,
            headers: req.headers
        });

        // Validate user ID
        if (!userId || !tokenUserId) {
            console.error('Missing user ID:', { userId, tokenUserId });
            // Delete the uploaded file
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ 
                message: 'User ID is required',
                details: 'Both URL parameter and token user ID must be present'
            });
        }

        // Validate if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(tokenUserId)) {
            console.error('Invalid user ID format:', { userId, tokenUserId });
            // Delete the uploaded file
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ 
                message: 'Invalid user ID format',
                details: 'Both IDs must be valid MongoDB ObjectIds'
            });
        }

        // Check if user is trying to update their own profile
        if (userId !== tokenUserId) {
            console.error('User ID mismatch:', { 
                requestedId: userId, 
                tokenId: tokenUserId 
            });
            // Delete the uploaded file
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(403).json({ 
                message: 'Not authorized to update this profile',
                details: 'User can only update their own profile'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            // Delete the uploaded file if user not found
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete old profile picture if it exists
        if (user.profilePicture) {
            const oldPicturePath = path.join(__dirname, '..', user.profilePicture);
            if (fs.existsSync(oldPicturePath)) {
                fs.unlinkSync(oldPicturePath);
            }
        }

        // Update user's profile picture path
        const relativePath = path.relative(path.join(__dirname, '..'), req.file.path);
        user.profilePicture = relativePath.replace(/\\/g, '/'); // Convert Windows path to URL format
        await user.save();

        // Generate new token
        const token = jwt.sign(
            { 
                userId: user._id.toString(),
                email: user.email,
                status: user.status
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Get updated user data without password
        const updatedUser = await User.findById(userId).select('-password');

        const userResponse = {
            id: updatedUser._id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            birthDate: updatedUser.birthDate,
            status: updatedUser.status,
            profilePicture: updatedUser.profilePicture,
            bio: updatedUser.bio || '',
            phoneNumber: updatedUser.phoneNumber || ''
        };

        console.log('Profile picture updated successfully:', {
            userId,
            imageUrl: `/uploads/profile-pictures/${path.basename(req.file.path)}`
        });

        res.json({
            message: 'Profile picture uploaded successfully',
            imageUrl: `/uploads/profile-pictures/${path.basename(req.file.path)}`,
            user: userResponse,
            token
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        // Delete the uploaded file if there's an error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ 
            message: 'Error uploading profile picture',
            details: error.message 
        });
    }
};

// Get users with birthdays on a specific date
exports.getBirthdaysOnDate = async (req, res) => {
    try {
        const { month, day } = req.params;
        
        console.log('[Birthdays] Searching for birthdays on:', { month, day });
        
        // First, let's check what users we have in the database
        const allUsers = await User.find().select('firstName lastName birthDate');
        console.log('[Birthdays] All users in database:', allUsers.map(u => ({
            name: `${u.firstName} ${u.lastName}`,
            birthDate: u.birthDate
        })));
        
        // Find users whose birthday is on the specified date
        const users = await User.find({
            $expr: {
                $and: [
                    { $eq: [{ $month: "$birthDate" }, parseInt(month)] },
                    { $eq: [{ $dayOfMonth: "$birthDate" }, parseInt(day)] }
                ]
            }
        }).select('firstName lastName profilePicture');

        console.log('[Birthdays] Found users for date:', users.map(u => ({
            name: `${u.firstName} ${u.lastName}`,
            birthDate: u.birthDate
        })));

        // Transform the data to include full names and profile picture URLs
        const transformedUsers = users.map(user => ({
            id: user._id,
            fullName: `${user.firstName} ${user.lastName}`,
            profilePicture: user.profilePicture || null
        }));

        res.status(200).json({
            message: 'Birthdays retrieved successfully',
            users: transformedUsers
        });
    } catch (error) {
        console.error('[Birthdays] Error getting birthdays:', error);
        res.status(500).json({
            message: 'Failed to get birthdays',
            details: error.message
        });
    }
};