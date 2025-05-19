const Event = require('../models/event_schema');
const { validationResult } = require('express-validator');

// Create a new event
const createEvent = async (req, res, next) => {
    try {
        console.log('[Event Controller] Creating new event:', {
            email: req.body.email,
            name: req.body.name,
            date: req.body.date
        });

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const event = new Event({
            email: req.body.email,
            name: req.body.name,
            description: req.body.description,
            date: new Date(req.body.date),
            location: req.body.location,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            guests: req.body.guests || []
        });

        // Validate time range
        if (!event.isValidTimeRange()) {
            const error = new Error('End time must be after start time');
            error.statusCode = 422;
            throw error;
        }

        const savedEvent = await event.save();
        console.log('[Event Controller] Event created successfully:', savedEvent._id);

        res.status(201).json({
            message: 'Event created successfully',
            event: savedEvent
        });
    } catch (err) {
        console.error('[Event Controller] Error creating event:', {
            error: err.message,
            stack: err.stack
        });
        
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

// Get all events for a user
const getUserEvents = async (req, res, next) => {
    try {
        console.log('[Event Controller] Fetching events for user:', req.params.email);

        const events = await Event.find({ email: req.params.email })
            .sort({ date: 1, startTime: 1 });

        console.log('[Event Controller] Found events:', events.length);

        res.status(200).json({
            events: events
        });
    } catch (err) {
        console.error('[Event Controller] Error fetching events:', {
            error: err.message,
            stack: err.stack
        });
        
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

// Delete an event
const deleteEvent = async (req, res, next) => {
    try {
        const eventId = req.params.eventId;
        console.log('[Event Controller] Deleting event:', {
            eventId,
            userEmail: req.user.email
        });

        const event = await Event.findById(eventId);
        
        if (!event) {
            console.log('[Event Controller] Event not found:', eventId);
            const error = new Error('Event not found');
            error.statusCode = 404;
            throw error;
        }

        // Check if the user is the owner of the event
        if (event.email !== req.user.email) {
            console.log('[Event Controller] Unauthorized delete attempt:', {
                eventEmail: event.email,
                userEmail: req.user.email
            });
            const error = new Error('Not authorized to delete this event');
            error.statusCode = 403;
            throw error;
        }

        const deletedEvent = await Event.findByIdAndDelete(eventId);
        console.log('[Event Controller] Event deleted successfully:', {
            eventId,
            deletedEvent
        });

        res.status(200).json({
            message: 'Event deleted successfully',
            eventId: deletedEvent._id
        });
    } catch (err) {
        console.error('[Event Controller] Error deleting event:', {
            error: err.message,
            stack: err.stack,
            eventId: req.params.eventId
        });
        
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

module.exports = {
    createEvent,
    getUserEvents,
    deleteEvent
}; 