const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const address_schema = new Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
        ref: 'User'
    },
    street: {
        type: String,
        trim: true,
        default: ''
    },
    city: {
        type: String,
        trim: true,
        default: ''
    },
    state: {
        type: String,
        trim: true,
        default: ''
    },
    country: {
        type: String,
        trim: true,
        default: ''
    },
    zipCode: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Create an index on the email field for faster lookups
address_schema.index({ email: 1 });

// Custom validation for updates only - only validate non-empty fields
address_schema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    const { $set = {} } = update;
    
    // Only validate non-empty fields
    if ($set.street && $set.street.trim() !== '' && $set.street.length < 3) {
        next(new Error('Street address must be at least 3 characters long'));
    }
    if ($set.city && $set.city.trim() !== '' && $set.city.length < 2) {
        next(new Error('City must be at least 2 characters long'));
    }
    if ($set.state && $set.state.trim() !== '' && $set.state.length < 2) {
        next(new Error('State must be at least 2 characters long'));
    }
    if ($set.country && $set.country.trim() !== '' && $set.country.length < 2) {
        next(new Error('Country must be at least 2 characters long'));
    }
    if ($set.zipCode && $set.zipCode.trim() !== '' && !/^[0-9]{6}$/.test($set.zipCode)) {
        next(new Error('Please enter a valid 6-digit ZIP code'));
    }
    
    next();
});

module.exports = mongoose.model('Address', address_schema, 'addresses'); 