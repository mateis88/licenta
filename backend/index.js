const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv/config');
const router = require('./routes/router');
const requestRoutes = require('./routes/request_routes');
const documentRoutes = require('./routes/document_routes');

const app = express();
const PORT = 3000;

// Request logging middleware
app.use((req, res, next) => {
    console.log('[Server] Incoming request:', {
        method: req.method,
        path: req.path,
        headers: {
            'content-type': req.headers['content-type'],
            'authorization': req.headers.authorization ? 'Bearer [HIDDEN]' : 'Not provided'
        }
    });
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200
}
app.use(cors(corsOptions));

// Register routes
app.use('/', router); // Main router for auth and user management
app.use('/requests', requestRoutes); // Leave request routes
app.use('/api', documentRoutes); // Document upload routes

// 404 handler
app.use((req, res, next) => {
    console.log('[Server] 404 Not Found:', {
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
app.use((error, req, res, next) => {
    console.error('[Server] Error:', {
        message: error.message,
        stack: error.stack,
        statusCode: error.statusCode || 500
    });
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
});

mongoose.connect(process.env.DB_URI)
    .then(() => {
        console.log("[Server] Database connected successfully");
        app.listen(PORT, () => {
            console.log(`[Server] Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("[Server] Database connection error:", err);
    });
