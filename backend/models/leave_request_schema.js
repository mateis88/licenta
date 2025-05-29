const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    department: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        enum: ['vacation', 'sick', 'personal', 'other'],
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    },
    rejectionReason: {
        type: String
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Add validation to ensure endDate is after startDate
leaveRequestSchema.pre('save', function(next) {
    if (this.endDate <= this.startDate) {
        next(new Error('End date must be after start date'));
    }
    next();
});

// Add method to check if a leave request overlaps with a date range
leaveRequestSchema.methods.overlapsWith = function(startDate, endDate) {
    return (
        (this.startDate <= endDate && this.endDate >= startDate)
    );
};

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema); 