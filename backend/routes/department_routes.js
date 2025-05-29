const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/user_schema');

// Get all departments
router.get('/', authenticateToken, async (req, res, next) => {
    try {
        // Get unique departments from users
        const departments = await User.distinct('department');
        
        // Filter out null/undefined/empty values and format the response
        const formattedDepartments = departments
            .filter(dept => dept) // Remove null/undefined/empty values
            .map((dept, index) => ({
                id: index + 1, // Simple ID generation
                name: dept
            }));

        res.json({ departments: formattedDepartments });
    } catch (err) {
        next(err);
    }
});

module.exports = router; 