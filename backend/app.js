const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();

// Request logging middleware
app.use((req, res, next) => {
    console.log('[App] Incoming request:', {
        method: req.method,
        path: req.path,
        headers: {
            'content-type': req.headers['content-type'],
            'authorization': req.headers.authorization ? 'Bearer [HIDDEN]' : 'Not provided'
        }
    });
    next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const userRoutes = require('./routes/user_routes');
const requestRoutes = require('./routes/request_routes');
const documentRoutes = require('./routes/document_routes');
const mainRouter = require('./routes/router');

// Routes
app.use('/', mainRouter); // Main router for auth, user management, and departments
app.use('/requests', requestRoutes); // Leave request routes
app.use('/api', documentRoutes); // Document upload routes

// 404 handler
app.use((req, res, next) => {
    console.log('[App] 404 Not Found:', {
        method: req.method,
        path: req.path,
        headers: {
            'content-type': req.headers['content-type'],
            'authorization': req.headers.authorization ? 'Bearer [HIDDEN]' : 'Not provided'
        }
    });
    res.status(404).json({
        message: 'Route not found',
        path: req.path,
        method: req.method
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[App] Error:', {
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode || 500
    });
    
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ 
            message: 'File upload error',
            details: err.message 
        });
    }
    
    res.status(err.statusCode || 500).json({ 
        message: err.message || 'Internal server error',
        details: err.details || err.stack
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('[App] Connected to MongoDB'))
    .catch(err => console.error('[App] MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[App] Server is running on port ${PORT}`);
});

module.exports = app; 