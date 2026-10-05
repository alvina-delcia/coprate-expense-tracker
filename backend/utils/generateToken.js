const jwt = require("jsonwebtoken");

// Signs a JWT containing the user's id and role.
// The role is embedded so the frontend can render role-based UI
// immediately after login without an extra request.
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = generateToken;
