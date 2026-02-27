const express = require("express");
const {
  addProperty,
  getProperties,
  getProperty
} = require("../controllers/propertyController");
const auth = require("../middleware/authmiddleware");
const upload = require("../config/multer");

const router = express.Router();

router.post("/", auth, upload.array('images', 10), addProperty);
router.get("/", getProperties);
router.get("/my", auth, async (req, res) => {
    req.query.myProperties = 'true';
    getProperties(req, res);
}); // Route to get user's own properties
router.get("/:id", getProperty);

module.exports = router;
