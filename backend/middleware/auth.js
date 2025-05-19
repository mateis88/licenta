const jwt = require('jsonwebtoken');
const User = require('../models/user_schema');

exports.authenticateToken = async (req, res, next) => {
    try {
        console.log('[Auth] Authenticating request:', {
            path: req.path,
            headers: {
                'content-type': req.headers['content-type'],
                'authorization': req.headers.authorization ? 'Bearer [HIDDEN]' : 'Not provided'
            }
        });

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            const error = new Error('Authentication required');
            error.statusCode = 401;
            throw error;
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[Auth] Token verified:', {
            userId: decodedToken.userId,
            email: decodedToken.email
        });

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
        req.user = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            status: user.status
        };

        next();
    } catch (err) {
        console.error('[Auth] Authentication error:', {
            error: err.message,
            stack: err.stack
        });
        
        if (err.name === 'JsonWebTokenError') {
            err.statusCode = 401;
            err.message = 'Invalid token';
        } else if (err.name === 'TokenExpiredError') {
            err.statusCode = 401;
            err.message = 'Token expired';
        }
        
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}; 