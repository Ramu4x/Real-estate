const Property = require("../models/Property");
const User = require("../models/User");
const cloudinaryService = require("../services/cloudinaryService");
const locationService = require("../services/locationService");

const addProperty = async (req, res) => {
  try {
    // Parse form data values - convert strings to appropriate types
    const propertyData = {
      title: req.body.title,
      description: req.body.description,
      price: parseFloat(req.body.price), // Convert to number
      location: req.body.location,
      type: req.body.type,
      bedrooms: req.body.bedrooms ? parseInt(req.body.bedrooms) : undefined,
      bathrooms: req.body.bathrooms ? parseInt(req.body.bathrooms) : undefined,
      area: req.body.area ? parseInt(req.body.area) : undefined,
      amenities: req.body.amenities ? req.body.amenities : [],
      createdBy: req.user.id,
      status: 'available' // Ensure new properties are available by default
    };

    // Handle image uploads if files are present
    if (req.files && req.files.length > 0) {
      // For local storage, store file paths
      propertyData.images = req.files.map(file => `/uploads/${file.filename}`);
      // Uncomment below if you want to use Cloudinary instead
      // const uploadedImages = await cloudinaryService.uploadMultipleImages(req.files);
      // propertyData.images = uploadedImages.map(img => img.url);
    }

    // Add geolocation data if location is provided
    if (propertyData.location) {
      // const locationCoords = locationService.getLocationCoordinates(propertyData.location);
      // Temporarily disable geolocation due to index conflicts
      // propertyData.latitude = locationCoords.lat;
      // propertyData.longitude = locationCoords.lng;
      propertyData.address = locationService.parseAddress(propertyData.location);
    }

    const property = await Property.create(propertyData);

    // Populate createdBy field
    await property.populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      data: property
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getProperties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      minPrice,
      maxPrice,
      location,
      bedrooms,
      sortBy = "createdAt",
      latitude,
      longitude,
      radius = 50, // Default 50km radius
      city,
      state,
      myProperties // Add parameter to get only user's properties
    } = req.query;

    // Build filter object
    let filter = { status: "available" };

    // If user wants to see only their own properties (for sellers)
    if (myProperties === 'true' && req.user) {
      filter.createdBy = req.user.id;
    }

    if (type) filter.type = type;
    if (bedrooms) filter.bedrooms = parseInt(bedrooms);

    // Handle location-based search
    if (latitude && longitude) {
      // Geospatial search
      filter.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius) * 1000 // Convert km to meters
        }
      };
    } else if (location) {
      // Text-based location search
      filter.$or = [
        { location: { $regex: location, $options: "i" } },
        { "address.city": { $regex: location, $options: "i" } },
        { "address.state": { $regex: location, $options: "i" } }
      ];
    } else if (city) {
      filter["address.city"] = { $regex: city, $options: "i" };
    } else if (state) {
      filter["address.state"] = { $regex: state, $options: "i" };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    // Build sort object
    let sort = {};
    if (sortBy === "price-low") sort.price = 1;
    else if (sortBy === "price-high") sort.price = -1;
    else if (sortBy === "newest") sort.createdAt = -1;
    else if (sortBy === "distance" && latitude && longitude) {
      // Sort by distance for geospatial queries
      sort = { "location.coordinates": "2dsphere" };
    } else {
      sort.createdAt = -1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const properties = await Property.find(filter)
      .populate("createdBy", "name email avatar")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Property.countDocuments(filter);

    // Add distance information if geospatial search
    let propertiesWithDistance = properties;
    if (latitude && longitude) {
      propertiesWithDistance = properties.map(property => {
        if (property.latitude && property.longitude) {
          const distance = locationService.calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            property.latitude,
            property.longitude
          );
          return {
            ...property.toObject(),
            distance: Math.round(distance / 1000) // Convert to km
          };
        }
        return property.toObject();
      });
    }

    res.json({
      success: true,
      data: propertiesWithDistance,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total: total
      },
      searchInfo: {
        location: location || city || state || null,
        radius: radius ? parseInt(radius) : null,
        coordinates: latitude && longitude ? {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate("createdBy", "name email phone avatar");

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    // Increment view count
    property.viewCount += 1;
    await property.save();

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if user is authorized to update
    if (property.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this property" });
    }

    // Prepare update data
    const updateData = { ...req.body };

    // Handle image uploads if files are present
    if (req.files && req.files.length > 0) {
      // Append new images to existing ones instead of replacing entirely, or replace entirely based on your design
      const newImages = req.files.map(file => `/uploads/${file.filename}`);

      // We will replace all images for simplicity or merge them. Let's merge if some existed
      if (property.images && Array.isArray(property.images)) {
        updateData.images = [...property.images, ...newImages];
      } else {
        updateData.images = newImages;
      }
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");

    res.json({
      success: true,
      data: updatedProperty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if user is authorized to delete
    if (property.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this property" });
    }

    await property.deleteOne();

    res.json({
      success: true,
      message: "Property deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const isFavorite = user.favorites.includes(propertyId);

    if (isFavorite) {
      // Remove from favorites
      user.favorites = user.favorites.filter(id => id.toString() !== propertyId);
      property.favoriteCount = Math.max(0, property.favoriteCount - 1);
    } else {
      // Add to favorites
      user.favorites.push(propertyId);
      property.favoriteCount += 1;
    }

    await user.save();
    await property.save();

    res.json({
      success: true,
      isFavorite: !isFavorite,
      favoriteCount: property.favoriteCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "favorites",
      populate: {
        path: "createdBy",
        select: "name email avatar"
      }
    });

    res.json({
      success: true,
      data: user.favorites
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Export all functions
module.exports = {
  addProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  toggleFavorite,
  getFavorites
};


