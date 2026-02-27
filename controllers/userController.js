const User = require("../models/User");
const Property = require("../models/Property");

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("favorites");
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, preferences } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (preferences) user.preferences = preferences;
    
    await user.save();
    
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        preferences: user.preferences,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const { location, propertyType, minPrice, maxPrice } = req.body;
    
    const user = await User.findById(req.user.id);
    
    user.preferences = {
      location: location || user.preferences?.location,
      propertyType: propertyType || user.preferences?.propertyType,
      minPrice: minPrice || user.preferences?.minPrice,
      maxPrice: maxPrice || user.preferences?.maxPrice
    };
    
    await user.save();
    
    res.json({
      success: true,
      data: user.preferences
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

exports.addSearchHistory = async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }
    
    const user = await User.findById(req.user.id);
    
    // Add to search history (limit to 20 recent searches)
    user.searchHistory.unshift({
      query: query,
      timestamp: new Date()
    });
    
    if (user.searchHistory.length > 20) {
      user.searchHistory = user.searchHistory.slice(0, 20);
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: "Search history updated"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

exports.getSearchHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      data: user.searchHistory
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

exports.getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 });
    
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

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -favorites");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};