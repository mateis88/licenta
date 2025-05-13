const User = require('../models/user_schema');
const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const { request } = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

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

        res.status(200).json({
            message: 'Login successful',
            token: token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                status: user.status
            }
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

        // Save user
        const result = await user.save();

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
exports.getProfile = (req, res, next) => {
    const userId = req.params.userId;
    
    User.findById(userId)
        .select('-password') // Exclude password from the response
        .then(user => {
            if (!user) {
                const error = new Error('User not found.');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                message: 'Profile fetched successfully.',
                user: user
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

// Update user profile
exports.updateProfile = (req, res, next) => {
    const userId = req.params.userId;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    const { firstName, lastName, email, birthDate } = req.body;

    User.findById(userId)
        .then(user => {
            if (!user) {
                const error = new Error('User not found.');
                error.statusCode = 404;
                throw error;
            }

            user.firstName = firstName || user.firstName;
            user.lastName = lastName || user.lastName;
            user.email = email || user.email;
            user.birthDate = birthDate || user.birthDate;

            return user.save();
        })
        .then(result => {
            res.status(200).json({
                message: 'Profile updated successfully.',
                user: {
                    firstName: result.firstName,
                    lastName: result.lastName,
                    email: result.email,
                    birthDate: result.birthDate,
                    profilePicture: result.profilePicture
                }
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

// Update profile picture
exports.updateProfilePicture = (req, res, next) => {
    const userId = req.params.userId;

    if (!req.file) {
        const error = new Error('No image provided.');
        error.statusCode = 422;
        throw error;
    }

    const imageUrl = req.file.path.replace(/\\/g, '/');

    User.findById(userId)
        .then(user => {
            if (!user) {
                const error = new Error('User not found.');
                error.statusCode = 404;
                throw error;
            }

            // Delete old image if exists
            if (user.profilePicture) {
                const oldImagePath = path.join(__dirname, '..', user.profilePicture);
                fs.unlink(oldImagePath, err => {
                    if (err) {
                        console.log('Error deleting old image:', err);
                    }
                });
            }

            user.profilePicture = imageUrl;
            return user.save();
        })
        .then(result => {
            res.status(200).json({
                message: 'Profile picture updated successfully.',
                profilePicture: result.profilePicture
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};