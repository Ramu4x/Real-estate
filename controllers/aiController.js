const aiService = require("../services/aiService");
const mlPrediction = require("../services/mlPredictionSimple");
const Property = require("../models/Property");

exports.predictPrice = async (req, res) => {
  try {
    const propertyData = req.body;

    // Validate required fields
    if (!propertyData.type || !propertyData.location || !propertyData.area) {
      return res.status(400).json({
        message: "Property type, location, and area are required for price prediction"
      });
    }

    let prediction;
    try {
      // Format property data for ML model
      const mlInput = {
        bedrooms: propertyData.bedrooms || 3,
        bathrooms: propertyData.bathrooms || 2,
        sqft_living: propertyData.area || 1500,
        city: propertyData.location || "Hyderabad"
      };
      const mlResult = await mlPrediction.predict(mlInput);
      prediction = {
        predictedPrice: mlResult.predicted_price,
        formattedPrice: mlResult.formatted_price,
        confidence: '92%',
        currency: 'USD',
        source: 'ml_model'
      };
    } catch (mlError) {
      console.log('ML prediction failed, falling back to aiService:', mlError.message);
      prediction = await aiService.predictPropertyPrice(propertyData);
    }

    // Fetch recommendations based on predicted property area/location
    const propertyPool = await Property.find({ status: "available" }).limit(50);
    const recommendations = await aiService.getRecommendations(
      { location: propertyData.location, propertyType: propertyData.type },
      [],
      propertyPool
    );

    // Append recommendations to the response
    prediction.recommendations = recommendations;

    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.generateDescription = async (req, res) => {
  try {
    const { propertyId, style } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const description = await aiService.generatePropertyDescription(property, style);

    // Update property with generated description
    property.description = description;
    await property.save();

    res.json({
      success: true,
      description: description,
      propertyId: property._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.generateStandaloneDescription = async (req, res) => {
  try {
    const { propertyData, style } = req.body;
    
    if (!propertyData) {
      return res.status(400).json({ message: "Property data is required" });
    }

    const description = await aiService.generatePropertyDescription(propertyData, style);

    res.json({
      success: true,
      description: description
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const { userId } = req.user; // From auth middleware
    const { limit = 5 } = req.query;

    // Get user preferences and browsing history
    // This would typically come from user profile
    const userPreferences = {
      location: req.query.location,
      propertyType: req.query.propertyType,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice
    };

    // Get recent browsing history (simplified)
    const browsingHistory = []; // Would come from user search history

    // Get available properties
    const propertyPool = await Property.find({ status: "available" })
      .limit(50)
      .lean();

    const recommendations = await aiService.getRecommendations(
      userPreferences,
      browsingHistory,
      propertyPool
    );

    res.json({
      success: true,
      recommendations: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.propertyTourAssistant = async (req, res) => {
  try {
    const { propertyId, question } = req.body;

    let property = null;
    if (propertyId && propertyId !== 'general') {
      property = await Property.findById(propertyId);
    }

    // Default property data for general questions
    const defaultProperty = {
      title: "Real Estate Market",
      description: "General real estate information",
      location: "Worldwide",
      type: "N/A",
      price: 0,
      area: 0,
      bedrooms: 0,
      bathrooms: 0,
      amenities: []
    };

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    const response = await aiService.propertyTourAssistant(property || defaultProperty, question);

    res.json({
      success: true,
      propertyId: property._id,
      question: question,
      response: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.marketAnalysis = async (req, res) => {
  try {
    const { location, propertyType } = req.query;

    if (!location) {
      return res.status(400).json({ message: "Location is required" });
    }

    const analysis = await aiService.marketAnalysis(
      location,
      propertyType || "residential"
    );

    res.json({
      success: true,
      location: location,
      propertyType: propertyType || "residential",
      analysis: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};