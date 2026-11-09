const express = require("express");
const authmiddleware = require("../middleware/authMiddleware");
const {
  getDailyReport,
  getMonthToDateReport,
  getPreviousMonthReport,
} = require("../controllers/reportController");
const router = express.Router();

router.get("/daily", authmiddleware, getDailyReport);
router.get("/month-to-date", authmiddleware, getMonthToDateReport);
router.get("/previous-month", authmiddleware, getPreviousMonthReport);

module.exports = router;
