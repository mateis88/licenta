const express = require('express');
const {body} = require('express-validator');
const User = require('../models/user_schema')
const Department = require('../models/department_schema');
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
router.get("/validate-token", authenticateToken, user_controllers.validateToken);

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
            .withMessage('Invalid birth date format.'),
        body('department')
            .optional()
            .trim()
            .isIn(['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Management'])
            .withMessage('Please select a valid department.')
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

// Get all employees (admin only)
router.get('/employees', authenticateToken, user_controllers.getAllEmployees);

// Department routes
router.get('/departments', authenticateToken, async (req, res, next) => {
    try {
        // Get all departments from the departments collection
        const departments = await Department.find()
            .select('name numberOfEmployees maxEmployeesOnLeave currentEmployeesOnLeave')
            .sort({ name: 1 });
        
        // Format the response
        const formattedDepartments = departments.map(dept => ({
            id: dept._id,
            name: dept.name,
            numberOfEmployees: dept.numberOfEmployees,
            maxEmployeesOnLeave: dept.maxEmployeesOnLeave,
            currentEmployeesOnLeave: dept.currentEmployeesOnLeave
        }));

        res.json({ departments: formattedDepartments });
    } catch (err) {
        next(err);
    }
});

// Get department details by name
router.get('/departments/:name', authenticateToken, async (req, res, next) => {
    try {
        const departmentName = req.params.name;
        
        // Find department in the departments collection
        let department = await Department.findOne({ name: departmentName });
        
        // If department doesn't exist in departments collection, create it
        if (!department) {
            // Count actual employees in this department
            const employeeCount = await User.countDocuments({ department: departmentName });
            
            // Create new department with default values
            department = new Department({
                name: departmentName,
                numberOfEmployees: employeeCount,
                maxEmployeesOnLeave: Math.ceil(employeeCount * 0.2), // Default to 20% of employees
                currentEmployeesOnLeave: 0
            });
            await department.save();
        }

        // Get list of employees in this department
        const employees = await User.find({ department: departmentName })
            .select('firstName lastName email status profilePicture')
            .sort({ firstName: 1, lastName: 1 });

        res.json({
            department: {
                ...department.toObject(),
                employees
            }
        });
    } catch (err) {
        next(err);
    }
});

// Department routes
router.post('/departments', authenticateToken, async (req, res, next) => {
    try {
        // Check if user is admin
        if (req.userStatus !== 'admin') {
            const error = new Error('Access denied. Admin privileges required.');
            error.statusCode = 403;
            throw error;
        }

        const { name, maxEmployeesOnLeave } = req.body;

        // Validate input
        if (!name || !maxEmployeesOnLeave) {
            const error = new Error('Department name and max employees on leave are required');
            error.statusCode = 400;
            throw error;
        }

        // Check if department already exists
        const existingDepartment = await Department.findOne({ name });
        if (existingDepartment) {
            const error = new Error('Department already exists');
            error.statusCode = 409;
            throw error;
        }

        // Create new department
        const department = new Department({
            name,
            maxEmployeesOnLeave,
            numberOfEmployees: 0,
            currentEmployeesOnLeave: 0
        });

        await department.save();

        res.status(201).json({
            message: 'Department created successfully',
            department
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;