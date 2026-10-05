const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// Verifies the JWT from the Authorization header and attaches
// the corresponding user document (without password) to req.user.
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id);

      if (!req.user) {
        res.status(401);
        throw new Error("User no longer exists");
      }

      return next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, invalid or expired token");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }
});

// Restricts access to specific roles.
// Usage: authorize("manager", "admin")
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Role '${req.user ? req.user.role : "unknown"}' is not permitted to access this resource`
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
