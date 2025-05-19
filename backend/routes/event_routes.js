const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createEvent, getUserEvents, deleteEvent } = require('../controllers/event_controllers');
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
        .trim()
        .notEmpty()
        .withMessage('Location is required'),
    body('startTime')
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Invalid start time format (use HH:mm)'),
    body('endTime')
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Invalid end time format (use HH:mm)')
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

// Get all events for a user
router.get('/user/:email', authenticateToken, getUserEvents);

// Delete an event
router.delete('/:eventId', authenticateToken, deleteEvent);

module.exports = router; 