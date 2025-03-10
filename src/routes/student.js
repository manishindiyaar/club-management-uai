const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Club = require('../models/Club');
const Event = require('../models/Event');

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
        .populate('organizedBy', 'name')
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

// Get all clubs
router.get('/clubs', async (req, res) => {
    try {
        const clubs = await Club.find().select('name description president vicePresident members');
        res.json({ clubs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Student Login - Simplified
router.post('/login', async (req, res) => {
    try {
        const { email } = req.body;
        console.log('Student login attempt with email:', email);

        // Find student by email
        const student = await Student.findOne({ email });
        if (!student) {
            console.log('Student not found with email:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Return success with student info
        console.log('Student login successful:', student.name);
        res.status(200).json({ 
            success: true, 
            message: 'Login successful',
            student: {
                id: student._id,
                name: student.name,
                email: student.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get student's joined events - Simplified
router.get('/my-events', async (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find student by email
        const student = await Student.findOne({ email }).populate('joinedEvents.event');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json(student.joinedEvents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 