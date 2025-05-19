const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createRequest, getUserRequests, deleteRequest, getAllRequests, updateRequestStatus } = require('../controllers/request_controllers');
const { authenticateToken } = require('../middleware/auth');
const { validationResult } = require('express-validator');

// Logging middleware
const logRequest = (req, res, next) => {
    console.log('[Request Route] Incoming request:', {
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

// Validation middleware for request creation
const validateRequest = [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('type')
        .isIn(['sick', 'paid', 'unpaid', 'study'])
        .withMessage('Invalid leave type'),
    body('startDate')
        .isISO8601()
        .withMessage('Invalid start date format'),
    body('endDate')
        .isISO8601()
        .withMessage('Invalid end date format')
];

// Log validation errors
const logValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('[Request Route] Validation errors:', {
            errors: errors.array(),
            body: req.body
        });
    }
    next();
};

// Create new leave request
router.post('/', logRequest, authenticateToken, validateRequest, logValidationErrors, createRequest);

// Get all requests for a user
router.get('/user/:email', authenticateToken, getUserRequests);

// Delete a request
router.delete('/:requestId', authenticateToken, deleteRequest);

// Get all requests (admin only)
router.get('/all', authenticateToken, getAllRequests);

// Update request status (admin only)
router.patch('/:requestId/status', authenticateToken, updateRequestStatus);

module.exports = router; 