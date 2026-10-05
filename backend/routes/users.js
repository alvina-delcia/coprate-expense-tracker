const express = require("express");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// @route   GET /api/users
// @desc    List all users (used for admin views)
// @access  Private (admin)
router.get(
  "/",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  })
);

module.exports = router;
