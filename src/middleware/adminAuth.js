const Club = require('../models/Club');

const adminAuth = async (req, res, next) => {
    try {
        // Get admin email from request headers
        const adminEmail = req.headers['x-admin-email'];
        console.log('Admin auth - headers:', req.headers);
        console.log('Admin auth - email:', adminEmail);

        if (!adminEmail) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Find the club where this admin is president or vice president
        const club = await Club.findOne({
            $or: [
                { 'president.email': adminEmail },
                { 'vicePresident.email': adminEmail }
            ]
        });

        console.log('Admin auth - found club:', club);

        if (!club) {
            return res.status(401).json({ message: 'Not authorized as admin' });
        }

        // Attach admin and club info to request
        req.admin = {
            email: adminEmail,
            club: club._id
        };

        console.log('Admin auth - attached info:', req.admin);
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(500).json({ message: 'Error authenticating admin' });
    }
};

module.exports = adminAuth; 