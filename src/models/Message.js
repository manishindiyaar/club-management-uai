const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    from: {
        type: String,
        required: true,
        enum: ['superadmin']
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true
    },
    readBy: [{
        user: String,  // president or vicePresident
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', messageSchema); 