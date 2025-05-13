const express = require('express');
const {body} = require('express-validator');
const User = require('../models/user_schema')
const router = express.Router();
const user_controllers = require("../controllers/user_controllers");
const upload = require('../middleware/file-upload');
const path = require('path');


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
            })
    ],
    user_controllers.register
);

// Profile routes
router.get("/profile/:userId", user_controllers.getProfile);
router.put("/profile/:userId", 
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
router.put("/profile/:userId/picture", upload.single('image'), user_controllers.updateProfilePicture);

// Serve uploaded files
router.use('/uploads', express.static(path.join(__dirname, 'uploads')));

module.exports = router;