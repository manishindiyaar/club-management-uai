const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Event title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Event description is required'],
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Event date is required']
    },
    venue: {
        type: String,
        required: [true, 'Event venue is required'],
        trim: true
    },
    maxParticipants: {
        type: Number,
        required: [true, 'Maximum number of participants is required'],
        min: [1, 'At least one participant must be allowed']
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    organizedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: [true, 'Organizing club is required']
    },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'completed'],
        default: 'upcoming'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Update event status based on date
eventSchema.pre('save', function(next) {
    const now = new Date();
    if (this.date < now) {
        this.status = 'completed';
    } else if (this.date.getDate() === now.getDate()) {
        this.status = 'active';
    } else {
        this.status = 'upcoming';
    }
    next();
});

module.exports = mongoose.model('Event', eventSchema);