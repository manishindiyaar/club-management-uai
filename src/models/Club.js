const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    president: {
        name: String,
        email: {
            type: String,
            required: true
        },
        phone: String
    },
    vicePresident: {
        name: String,
        email: {
            type: String,
            required: true
        },
        phone: String
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    events: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Club', clubSchema); 