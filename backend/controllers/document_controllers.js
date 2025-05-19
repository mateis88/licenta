const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        try {
            const uploadDir = path.join(__dirname, '../uploads/documents');
            console.log('[Document Upload] Upload directory:', uploadDir);
            
            // Create directory if it doesn't exist
            if (!fs.existsSync(uploadDir)) {
                console.log('[Document Upload] Creating upload directory...');
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        } catch (error) {
            console.error('[Document Upload] Error in destination setup:', error);
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        try {
            // Create unique filename with original extension
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const filename = uniqueSuffix + path.extname(file.originalname);
            console.log('[Document Upload] Generated filename:', filename);
            cb(null, filename);
        } catch (error) {
            console.error('[Document Upload] Error in filename generation:', error);
            cb(error);
        }
    }
});

// File filter to only allow specific file types
const fileFilter = (req, file, cb) => {
    try {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();
        console.log('[Document Upload] Checking file type:', {
            filename: file.originalname,
            type: file.mimetype,
            extension: ext,
            size: file.size
        });
        
        if (allowedTypes.includes(ext)) {
            console.log('[Document Upload] File type accepted');
            cb(null, true);
        } else {
            console.log('[Document Upload] File type rejected:', ext);
            cb(new Error(`Invalid file type: ${ext}. Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed.`));
        }
    } catch (error) {
        console.error('[Document Upload] Error in file filter:', error);
        cb(error);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Middleware to handle multiple file uploads
const uploadMiddleware = upload.array('documents', 5); // Allow up to 5 files

// Controller function to handle document uploads
const uploadDocuments = (req, res) => {
    console.log('[Document Upload] Request received:', {
        method: req.method,
        url: req.url,
        headers: {
            'content-type': req.headers['content-type'],
            'authorization': req.headers.authorization ? 'Bearer [HIDDEN]' : 'Not provided'
        }
    });

    uploadMiddleware(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.error('[Document Upload] Multer error:', {
                code: err.code,
                message: err.message,
                field: err.field,
                storageErrors: err.storageErrors
            });
            
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ 
                    message: 'File size too large. Maximum size is 5MB.',
                    details: err.message
                });
            }
            return res.status(400).json({ 
                message: 'File upload error',
                details: err.message
            });
        } else if (err) {
            console.error('[Document Upload] General error:', err);
            return res.status(400).json({ 
                message: 'File upload failed',
                details: err.message
            });
        }

        // If no files were uploaded
        if (!req.files || req.files.length === 0) {
            console.log('[Document Upload] No files in request');
            return res.status(400).json({ 
                message: 'No files were uploaded.',
                details: 'Please select at least one file to upload'
            });
        }

        console.log('[Document Upload] Files received:', req.files.map(f => ({
            filename: f.originalname,
            size: f.size,
            mimetype: f.mimetype
        })));

        try {
            // Process the uploaded files
            const documents = req.files.map(file => ({
                filename: file.originalname,
                path: file.path.replace(/\\/g, '/'), // Convert Windows paths to forward slashes
                uploadDate: new Date()
            }));

            console.log('[Document Upload] Successfully processed files:', documents);

            res.status(200).json({
                message: 'Files uploaded successfully',
                documents: documents
            });
        } catch (error) {
            console.error('[Document Upload] Error processing files:', error);
            res.status(500).json({
                message: 'Error processing uploaded files',
                details: error.message
            });
        }
    });
};

module.exports = {
    uploadDocuments
}; 