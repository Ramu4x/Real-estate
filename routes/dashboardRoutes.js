const express = require("express");
const router = express.Router();
const protect = require("../middleware/authmiddleware");
const Property = require("../models/Property");
const { getSellerDashboard, getBuyerDashboard } = require("../controllers/dashboardController");

// Full seller dashboard (detailed)
router.get("/seller", protect, getSellerDashboard);

// Lightweight seller stats endpoint used by frontend
router.get("/seller-stats", protect, async (req, res) => {
	try {
		const userId = req.user._id;

		const totalListings = await Property.countDocuments({ createdBy: userId });
		const activeListings = await Property.countDocuments({ createdBy: userId, status: 'available' });
		const pendingListings = await Property.countDocuments({ createdBy: userId, status: 'pending' });

		const viewsResult = await Property.aggregate([
			{ $match: { createdBy: userId } },
			{ $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
		]);
		const totalViews = viewsResult[0]?.totalViews || 0;

		res.json({
			success: true,
			data: { totalListings, activeListings, pendingListings, totalViews }
		});
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
});

router.get("/buyer", protect, getBuyerDashboard);

module.exports = router;
