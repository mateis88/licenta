const express = require('express');
const {body} = require('express-validator');
const User = require('../models/user_schema')
const router = express.Router();
const user_controllers = require("../controllers/user_controllers");
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');
const eventRoutes = require('./event_routes');

// Serve static files from uploads directory
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

router.post("/login", 
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            .normalizeEmail(),
        body('password')
            .trim()
            .not()
            .isEmpty()
            .withMessage('Password is required.')
    ],
    user_controllers.login
);

router.post("/register", 
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            .normalizeEmail()
            .custom((value, { req }) => {
                return User.findOne({ email: value })
                    .then(userDoc => {
                        if (userDoc) {
                            return Promise.reject('Email already in use.');
                        }
                    });
            }),
        body('password')
            .trim()
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long.'),
        body('firstName')
            .trim()
            .isLength({ min: 2 })
            .withMessage('First name must be at least 2 characters long.'),
        body('lastName')
            .trim()
            .isLength({ min: 2 })
            .withMessage('Last name must be at least 2 characters long.'),
        body('birthDate')
            .isISO8601()
            .withMessage('Please enter a valid birth date.')
            .custom((value) => {
                const date = new Date(value);
                if (date >= new Date()) {
                    throw new Error('Birth date cannot be in the future.');
                }
                return true;
            }),
        body('department')
            .trim()
            .isIn(['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Management'])
            .withMessage('Please select a valid department.')
    ],
    user_controllers.register
);

// Token validation endpoint
router.get("/validate-token", authenticateToken, async (req, res, next) => {
    try {
        console.log('[Router] Validating token for user:', req.userId);
        
        // If we get here, the token is valid (auth middleware would have thrown an error otherwise)
        const user = await User.findById(req.userId).select('-password');
        
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        // Transform user data to match login response format
        const transformedUser = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            birthDate: user.birthDate,
            status: user.status,
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

        console.log('[Router] Token validation successful for user:', transformedUser.email);

        res.status(200).json({
            valid: true,
            user: transformedUser
        });
    } catch (err) {
        console.error('[Router] Token validation error:', {
            error: err.message,
            stack: err.stack
        });
        
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
});

// Profile routes
router.get("/profile/:id", authenticateToken, user_controllers.getProfile);
router.put("/profile/:id", 
    authenticateToken,
    [
        body('email')
            .optional()
            .isEmail()
            .withMessage('Invalid email.')
            .normalizeEmail(),
        body('firstName')
            .optional()
            .trim()
            .not()
            .isEmpty()
            .withMessage('First name cannot be empty.'),
        body('lastName')
            .optional()
            .trim()
            .not()
            .isEmpty()
            .withMessage('Last name cannot be empty.'),
        body('birthDate')
            .optional()
            .isISO8601()
            .withMessage('Invalid birth date format.')
    ],
    user_controllers.updateProfile
);

// Profile picture upload route
router.post(
    '/upload/profile-picture/:id',
    authenticateToken,
    upload.single('profilePicture'),
    user_controllers.uploadProfilePicture
);

// Update the birthdays route to use year and month
router.get("/birthdays/:year/:month", authenticateToken, user_controllers.getBirthdays);

// Event routes
router.use('/events', eventRoutes);

module.exports = router;