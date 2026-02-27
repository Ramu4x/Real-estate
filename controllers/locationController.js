const locationService = require("../services/locationService");
const Property = require("../models/Property");

exports.getLocationSuggestions = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const suggestions = locationService.getLocationSuggestions(query);
    
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

exports.getNearbyLocations = async (req, res) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        success: false,
        message: "Latitude and longitude are required" 
      });
    }

    const nearby = locationService.findNearbyLocations(
      parseFloat(latitude), 
      parseFloat(longitude), 
      parseInt(radius)
    );
    
    res.json({
      success: true,
      data: nearby
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

exports.getGeocodedLocation = async (req, res) => {
  try {
    const { location } = req.query;
    
    if (!location) {
      return res.status(400).json({ 
        success: false,
        message: "Location query is required" 
      });
    }

    const coordinates = locationService.getLocationCoordinates(location);
    
    res.json({
      success: true,
      data: {
        query: location,
        coordinates: coordinates,
        formattedAddress: `${locationService.capitalize(location)}, ${coordinates.state}, ${coordinates.country}`
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

exports.getPropertiesInArea = async (req, res) => {
  try {
    const { 
      latitude, 
      longitude, 
      radius = 10,
      type,
      minPrice,
      maxPrice,
      bedrooms
    } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        success: false,
        message: "Latitude and longitude are required" 
      });
    }

    // Build property query
    let propertyQuery = { status: "available" };
    
    if (type) propertyQuery.type = type;
    if (bedrooms) propertyQuery.bedrooms = parseInt(bedrooms);
    
    if (minPrice || maxPrice) {
      propertyQuery.price = {};
      if (minPrice) propertyQuery.price.$gte = parseInt(minPrice);
      if (maxPrice) propertyQuery.price.$lte = parseInt(maxPrice);
    }

    // Find properties within radius (mock implementation)
    const properties = await Property.find(propertyQuery)
      .populate("createdBy", "name email avatar")
      .limit(50);

    // Filter by distance
    const propertiesInRadius = properties.filter(property => {
      if (property.latitude && property.longitude) {
        const distance = locationService.calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          property.latitude,
          property.longitude
        );
        return distance <= (parseInt(radius) * 1000); // Convert km to meters
      }
      return false;
    });

    // Add distance information
    const propertiesWithDistance = propertiesInRadius.map(property => ({
      ...property.toObject(),
      distance: Math.round(
        locationService.calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          property.latitude,
          property.longitude
        ) / 1000
      ) // Convert to km
    }));

    res.json({
      success: true,
      data: propertiesWithDistance,
      searchInfo: {
        center: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        },
        radius: parseInt(radius),
        totalFound: propertiesWithDistance.length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

exports.getLocationStats = async (req, res) => {
  try {
    const { location } = req.query;
    
    if (!location) {
      return res.status(400).json({ 
        success: false,
        message: "Location is required" 
      });
    }

    const coordinates = locationService.getLocationCoordinates(location);
    
    // Get property statistics for the location
    const propertyStats = await Property.aggregate([
      {
        $match: {
          "address.city": { $regex: location, $options: "i" },
          status: "available"
        }
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" }
        }
      }
    ]);

    const totalProperties = await Property.countDocuments({
      "address.city": { $regex: location, $options: "i" },
      status: "available"
    });

    res.json({
      success: true,
      data: {
        location: location,
        coordinates: coordinates,
        totalProperties: totalProperties,
        propertyTypes: propertyStats,
        averagePrice: propertyStats.length > 0 ? 
          Math.round(propertyStats.reduce((sum, stat) => sum + stat.avgPrice, 0) / propertyStats.length) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};