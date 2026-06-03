const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Property = require('../models/Property');
const connectDb = require('../config/db');

// Check for OpenAI API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy_key",
});

const generateTrainingDataset = async () => {
    try {
        await connectDb();
        console.log("Connected to database. Fetching properties...");

        const properties = await Property.find({}).limit(200); // Limit or filter as needed

        if (properties.length === 0) {
            console.log("No properties found to generate dataset.");
            process.exit();
        }

        const jsonlData = [];

        properties.forEach((property) => {
            // Define a system prompt for price prediction
            const systemPrompt = "You are a real estate expert and property valuator.";

            const userPrompt = `
        Based on the following property details, predict a realistic market price range:
        
        Property Type: ${property.type}
        Location: ${property.location}
        Area: ${property.area} sq ft
        Bedrooms: ${property.bedrooms || 'N/A'}
        Bathrooms: ${property.bathrooms || 'N/A'}
        Amenities: ${property.amenities?.join(", ") || "None"}
      `;

            // Simulating the expected output shape
            const assistantResponse = JSON.stringify({
                priceRange: `₹${(property.price * 0.9).toLocaleString('en-IN')} - ₹${(property.price * 1.1).toLocaleString('en-IN')}`,
                confidence: "high",
                factors: ["Actual market listing data", "Location", "Area"],
                insights: `Property is listed at ₹${property.price.toLocaleString('en-IN')} on the platform.`
            });

            // Format line for JSONL fine-tuning
            const line = {
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                    { role: "assistant", content: assistantResponse }
                ]
            };

            jsonlData.push(JSON.stringify(line));
        });

        const outputPath = path.join(__dirname, 'property_tuning_data.jsonl');
        fs.writeFileSync(outputPath, jsonlData.join('\n'));
        console.log(`Successfully generated training dataset at ${outputPath}`);
        console.log(`Generated ${jsonlData.length} training examples.`);

        // Note: If you have a valid API Key, you can uncomment this code to automatically upload and start fine-tuning:
        /*
        console.log("Uploading file to OpenAI...");
        const uploadedFile = await openai.files.create({
          file: fs.createReadStream(outputPath),
          purpose: "fine-tune",
        });
        console.log("File uploaded successfully. File ID:", uploadedFile.id);
    
        console.log("Starting fine-tuning job...");
        const fineTuneJob = await openai.fineTuning.jobs.create({
          training_file: uploadedFile.id,
          model: "gpt-3.5-turbo",
        });
        console.log("Fine-tuning job started successfully!", fineTuneJob);
        */

    } catch (error) {
        console.error("Error generating training dataset:", error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

generateTrainingDataset();
