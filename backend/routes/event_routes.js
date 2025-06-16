const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createEvent, getUserEvents, deleteEvent, updateEvent } = require('../controllers/event_controllers');
const { authenticateToken } = require('../middleware/auth');
const { validationResult } = require('express-validator');

// Logging middleware
const logRequest = (req, res, next) => {
    console.log('[Event Route] Incoming request:', {
        method: req.method,
        path: req.path,
        headers: {
            'content-type': req.headers['content-type'],
            'authorization': req.headers.authorization ? 'Bearer [HIDDEN]' : 'Not provided'
        },
        body: req.body
    });
    next();
};

// Validation middleware for event creation
const validateEvent = [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Event name is required'),
    body('date')
        .isISO8601()
        .withMessage('Invalid date format'),
    body('location')
        .isObject()
        .withMessage('Location must be an object'),
    body('location.name')
        .trim()
        .notEmpty()
        .withMessage('Location name is required'),
    body('location.latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Invalid latitude value'),
    body('location.longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Invalid longitude value'),
    body('startTime')
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Invalid start time format (use HH:mm)'),
    body('endTime')
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Invalid end time format (use HH:mm)'),
    body('type')
        .isIn(['personal', 'public', 'private'])
        .withMessage('Event type must be personal, public, or private'),
    body('recurring')
        .optional()
        .isBoolean()
        .withMessage('Recurring must be a boolean'),
    body('frequency')
        .optional()
        .isIn(['weekly', 'monthly', 'yearly'])
        .withMessage('Frequency must be weekly, monthly, or yearly'),
    body('originalDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid original date format'),
    body('invitations')
        .optional()
        .isArray()
        .withMessage('Invitations must be an array'),
    body('inviteDepartment')
        .optional()
        .isString()
        .withMessage('Invite department must be a string')
];

// Log validation errors
const logValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('[Event Route] Validation errors:', {
            errors: errors.array(),
            body: req.body
        });
    }
    next();
};

// Create new event
router.post('/', logRequest, authenticateToken, validateEvent, logValidationErrors, createEvent);

// Update an event
router.put('/:eventId', logRequest, authenticateToken, validateEvent, logValidationErrors, updateEvent);

// Get all events for a user
router.get('/user/:email', authenticateToken, getUserEvents);

// Delete an event
router.delete('/:eventId', authenticateToken, deleteEvent);

module.exports = router; 