const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const Student = require('../models/Student');
const Message = require('../models/Message');
const Event = require('../models/Event');

// Middleware to verify super admin
const verifySuperAdmin = async (req, res, next) => {
    const { email, password } = req.body;
    
    // In a real application, this would be stored securely and hashed
    const SUPER_ADMIN = {
        email: 'renaissance@universalai.in',
        password: 'superadmin123' // This should be hashed in production
    };

    if (email === SUPER_ADMIN.email && password === SUPER_ADMIN.password) {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized access' });
    }
};

// Verify super admin
router.post('/verify', async (req, res) => {
    try {
        const { email } = req.body;
        // TODO: Implement actual verification
        if (email.endsWith('@universalai.edu.in')) {
            res.json({ message: 'Super admin verified' });
        } else {
            res.status(401).json({ message: 'Invalid email domain' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const [totalClubs, totalStudents, activeEvents] = await Promise.all([
            Club.countDocuments(),
            Student.countDocuments(),
            Event.countDocuments({ status: 'upcoming' })
        ]);

        res.json({
            totalClubs,
            totalStudents,
            activeEvents
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Error fetching dashboard statistics' });
    }
});

// Get all clubs with details
router.get('/clubs', async (req, res) => {
    try {
        const clubs = await Club.find()
            .populate('president vicePresident members events')
            .exec();

        res.json({ clubs });
    } catch (error) {
        console.error('Error fetching clubs:', error);
        res.status(500).json({ message: 'Error fetching clubs' });
    }
});

// Get specific club details
router.get('/clubs/:clubId', async (req, res) => {
    try {
        const club = await Club.findById(req.params.clubId)
            .populate('president vicePresident members events')
            .exec();

        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        res.json({ club });
    } catch (error) {
        console.error('Error fetching club:', error);
        res.status(500).json({ message: 'Error fetching club details' });
    }
});

// Create new club
router.post('/clubs', async (req, res) => {
    try {
        const { name, description, presidentEmail, vicePresidentEmail } = req.body;

        // Check if club name already exists
        const existingClub = await Club.findOne({ name });
        if (existingClub) {
            return res.status(400).json({ message: 'Club name already exists' });
        }

        // Find or create president and vice president
        const [president, vicePresident] = await Promise.all([
            Student.findOneAndUpdate(
                { email: presidentEmail },
                { email: presidentEmail },
                { upsert: true, new: true }
            ),
            Student.findOneAndUpdate(
                { email: vicePresidentEmail },
                { email: vicePresidentEmail },
                { upsert: true, new: true }
            )
        ]);

        // Create new club
        const club = new Club({
            name,
            description,
            president: president._id,
            vicePresident: vicePresident._id,
            members: [president._id, vicePresident._id]
        });

        await club.save();

        // Update students' clubs
        await Promise.all([
            Student.findByIdAndUpdate(president._id, { $addToSet: { clubs: club._id } }),
            Student.findByIdAndUpdate(vicePresident._id, { $addToSet: { clubs: club._id } })
        ]);

        res.status(201).json({ message: 'Club created successfully', club });
    } catch (error) {
        console.error('Error creating club:', error);
        res.status(500).json({ message: 'Error creating club' });
    }
});

// Delete club
router.delete('/clubs/:clubId', async (req, res) => {
    try {
        const club = await Club.findById(req.params.clubId);
        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        // Remove club from all members
        await Student.updateMany(
            { _id: { $in: club.members } },
            { $pull: { clubs: club._id } }
        );

        // Delete all club events
        await Event.deleteMany({ club: club._id });

        // Delete all club messages
        await Message.deleteMany({ club: club._id });

        // Delete the club
        await club.deleteOne();

        res.json({ message: 'Club deleted successfully' });
    } catch (error) {
        console.error('Error deleting club:', error);
        res.status(500).json({ message: 'Error deleting club' });
    }
});

// Send message to club(s)
router.post('/messages', async (req, res) => {
    try {
        const { clubId, title, content } = req.body;

        if (clubId === 'all') {
            // Send message to all clubs
            const clubs = await Club.find();
            const messages = clubs.map(club => ({
                club: club._id,
                title,
                content,
                sender: 'super-admin'
            }));

            await Message.insertMany(messages);
            res.json({ message: 'Messages sent to all clubs' });
        } else {
            // Send message to specific club
            const club = await Club.findById(clubId);
            if (!club) {
                return res.status(404).json({ message: 'Club not found' });
            }

            const message = new Message({
                club: club._id,
                title,
                content,
                sender: 'super-admin'
            });

            await message.save();
            res.json({ message: 'Message sent successfully' });
        }
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Error sending message' });
    }
});

// Get all messages
router.get('/messages', async (req, res) => {
    try {
        const messages = await Message.find({ sender: 'super-admin' })
            .populate('club')
            .sort('-createdAt')
            .exec();

        res.json({ messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
});

module.exports = router; 