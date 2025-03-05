const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Club = require('../models/Club');
const Event = require('../models/Event');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.student = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Student login/verification
router.post('/verify', async (req, res) => {
    try {
        const { email } = req.body;
        const student = await Student.findOne({ email });
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        res.json({ student });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get student's club details
router.get('/club/:studentId', async (req, res) => {
    try {
        const student = await Student.findById(req.params.studentId).populate('club');
        if (!student || !student.club) {
            return res.status(404).json({ message: 'No club found for this student' });
        }
        res.json({ club: student.club });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all events (active and upcoming)
router.get('/events', async (req, res) => {
    try {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today

        const events = await Event.find({
            date: { $gte: now }
        })
        .populate('participants', 'email')
        .populate('club', 'name')
        .sort({ date: 1 });

        res.json({ events });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});

// Join an event
router.post('/events/:eventId/join', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { email } = req.body;

        // Find the student
        const student = await Student.findOne({ email });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check if student's test score is sufficient
        if (student.test < 70) {
            return res.status(403).json({ 
                message: 'You need a test score of at least 70 to join events' 
            });
        }

        // Find the event
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if event is full
        if (event.participants.length >= event.maxParticipants) {
            return res.status(400).json({ message: 'Event is full' });
        }

        // Check if student is already participating
        if (event.participants.includes(student._id)) {
            return res.status(400).json({ message: 'Already joined this event' });
        }

        // Add student to event participants
        event.participants.push(student._id);
        await event.save();

        res.json({ message: 'Successfully joined the event' });
    } catch (error) {
        console.error('Error joining event:', error);
        res.status(500).json({ message: 'Error joining event' });
    }
});

// Protected routes
router.get('/my-events', verifyToken, async (req, res) => {
    try {
        const { email } = req.query;
        const student = await Student.findOne({ email });
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const events = await Event.find({
            participants: student._id
        })
        .populate('club', 'name')
        .sort({ date: -1 });

        res.json({ events });
    } catch (error) {
        console.error('Error fetching student events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});

// Get all clubs
router.get('/clubs', async (req, res) => {
    try {
        const clubs = await Club.find().select('name description president vicePresident members');
        res.json({ clubs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Student Login
router.post('/login', async (req, res) => {
    try {
        const { email } = req.body;

        // Find student by email
        const student = await Student.findOne({ email });
        if (!student) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ studentId: student._id }, process.env.JWT_SECRET);

        res.status(200).json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 