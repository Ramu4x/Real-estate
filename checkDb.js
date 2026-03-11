const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections in 'realestate' DB:", collections.map(c => c.name));

        const User = require('./models/User');
        const Property = require('./models/Property');

        const users = await User.find();
        console.log(`Users count: ${users.length}`);
        if (users.length > 0) {
            console.log("Sample user:", users[0].email);
        }

        const properties = await Property.find();
        console.log(`Properties count: ${properties.length}`);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit(0);
    }
});
