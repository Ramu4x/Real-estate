const User = require("../models/User");
const Property = require("../models/Property");
const SearchHistory = require("../models/SearchHistory");
const { logActivity } = require("./activityLogger");

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
    const { location, minPrice, maxPrice, bedrooms, propertyType, resultsCount } = req.body;

    const record = await SearchHistory.create({
      user: req.user.id,
      location,
      minPrice,
      maxPrice,
      bedrooms,
      propertyType,
      resultsCount,
    });

    await logActivity(req.user.id, "search", {
      location,
      minPrice,
      maxPrice,
      bedrooms,
      propertyType,
      resultsCount,
    });

    res.json({
      success: true,
      data: record,
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
    const items = await SearchHistory.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: items,
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