const express = require('express');
const router = express.Router();
const SuperAdmin = require('../models/SuperAdmin');
const Club = require('../models/Club');
const Event = require('../models/Event');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

// Middleware to verify super admin token
const superAdminAuth = async (req, res, next) => {
    try {
        const token = req.header('X-Super-Admin-Token');
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const superAdmin = await SuperAdmin.findById(decoded.id);
        
        if (!superAdmin) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        req.superAdmin = superAdmin;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Super Admin Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find super admin by email
        const superAdmin = await SuperAdmin.findOne({ email });
        if (!superAdmin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await superAdmin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: superAdmin._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            superAdmin: {
                id: superAdmin._id,
                name: superAdmin.name,
                email: superAdmin.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login' });
    }
});

// Protected routes
router.use(superAdminAuth);

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
    try {
        const stats = {
            totalClubs: await Club.countDocuments(),
            totalEvents: await Event.countDocuments(),
            totalStudents: await Student.countDocuments(),
            recentEvents: await Event.find()
                .sort({ date: -1 })
                .limit(5)
                .populate('organizedBy', 'name'),
            recentStudents: await Student.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('-password')
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Error fetching dashboard statistics' });
    }
});

// Get all clubs
router.get('/clubs', async (req, res) => {
    try {
        const clubs = await Club.find()
            .populate('president', 'name email')
            .populate('vicePresident', 'name email')
            .populate('members', 'name email');
        res.json({ clubs });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching clubs' });
    }
});

// Get all events
router.get('/events', async (req, res) => {
    try {
        const events = await Event.find()
            .populate('organizedBy', 'name')
            .populate('participants', 'name email')
            .sort({ date: -1 });
        res.json({ events });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events' });
    }
});

// Get all students
router.get('/students', async (req, res) => {
    try {
        const students = await Student.find()
            .select('-password')
            .populate('clubs', 'name');
        res.json({ students });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students' });
    }
});

// Create a new club
router.post('/clubs', async (req, res) => {
    try {
        const club = new Club(req.body);
        await club.save();
        res.status(201).json({ message: 'Club created successfully', club });
    } catch (error) {
        res.status(500).json({ message: 'Error creating club' });
    }
});

// Update club
router.put('/clubs/:id', async (req, res) => {
    try {
        const club = await Club.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }
        res.json({ message: 'Club updated successfully', club });
    } catch (error) {
        res.status(500).json({ message: 'Error updating club' });
    }
});

// Delete club
router.delete('/clubs/:id', async (req, res) => {
    try {
        const club = await Club.findByIdAndDelete(req.params.id);
        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }
        res.json({ message: 'Club deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting club' });
    }
});

module.exports = router; 