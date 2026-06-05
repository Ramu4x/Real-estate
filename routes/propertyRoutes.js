const express = require("express");
const {
  addProperty,
  getProperties,
  getFeaturedProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  toggleFavorite
} = require("../controllers/propertyController");
const auth = require("../middleware/authmiddleware");
const upload = require("../config/multer");

const router = express.Router();

router.post("/", auth, upload.array('images', 10), addProperty);
router.get("/", getProperties);
router.get("/featured", getFeaturedProperties);
router.get("/my", auth, async (req, res) => {
    req.query.myProperties = 'true';
    getProperties(req, res);
}); // Route to get user's own properties
router.get("/my-listings", auth, async (req, res) => {
  req.query.myProperties = 'true';
  getProperties(req, res);
}); // alias route for seller listings
router.get("/:id", getProperty);
router.put("/:id", auth, updateProperty);
router.delete("/:id", auth, deleteProperty);
router.post("/:propertyId/favorite", auth, toggleFavorite);

module.exports = router;
