const Property = require("../models/Property");
const User = require("../models/User");
const cloudinaryService = require("../services/cloudinaryService");
const locationService = require("../services/locationService");
const { createNotification } = require("./notificationController");
const SearchHistory = require("../models/SearchHistory");

const addProperty = async (req, res) => {
  try {
    // Only sellers are allowed to add properties
    if (!req.user || req.user.role !== 'seller') {
      return res.status(403).json({ success: false, message: 'Only sellers can add properties' });
    }
    const rawAmenities = typeof req.body.amenities === 'string' ? JSON.parse(req.body.amenities) : req.body.amenities;
    const price = parseFloat(req.body.price || 0);
    const area = req.body.area ? parseInt(req.body.area, 10) : 0;

    const propertyData = {
      title: req.body.title,
      description: req.body.description,
      price,
      location: req.body.location || req.body.address || '',
      type: req.body.type,
      purpose: req.body.purpose || 'sale',
      bedrooms: req.body.bedrooms ? parseInt(req.body.bedrooms, 10) : undefined,
      bathrooms: req.body.bathrooms ? parseInt(req.body.bathrooms, 10) : undefined,
      area,
      yearBuilt: req.body.yearBuilt ? parseInt(req.body.yearBuilt, 10) : undefined,
      furnishing: req.body.furnishing || 'unfurnished',
      status: req.body.status || 'available',
      amenities: Array.isArray(rawAmenities) ? rawAmenities : [],
      pricePerSqft: area > 0 ? Math.round(price / area) : undefined,
      createdBy: req.user.id,
      latitude: req.body.latitude ? parseFloat(req.body.latitude) : undefined,
      longitude: req.body.longitude ? parseFloat(req.body.longitude) : undefined,
      address: {
        street: req.body.address || '',
        city: req.body.city || '',
        state: req.body.state || '',
        zipCode: req.body.zipCode || '',
        country: 'India'
      }
    };

    // Handle image uploads if files are present
    if (req.files && req.files.length > 0) {
      // Use Cloudinary instead of local storage for Render
      const uploadedImages = await cloudinaryService.uploadMultipleImages(req.files);
      propertyData.images = uploadedImages.map(img => img.url);
    }

    // If no uploaded files but client provided image URLs in the JSON body, accept them
    if ((!propertyData.images || propertyData.images.length === 0) && req.body.images) {
      try {
        const bodyImages = Array.isArray(req.body.images) ? req.body.images : JSON.parse(req.body.images || '[]');
        if (Array.isArray(bodyImages) && bodyImages.length) {
          propertyData.images = bodyImages.map(url => String(url));
        }
      } catch (e) {
        // ignore parse errors and proceed without images
      }
    }

    if (propertyData.location && (!propertyData.address || !propertyData.address.city)) {
      propertyData.address = locationService.parseAddress(propertyData.location);
    }

    const property = await Property.create(propertyData);
    
    // Populate createdBy (seller) info for the response
    await property.populate("createdBy", "name email phone avatar");

    // Proactively match SearchHistory for other users and send notifications
    try {
      const query = {};
      if (property.location || property.address?.city) {
        query.location = { $regex: property.location || property.address?.city, $options: "i" };
      }
      const matchingSearches = await SearchHistory.find(query).populate("user");
      for (const search of matchingSearches) {
        if (search.user && search.user._id.toString() !== req.user.id) {
          if (search.minPrice && property.price < search.minPrice) continue;
          if (search.maxPrice && property.price > search.maxPrice) continue;
          if (search.bedrooms && property.bedrooms !== search.bedrooms) continue;
          if (search.propertyType && property.type !== search.propertyType) continue;

          await createNotification({
            recipient: search.user._id,
            sender: req.user.id,
            type: "system",
            property: property._id,
            title: "New property matches your search!",
            message: `A new ${property.type || "property"} matching your search was listed: "${property.title}" for ₹${property.price.toLocaleString('en-IN')}`,
            actionUrl: `/property-detail.html?id=${property._id}`
          });
        }
      }
    } catch (searchError) {
      console.error("Failed to query/notify matching searches:", searchError.message);
    }
    
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
    let filter = {};

    // If user wants to see only their own properties (for sellers)
    if (myProperties === 'true' && req.user) {
      filter.createdBy = req.user.id;
    } else {
      // Public property search should only show available listings
      filter.status = "available";
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

const getFeaturedProperties = async (req, res) => {
  try {
    const properties = await Property.find({ 
      status: 'available',
      // featured: true // Optional if you have a featured flag in schema
    })
    .populate('createdBy', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(6);
    
    res.json({
      success: true,
      data: properties
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

    const oldPrice = property.price;
    const newPrice = parseFloat(req.body.price);

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");

    if (updatedProperty && !isNaN(newPrice) && newPrice < oldPrice) {
      // Find all users who have this property in their favorites
      const favoritedUsers = await User.find({ favorites: property._id });
      for (const favUser of favoritedUsers) {
        await createNotification({
          recipient: favUser._id,
          sender: req.user.id,
          type: "system",
          property: property._id,
          title: "Price drop alert!",
          message: `Price dropped on your favorited property "${property.title}": ₹${oldPrice.toLocaleString('en-IN')} → ₹${newPrice.toLocaleString('en-IN')}`,
          actionUrl: `/property-detail.html?id=${property._id}`
        });
      }
    }

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

      // Notify the property owner that someone favorited their listing
      if (property.createdBy && property.createdBy.toString() !== userId.toString()) {
        await createNotification({
          recipient: property.createdBy,
          sender: userId,
          type: "favorite",
          property: property._id,
          title: "Your property was favorited",
          message: `${user.name || "Someone"} favorited "${property.title}"`,
          actionUrl: `/dashboard.html#dashboard-home`,
        });
      }
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
  getFeaturedProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  toggleFavorite,
  getFavorites
};


