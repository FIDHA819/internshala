const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // Get token from the Authorization header (Format: Bearer <token>)
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify token using your JWT secret from your .env file
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_fallback_secret_key");
    
    // Attach user data to the request object
    req.user = decoded; 
    next(); 
  } catch (err) {
    return res.status(403).json({ success: false, message: "Invalid or expired token." });
  }
};

module.exports = verifyToken;