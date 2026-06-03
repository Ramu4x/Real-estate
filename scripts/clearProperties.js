const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Property = require("../models/Property");

const clearProperties = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    const result = await Property.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} properties from the database.`);

    mongoose.connection.close();
    console.log("✅ Done. Connection closed.");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

clearProperties();
