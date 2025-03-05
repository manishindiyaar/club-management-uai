const mongoose = require('mongoose');
const SuperAdmin = require('../models/SuperAdmin');
require('dotenv').config();

async function createSuperAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if super admin exists
        let superAdmin = await SuperAdmin.findOne({ email: 'admin@universalai.in' });

        if (superAdmin) {
            console.log('Super admin already exists:', superAdmin.email);
        } else {
            // Create new super admin
            superAdmin = new SuperAdmin({
                name: 'Super Admin',
                email: 'admin@universalai.in',
                password: 'admin123' // This will be hashed automatically by the model
            });

            await superAdmin.save();
            console.log('Created new super admin with email:', superAdmin.email);
        }

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createSuperAdmin(); 