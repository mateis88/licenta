const jwt = require('jsonwebtoken');
const User = require('../models/user_schema');

exports.authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            const error = new Error('Authentication required');
            error.statusCode = 401;
            throw error;
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // Find user and attach to request
        const user = await User.findById(decodedToken.userId).select('-password');
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        // Attach both the decoded token info and the full user object
        req.userId = decodedToken.userId;
        req.userStatus = user.status;
        req.userEmail = user.email;
        req.user = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            status: user.status
        };

        next();
    } catch (err) {
        next(err);
    }
}; 