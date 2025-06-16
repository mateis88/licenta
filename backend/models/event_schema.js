const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    ref: 'User'  // Reference to the User model
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  guests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'  // Reference to the User model for each guest
  }],
  startTime: {
    type: String,
    required: true,
    // Format: "HH:mm" (24-hour format)
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time format! Use HH:mm (24-hour format)`
    }
  },
  endTime: {
    type: String,
    required: true,
    // Format: "HH:mm" (24-hour format)
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time format! Use HH:mm (24-hour format)`
    }
  },
  // Event type field
  type: {
    type: String,
    enum: ['personal', 'public', 'private'],
    required: true,
    default: 'personal'
  },
  // Invitation fields for private events
  invitations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'  // Reference to the User model for each invited user
  }],
  // Invite all department members (alternative to individual invitations)
  inviteDepartment: {
    type: String,
    required: function() {
      return this.type === 'private' && (!this.invitations || this.invitations.length === 0);
    }
  },
  // Recurring event fields
  recurring: {
    type: Boolean,
    default: false
  },
  frequency: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    required: function() {
      return this.recurring === true;
    }
  },
  originalDate: {
    type: Date,
    required: function() {
      return this.recurring === true;
    }
  }
}, {
  timestamps: true  // Adds createdAt and updatedAt fields
});

// Add a compound index on email and date for faster queries
eventSchema.index({ email: 1, date: 1 });

// Add a method to check if a time is valid
eventSchema.methods.isValidTimeRange = function() {
  const start = this.startTime.split(':').map(Number);
  const end = this.endTime.split(':').map(Number);
  
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  return endMinutes > startMinutes;
};

// Add a pre-save middleware to validate time range
eventSchema.pre('save', function(next) {
  if (!this.isValidTimeRange()) {
    next(new Error('End time must be after start time'));
  }
  next();
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event; 