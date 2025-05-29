const User = require('../models/user_schema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Login controller
exports.login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        // Check password
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        // Generate token
        const token = jwt.sign(
            { 
                userId: user._id.toString(),
                email: user.email,
                status: user.status
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Transform user data
        const transformedUser = {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            birthDate: user.birthDate,
            status: user.status,
            department: user.department,
            profilePicture: user.profilePicture,
            bio: user.bio || '',
            phoneNumber: user.phoneNumber || '',
            paidLeaveDays: user.paidLeaveDays,
            lastLeaveUpdate: user.lastLeaveUpdate,
            address: {
                street: user.address?.street || '',
                city: user.address?.city || '',
                state: user.address?.state || '',
                country: user.address?.country || '',
                zipCode: user.address?.zipCode || ''
            }
        };

        res.status(200).json({
            token,
            user: transformedUser
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

// Register controller
exports.register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const { email, password, firstName, lastName, birthDate, department } = req.body;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = new User({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            birthDate,
            department,
            status: 'user', // Default status
            paidLeaveDays: 21, // Default paid leave days
            lastLeaveUpdate: new Date()
        });

        // Save user
        await user.save();

        // Generate token
        const token = jwt.sign(
            { 
                userId: user._id.toString(),
                email: user.email,
                status: user.status
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Transform user data
        const transformedUser = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            birthDate: user.birthDate,
            status: user.status,
            department: user.department,
            profilePicture: user.profilePicture,
            bio: user.bio || '',
            phoneNumber: user.phoneNumber || '',
            paidLeaveDays: user.paidLeaveDays,
            lastLeaveUpdate: user.lastLeaveUpdate,
            address: {
                street: user.address?.street || '',
                city: user.address?.city || '',
                state: user.address?.state || '',
                country: user.address?.country || '',
                zipCode: user.address?.zipCode || ''
            }
        };

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: transformedUser
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

// Get profile controller
exports.getProfile = async (req, res, next) => {
    try {
        const userId = req.params.id;

        // Check if user is requesting their own profile or is admin
        if (req.userId !== userId && req.userStatus !== 'admin') {
            const error = new Error('Not authorized to view this profile');
            error.statusCode = 403;
            throw error;
        }

        const user = await User.findById(userId).select('-password');
            if (!user) {
            const error = new Error('User not found');
                error.statusCode = 404;
                throw error;
            }

        // Transform user data
        const transformedUser = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            birthDate: user.birthDate,
            status: user.status,
            department: user.department,
            profilePicture: user.profilePicture,
            bio: user.bio || '',
            phoneNumber: user.phoneNumber || '',
            paidLeaveDays: user.paidLeaveDays,
            lastLeaveUpdate: user.lastLeaveUpdate,
            address: {
                street: user.address?.street || '',
                city: user.address?.city || '',
                state: user.address?.state || '',
                country: user.address?.country || '',
                zipCode: user.address?.zipCode || ''
            }
        };

            res.status(200).json({
            message: 'Profile retrieved successfully',
            user: transformedUser
            });
    } catch (err) {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
    }
};

// Update profile controller
exports.updateProfile = async (req, res, next) => {
    try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
            const error = new Error('Validation failed');
        error.statusCode = 422;
        error.data = errors.array();
            console.log('[UpdateProfile] Validation errors:', errors.array());
        throw error;
    }

        const userId = req.params.id;

        // Check if user is updating their own profile or is admin
        if (req.userId !== userId && req.userStatus !== 'admin') {
            const error = new Error('Not authorized to update this profile');
            error.statusCode = 403;
            throw error;
        }

        const user = await User.findById(userId);
            if (!user) {
            const error = new Error('User not found');
                error.statusCode = 404;
                throw error;
            }

        // Update fields
        const { firstName, lastName, birthDate, bio, phoneNumber, address, email, department } = req.body;
        
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (birthDate) user.birthDate = birthDate;
        if (bio !== undefined) user.bio = bio;
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
        
        // Only allow admin to update email and department
        if (req.userStatus === 'admin') {
            if (email && email !== user.email) {
                // Check if email is already in use
                const existingUser = await User.findOne({ email });
                if (existingUser && existingUser._id.toString() !== userId) {
                    const error = new Error('Email already in use');
                    error.statusCode = 422;
                    throw error;
                }
                user.email = email;
            }
            if (department) {
                // Validate department
                const validDepartments = ['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Management'];
                if (!validDepartments.includes(department)) {
                    const error = new Error('Invalid department');
                    error.statusCode = 422;
                    throw error;
                }
                user.department = department;
            }
        }

        if (address) {
            user.address = {
                street: address.street || user.address?.street || '',
                city: address.city || user.address?.city || '',
                state: address.state || user.address?.state || '',
                country: address.country || user.address?.country || '',
                zipCode: address.zipCode || user.address?.zipCode || ''
            };
        }

        await user.save();

        // Transform user data
        const transformedUser = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            birthDate: user.birthDate,
            status: user.status,
            department: user.department,
            profilePicture: user.profilePicture,
            bio: user.bio || '',
            phoneNumber: user.phoneNumber || '',
            paidLeaveDays: user.paidLeaveDays,
            lastLeaveUpdate: user.lastLeaveUpdate,
            address: {
                street: user.address?.street || '',
                city: user.address?.city || '',
                state: user.address?.state || '',
                country: user.address?.country || '',
                zipCode: user.address?.zipCode || ''
                }
        };

        res.status(200).json({
            message: 'Profile updated successfully',
            user: transformedUser
        });
    } catch (err) {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
    }
};

// Upload profile picture controller
exports.uploadProfilePicture = async (req, res, next) => {
    try {
        const userId = req.params.id;

        // Check if user is updating their own profile or is admin
        if (req.userId !== userId && req.userStatus !== 'admin') {
            const error = new Error('Not authorized to update this profile');
            error.statusCode = 403;
            throw error;
        }

    if (!req.file) {
            const error = new Error('No file uploaded');
            error.statusCode = 400;
        throw error;
    }

        const user = await User.findById(userId);
            if (!user) {
            const error = new Error('User not found');
                error.statusCode = 404;
                throw error;
            }

        // Update profile picture path
        user.profilePicture = req.file.path.replace(/\\/g, '/');
        await user.save();

        // Transform user data
        const transformedUser = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            birthDate: user.birthDate,
            status: user.status,
            department: user.department,
            profilePicture: user.profilePicture,
            bio: user.bio || '',
            phoneNumber: user.phoneNumber || '',
            paidLeaveDays: user.paidLeaveDays,
            lastLeaveUpdate: user.lastLeaveUpdate,
            address: {
                street: user.address?.street || '',
                city: user.address?.city || '',
                state: user.address?.state || '',
                country: user.address?.country || '',
                zipCode: user.address?.zipCode || ''
            }
        };

        res.status(200).json({
            message: 'Profile picture uploaded successfully',
            user: transformedUser
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

// Get birthdays controller
exports.getBirthdays = async (req, res, next) => {
    try {
        const { year, month } = req.params;

        // Validate year and month
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        
        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            const error = new Error('Invalid year or month');
            error.statusCode = 400;
            throw error;
        }

        console.log('[Birthdays] Fetching birthdays for:', { year: yearNum, month: monthNum });

        // Find users with birthdays in this month
        const users = await User.find({
            $expr: {
                $and: [
                    { $eq: [{ $month: { $dateFromString: { dateString: { $toString: "$birthDate" } } } }, monthNum] }
                ]
            }
        }).select('firstName lastName birthDate department');

        console.log('[Birthdays] Found users:', users.length);

        // Sort by day of month
        users.sort((a, b) => {
            const dayA = new Date(a.birthDate).getDate();
            const dayB = new Date(b.birthDate).getDate();
            return dayA - dayB;
        });

        // Transform the response to include only necessary data
        const birthdays = users.map(user => ({
            firstName: user.firstName,
            lastName: user.lastName,
            birthDate: user.birthDate,
            department: user.department
        }));

        console.log('[Birthdays] Returning birthdays:', birthdays.length);

            res.status(200).json({
            message: 'Birthdays retrieved successfully',
            birthdays
            });
    } catch (err) {
        console.error('[Birthdays] Error:', err);
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
    }
};

// Get all employees (admin only)
exports.getAllEmployees = async (req, res, next) => {
    try {
        // Check if user is admin
        if (req.userStatus !== 'admin') {
            const error = new Error('Access denied. Admin privileges required.');
            error.statusCode = 403;
            throw error;
        }

        // Get all users except passwords
        const users = await User.find().select('-password').sort({ firstName: 1, lastName: 1 });

        // Transform user data
        const employees = users.map(user => ({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            department: user.department,
            status: user.status,
            profilePicture: user.profilePicture,
            paidLeaveDays: user.paidLeaveDays,
            lastLeaveUpdate: user.lastLeaveUpdate
        }));

        res.status(200).json({
            message: 'Employees retrieved successfully',
            employees
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

// Validate token controller
exports.validateToken = async (req, res, next) => {
    try {
        // If we get here, the token is valid (authenticateToken middleware already checked it)
        // Just return the user data from the request (added by authenticateToken middleware)
        res.status(200).json({
            message: 'Token is valid',
            user: {
                id: req.userId,
                email: req.userEmail,
                status: req.userStatus
            }
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};