const mongoose = require('mongoose');
const Property = require('../models/Property');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

const properties = [
    {
        title: "Modern Minimalist Villa",
        description: "A stunning minimalist villa with breathtaking ocean views. Features open-plan living and high-end finishes.",
        price: 100000000,
        location: "Goa, India",
        type: "house",
        bedrooms: 4,
        bathrooms: 3.5,
        area: 3200,
        amenities: ["Ocean View", "Pool", "Smart Home", "Garage"],
        status: "available",
        images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"]
    },
    {
        title: "Luxury Penthouse Suite",
        description: "Experience the height of luxury in this downtown penthouse. Floor-to-ceiling windows and private terrace.",
        price: 200000000,
        location: "Mumbai, Maharashtra",
        type: "flat",
        bedrooms: 3,
        bathrooms: 3,
        area: 2800,
        amenities: ["Skyline View", "Private Terrace", "Gym", "Concierge"],
        status: "available",
        images: ["https://images.unsplash.com/photo-1567496898669-ee935f5f647a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"]
    },
    {
        title: "Charming Family Home",
        description: "Perfect home for a growing family in a quiet suburban neighborhood. Large backyard and modern kitchen.",
        price: 36000000,
        location: "Pune, Maharashtra",
        type: "house",
        bedrooms: 5,
        bathrooms: 3,
        area: 2500,
        amenities: ["Backyard", "Garden", "Fireplace", "Quiet Neighborhood"],
        status: "available",
        images: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"]
    },
    {
        title: "Contemporary Loft",
        description: "Industrial style loft in the arts district. High ceilings, exposed brick, and gourmet kitchen.",
        price: 62400000,
        location: "Bengaluru, Karnataka",
        type: "flat",
        bedrooms: 2,
        bathrooms: 2,
        area: 1800,
        amenities: ["Exposed Brick", "Gourmet Kitchen", "Parking", "City View"],
        status: "available",
        images: ["https://images.unsplash.com/photo-1536376074432-85634975efcb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"]
    },
    {
        title: "Industrial Warehouse Space",
        description: "Large commercial warehouse space suitable for various business needs. High clearance and easy access.",
        price: 120000000,
        location: "Delhi, India",
        type: "commercial",
        bedrooms: 0,
        bathrooms: 2,
        area: 8000,
        amenities: ["High Clearance", "Loading Dock", "Office Space", "Security"],
        status: "available",
        images: ["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"]
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        // Clear existing properties
        await Property.deleteMany({});
        console.log("Cleared existing properties.");

        // Add dummy user if not exists
        let user = await User.findOne({ role: 'admin' });
        if (!user) {
            user = new User({
                name: "Admin User",
                email: "admin@realestatepro.com",
                password: "password123", // Note: This will be clear text in DB unless model handles hashing
                role: "admin"
            });
            await user.save();
            console.log("Created admin user.");
        }

        // Assign createdBy to properties
        const propertiesWithUser = properties.map(p => ({
            ...p,
            createdBy: user._id
        }));

        await Property.insertMany(propertiesWithUser);
        console.log("Seeded properties successfully!");

        mongoose.connection.close();
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
};

seedDB();
