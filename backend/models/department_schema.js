const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    numberOfEmployees: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    maxEmployeesOnLeave: {
        type: Number,
        required: true,
        min: 1
    },
    currentEmployeesOnLeave: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Add a method to check if more employees can go on leave
departmentSchema.methods.canAddEmployeeOnLeave = function() {
    return this.currentEmployeesOnLeave < this.maxEmployeesOnLeave;
};

// Add a method to increment/decrement current employees on leave
departmentSchema.methods.updateEmployeesOnLeave = async function(increment) {
    const newCount = this.currentEmployeesOnLeave + increment;
    if (newCount < 0 || newCount > this.maxEmployeesOnLeave) {
        throw new Error('Invalid number of employees on leave');
    }
    this.currentEmployeesOnLeave = newCount;
    return this.save();
};

// Add a method to update total number of employees
departmentSchema.methods.updateNumberOfEmployees = async function(count) {
    if (count < 0) {
        throw new Error('Number of employees cannot be negative');
    }
    this.numberOfEmployees = count;
    return this.save();
};

module.exports = mongoose.model('Department', departmentSchema); 