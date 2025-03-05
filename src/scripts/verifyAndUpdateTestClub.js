const mongoose = require('mongoose');
const Club = require('../models/Club');
require('dotenv').config();

async function verifyAndUpdateTestClub() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find the test club
        let testClub = await Club.findOne({ name: 'Test Club' });

        if (testClub) {
            console.log('Found existing test club:', testClub);
            
            // Update the club with correct email format
            testClub.president.email = 'test@universalai.in';
            testClub.vicePresident.email = 'vp.test@universalai.in';
            
            await testClub.save();
            console.log('Updated test club with correct email format');
        } else {
            // Create new test club if it doesn't exist
            testClub = new Club({
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
            console.log('Created new test club');
        }

        console.log('Final test club data:', testClub);

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

verifyAndUpdateTestClub(); 