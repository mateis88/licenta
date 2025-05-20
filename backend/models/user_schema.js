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
    paidLeaveDays: {
        type: Number,
        default: 21,
        min: [0, 'Paid leave days cannot be negative']
    },
    lastLeaveUpdate: {
        type: Date,
        default: Date.now
    },
    // Optional profile fields
    profilePicture: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        trim: true,
        maxlength: [500, 'Bio cannot be longer than 500 characters']
    },
    phoneNumber: {
        type: String,
        trim: true,
        match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Please enter a valid phone number']
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Add a pre-save middleware to update paid leave days annually
user_schema.pre('save', async function(next) {
    const now = new Date();
    const lastUpdate = this.lastLeaveUpdate || this.createdAt;
    
    // Check if a year has passed since the last update
    const yearsSinceLastUpdate = now.getFullYear() - lastUpdate.getFullYear();
    
    if (yearsSinceLastUpdate > 0) {
        // Add 21 days for each year that has passed
        this.paidLeaveDays += (21 * yearsSinceLastUpdate);
        this.lastLeaveUpdate = now;
    }
    
    next();
});

module.exports = mongoose.model('User', user_schema);