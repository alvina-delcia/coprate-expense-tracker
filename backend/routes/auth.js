const express = require("express");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { protect } = require("../middleware/auth");

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register a new user with a chosen role
// @access  Public
router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Please provide name, email and password");
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error("An account with this email already exists");
    }

    const allowedRoles = ["employee", "manager", "admin"];
    const finalRole = allowedRoles.includes(role) ? role : "employee";

    const user = await User.create({
      name,
      email,
      password,
      role: finalRole,
      department: department || "General",
    });

    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
      token: generateToken(user._id, user.role),
    });
  })
);

// @route   POST /api/auth/login
// @desc    Authenticate user and return a token
// @access  Public
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Please provide email and password");
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
      token: generateToken(user._id, user.role),
    });
  })
);

// @route   GET /api/auth/me
// @desc    Get the currently logged-in user's profile
// @access  Private
router.get(
  "/me",
  protect,
  asyncHandler(async (req, res) => {
    res.json({ success: true, user: req.user });
  })
);

// @route   PUT /api/auth/change-password
// @desc    Change the logged-in user's password
// @access  Private
router.put(
  "/change-password",
  protect,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error("Please provide current and new password");
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!(await user.matchPassword(currentPassword))) {
      res.status(401);
      throw new Error("Current password is incorrect");
    }

    if (newPassword.length < 6) {
      res.status(400);
      throw new Error("New password must be at least 6 characters");
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  })
);

// @route   PUT /api/auth/profile
// @desc    Update basic profile info (name, department)
// @access  Private
router.put(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    const { name, department } = req.body;

    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (department) user.department = department;
    await user.save();

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  })
);

module.exports = router;
