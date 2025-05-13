const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const user_schema = new Schema({
    firstName: {
        type: String, 
        required: [true, 'First name is required'],
        trim: true,
        minlength: [2, 'First name must be at least 2 characters long']
    },
    lastName: {
        type: String, 
        required: [true, 'Last name is required'],
        trim: true,
        minlength: [2, 'Last name must be at least 2 characters long']
    },
    birthDate: {
        type: Date, 
        required: [true, 'Birth date is required'],
        validate: {
            validator: function(date) {
                return date < new Date();
            },
            message: 'Birth date cannot be in the future'
        }
    },
    email: {
        type: String, 
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String, 
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    status: {
        type: String,
        enum: ['regular', 'admin'],
        default: 'regular'
    },
    profilePicture: {
        type: String
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Add index for faster email lookups
user_schema.index({ email: 1 });

module.exports = mongoose.model('User', user_schema);