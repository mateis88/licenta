const Event = require('../models/event_schema');
const { validationResult } = require('express-validator');

// Create a new event
const createEvent = async (req, res, next) => {
    try {
        console.log('[Event Controller] Creating new event:', {
            email: req.body.email,
            name: req.body.name,
            date: req.body.date,
            recurring: req.body.recurring,
            type: req.body.type
        });

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const baseEventData = {
            email: req.body.email,
            name: req.body.name,
            description: req.body.description,
            date: new Date(req.body.date),
            location: req.body.location,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            guests: req.body.guests || [],
            type: req.body.type || 'personal'
        };

        // Add private event data if it's a private event
        if (req.body.type === 'private') {
            if (req.body.invitations && req.body.invitations.length > 0) {
                baseEventData.invitations = req.body.invitations;
            } else if (req.body.inviteDepartment) {
                baseEventData.inviteDepartment = req.body.inviteDepartment;
            }
        }

        // Add recurring event data if it's a recurring event
        if (req.body.recurring) {
            baseEventData.recurring = true;
            baseEventData.frequency = req.body.frequency;
            baseEventData.originalDate = new Date(req.body.originalDate || req.body.date);
        }

        const event = new Event(baseEventData);

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

// Get all events for a user (personal events + all public events + private events where invited)
const getUserEvents = async (req, res, next) => {
    try {
        console.log('[Event Controller] Fetching events for user:', req.params.email);

        // Get personal events created by the user
        const personalEvents = await Event.find({ 
            email: req.params.email,
            type: 'personal'
        });

        // Get all public events
        const publicEvents = await Event.find({ 
            type: 'public'
        });

        // Get private events where user is invited individually
        const privateEventsInvited = await Event.find({ 
            type: 'private',
            invitations: req.userId
        });

        // Get private events where user's department is invited
        const privateEventsDepartment = await Event.find({ 
            type: 'private',
            inviteDepartment: req.user.department
        });

        // Combine and sort all events
        const allEvents = [...personalEvents, ...publicEvents, ...privateEventsInvited, ...privateEventsDepartment].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });

        console.log('[Event Controller] Found events:', {
            personal: personalEvents.length,
            public: publicEvents.length,
            privateInvited: privateEventsInvited.length,
            privateDepartment: privateEventsDepartment.length,
            total: allEvents.length
        });

        res.status(200).json({
            events: allEvents
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

        // Check if the user is the owner of the event (can delete both personal and public events they created)
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
            message: event.recurring ? 'Recurring event deleted successfully' : 'Event deleted successfully',
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