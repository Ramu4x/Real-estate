const express = require('express');
const router = express.Router();
const protect = require('../middleware/authmiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const User = require('../models/User');
const Property = require('../models/Property');

// Apply middleware to all routes in this file
router.use(protect);
router.use(roleMiddleware(['admin']));

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeListings = await Property.countDocuments({ approvalStatus: { $ne: 'rejected' } });
        const pendingListings = await Property.countDocuments({ approvalStatus: 'pending' });
        
        // Mock revenue for demonstration
        const revenue = "$12,450.00"; 

        res.json({
            totalUsers,
            activeListings,
            pendingListings,
            revenue
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT /api/admin/users/:id/suspend
router.put('/users/:id/suspend', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Prevent admin from suspending themselves
        if (user._id.toString() === req.user.id.toString()) {
            return res.status(400).json({ message: 'Cannot suspend your own admin account' });
        }

        user.isSuspended = !user.isSuspended;
        await user.save();
        
        res.json({ message: `User ${user.isSuspended ? 'suspended' : 'unsuspended'} successfully`, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/admin/properties/pending
router.get('/properties/pending', async (req, res) => {
    try {
        const properties = await Property.find({ approvalStatus: 'pending' }).populate('createdBy', 'name email').sort({ createdAt: -1 });
        res.json(properties);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT /api/admin/properties/:id/status
router.put('/properties/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const property = await Property.findByIdAndUpdate(
            req.params.id, 
            { approvalStatus: status },
            { new: true }
        );

        if (!property) return res.status(404).json({ message: 'Property not found' });
        
        res.json({ message: `Property status updated to ${status}`, property });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/admin/messages (Mock for now or empty array if no central message model exists)
router.get('/messages', async (req, res) => {
    res.json([]);
});

module.exports = router;
