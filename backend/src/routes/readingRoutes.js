const express = require("express");
const authmiddleware = require("../middleware/authMiddleware");
const {
  addReading,
  getAllReadings,
  updateReading,
  deleteReading,
} = require("../controllers/readingController");
const router = express.Router();

router.post("/", authmiddleware, addReading);
router.get("/", authmiddleware, getAllReadings);
router.put("/:id", authmiddleware, updateReading);
router.delete("/:id", authmiddleware, deleteReading);

module.exports = router;
