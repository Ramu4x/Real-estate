const mongoose = require('mongoose');
require('dotenv').config();
const Property = require('../models/Property');

async function checkProperties() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const properties = await Property.find({ status: "available" });
        console.log(`Total available properties: ${properties.length}`);

        properties.forEach(p => {
            console.log(`- ${p.title} | Location: ${p.location} | Price: ${p.price} | Type: ${p.type} | Status: ${p.status}`);
        });

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkProperties();
