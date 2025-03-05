const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const Event = require('../models/Event');
const Student = require('../models/Student');
const Message = require('../models/Message');
const adminAuth = require('../middleware/adminAuth');
const mongoose = require('mongoose');

// Verify admin (club president/vice-president)
router.post('/verify', async (req, res) => {
    try {
        const { email } = req.body;
        
        // First check if email is from the correct domain
        if (!email.endsWith('@universalai.in')) {
            return res.status(401).json({ message: 'Invalid email domain. Please use @universalai.in email' });
        }

        const club = await Club.findOne({
            $or: [
                { 'president.email': email },
                { 'vicePresident.email': email }
            ]
        });
        
        if (!club) {
            return res.status(401).json({ message: 'Not authorized as admin' });
        }
        
        res.json({
            message: 'Verified',
            club
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error verifying admin' });
    }
});

// Protected routes - require admin authentication
router.use(adminAuth);

// Create new event
router.post('/events', async (req, res) => {
    try {
        const { title, description, date, venue, maxParticipants, organizedBy } = req.body;

        console.log('Received event data:', {
            title,
            description,
            date,
            venue,
            maxParticipants,
            organizedBy
        });

        // Validate required fields
        const missingFields = [];
        if (!title) missingFields.push('title');
        if (!description) missingFields.push('description');
        if (!date) missingFields.push('date');
        if (!venue) missingFields.push('venue');
        if (!maxParticipants) missingFields.push('maxParticipants');
        if (!organizedBy) missingFields.push('organizedBy');

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Convert organizedBy to ObjectId
        const clubId = new mongoose.Types.ObjectId(organizedBy);

        // Create and validate the event object before saving
        const event = new Event({
            title,
            description,
            date: new Date(date),
            venue,
            maxParticipants: Number(maxParticipants),
            participants: [],
            organizedBy: clubId
        });

        // Log the created event object
        console.log('Event object before save:', event.toObject());

        // Validate the event object
        const validationError = event.validateSync();
        if (validationError) {
            console.error('Validation error:', validationError);
            return res.status(400).json({
                message: 'Validation error',
                errors: validationError.errors
            });
        }

        // Save the event
        await event.save();
        res.status(201).json({ message: 'Event created successfully', event });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            message: 'Error creating event',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get club's events
router.get('/events', async (req, res) => {
    try {
        console.log('GET /events route hit');
        // Ensure we're sending JSON response
        res.setHeader('Content-Type', 'application/json');
        
        // Get admin's club ID from the request (set by adminAuth middleware)
        const clubId = req.admin.club;
        console.log('Fetching events for club:', clubId);

        // Find events organized by this club
        const events = await Event.find({ organizedBy: clubId })
            .populate('participants', 'name email')
            .sort({ date: 1 });
        
        console.log('Found events:', events);    
        res.json({ events });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ 
            message: 'Error fetching events',
            error: error.message 
        });
    }
});

// Update event
router.put('/events/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { title, description, date, venue, maxParticipants } = req.body;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if reducing maxParticipants below current participants
        if (maxParticipants < event.participants.length) {
            return res.status(400).json({ 
                message: 'Cannot reduce maximum participants below current participants count' 
            });
        }

        event.title = title;
        event.description = description;
        event.date = date;
        event.venue = venue;
        event.maxParticipants = maxParticipants;

        await event.save();
        res.json({ message: 'Event updated successfully', event });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(400).json({ message: error.message || 'Error updating event' });
    }
});

// Delete event
router.delete('/events/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await Event.findByIdAndDelete(eventId);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ message: 'Error deleting event' });
    }
});

// Get all students
router.get('/students', async (req, res) => {
    try {
        const students = await Student.find().select('-clubs');
        res.json({ students });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error fetching students' });
    }
});

// Add new student
router.post('/students', async (req, res) => {
    try {
        const { name, email, test, bio } = req.body;

        // Validate email domain
        if (!email || !email.match(/^[a-zA-Z0-9._%+-]+@universalai\.in$/)) {
            return res.status(400).json({ 
                message: 'Invalid email format. Please use a valid @universalai.in email address' 
            });
        }

        // Check if student already exists
        let student = await Student.findOne({ email });
        if (student) {
            return res.status(400).json({ message: 'Student already exists' });
        }

        // Create new student
        student = new Student({
            name,
            email,
            test,
            bio
        });

        await student.save();
        res.status(201).json({ message: 'Student added successfully', student });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error adding student' });
    }
});

// Update student
router.put('/students/:studentId', async (req, res) => {
    try {
        const { name, email, test, bio } = req.body;
        const student = await Student.findById(req.params.studentId);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Update student details
        student.name = name || student.name;
        student.email = email || student.email;
        student.test = test || student.test;
        student.bio = bio || student.bio;

        await student.save();
        res.json({ message: 'Student updated successfully', student });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error updating student' });
    }
});

// Delete student
router.delete('/students/:studentId', async (req, res) => {
    try {
        const student = await Student.findById(req.params.studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Remove student from all clubs
        await Club.updateMany(
            { members: student._id },
            { $pull: { members: student._id } }
        );

        await student.deleteOne();
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error deleting student' });
    }
});

// Verify student login
router.post('/verify-student', async (req, res) => {
    try {
        const { email } = req.body;
        const student = await Student.findOne({ email });

        if (!student) {
            return res.status(401).json({ message: 'Student not found' });
        }

        // Check if student has passed the test (score > 70)
        if (student.test < 70) {
            return res.status(401).json({ 
                message: 'Test score too low. Required: 70, Your score: ' + student.test 
            });
        }

        res.json({
            message: 'Login successful',
            student
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error verifying student' });
    }
});

// Get club messages
router.get('/messages/:clubId', async (req, res) => {
    try {
        const messages = await Message.find({ to: req.params.clubId })
            .sort({ createdAt: -1 });
        res.json({ messages });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get event participants
router.get('/events/:eventId/participants', async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await Event.findOne({ _id: eventId })
            .populate('participants', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json({ participants: event.participants });
    } catch (error) {
        console.error('Error fetching participants:', error);
        res.status(500).json({ message: 'Error fetching participants' });
    }
});

module.exports = router; 