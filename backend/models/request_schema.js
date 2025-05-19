const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const documentSchema = new Schema({
    filename: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    }
});

const request_schema = new Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
        ref: 'User'
    },
    type: {
        type: String,
        required: [true, 'Leave type is required'],
        enum: {
            values: ['sick', 'paid', 'unpaid', 'study'],
            message: '{VALUE} is not a valid leave type'
        }
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
        validate: {
            validator: function(endDate) {
                return endDate >= this.startDate;
            },
            message: 'End date must be after or equal to start date'
        }
    },
    documents: [documentSchema],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Request', request_schema, 'requests'); 