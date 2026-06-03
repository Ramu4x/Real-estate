const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const emailToFind = 'k.ramu51797@gmail.com'; // User from checkDb.js
        const user = await User.findOne({ email: emailToFind });
        
        if (user) {
            user.role = 'admin';
            await user.save();
            console.log(`Successfully updated ${user.email} to Admin!`);
        } else {
            console.log(`User ${emailToFind} not found. Register them first.`);
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit(0);
    }
});
