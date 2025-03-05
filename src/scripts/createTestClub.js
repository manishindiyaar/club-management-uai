const mongoose = require('mongoose');
const Club = require('../models/Club');
require('dotenv').config();

async function createTestClub() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create test club
        const testClub = new Club({
            name: 'Test Club',
            description: 'A test club for development purposes',
            president: {
                name: 'Test Admin',
                email: 'test@universalai.in',
                phone: '1234567890'
            },
            vicePresident: {
                name: 'Test Vice Admin',
                email: 'vp.test@universalai.in',
                phone: '0987654321'
            },
            members: []
        });

        await testClub.save();
        console.log('Test club created successfully:', testClub);

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createTestClub(); 