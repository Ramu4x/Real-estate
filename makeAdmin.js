const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const emailToFind = 'k.ramu51797@gmail.com'; // User from checkDb.js
        let user = await User.findOne({ email: emailToFind });
        
        if (user) {
            user.role = 'admin';
            await user.save();
            console.log(`Successfully updated ${user.email} to Admin!`);
        } else {
            console.log(`User ${emailToFind} not found. Creating a new admin account...`);
            user = new User({
                name: 'Admin User',
                email: emailToFind,
                password: 'password123', // Default password
                role: 'admin',
                isVerified: true
            });
            await user.save();
            console.log(`Successfully created new Admin account for ${user.email} with password: password123`);
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit(0);
    }
});
