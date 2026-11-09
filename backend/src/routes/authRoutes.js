const express = require("express");
const {
  RegisterUser,
  loginUser,
  getProfile,
} = require("../controllers/authController");
const authmiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/register", RegisterUser);
router.post("/login", loginUser);

//Protected route
router.get("/me", authmiddleware, getProfile);

module.exports = router;
