const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^[a-zA-Z0-9._%+-]+@universalai\.in$/, 'Please enter a valid @universalai.in email address']
    },
    test: {
        type: Number,
        required: true,
        min: [0, 'Test score cannot be less than 0'],
        max: [100, 'Test score cannot be more than 100']
    },
    bio: {
        type: String
    },
    phone: {
        type: String
    },
    clubs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club'
    }],
    joinedEvents: [{
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to ensure student can only join one club
studentSchema.pre('save', function(next) {
    if (this.isModified('club') && this.club) {
        // Check if student is already in a club
        if (this.club) {
            const err = new Error('Student can only join one club');
            return next(err);
        }
    }
    next();
});

module.exports = mongoose.model('Student', studentSchema); 