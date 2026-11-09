const jwt = require("jsonwebtoken");

const authmiddleware = (req, res, next) => {
  try {
    //Get the token request from headers
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.json({
        success: false,
        messsage: "Accesss denied . Please Login.",
      });
    }

    const token = authHeader.split(" ")[1];
    //verfiy token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //store logged-in user information
    req.user = decoded;

    next();
  } catch (error) {
    console.log("JWT Error:", error.message);

    return res.json({
      success: true,
      message: "Invalid or expired token",
    });
  }
};

module.exports = authmiddleware;
