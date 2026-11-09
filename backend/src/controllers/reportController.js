const prisma = require("../config/database");

const getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;

    //check required date
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "please provide the date",
      });
    }

    //validate format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Date must be in YYYY-MM-DD format",
      });
    }

    const readingDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(readingDate.getTime()) ||
      readingDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date",
      });
    }

    //Get all reading from selected date
    const readings = await prisma.reading.findMany({
      where: {
        userId: req.user.id,
        date: readingDate,
      },
      orderBy: {
        timeSlot: "asc",
      },
    });

    //Empty state
    if (readings.length === 0) {
      return res.status(200).json({
        success: true,
        messsage: "No reading found for this date",
        report: {
          date,
          highest: null,
          lowest: null,
          average: null,
          count: 0,
        },
        readings: [],
      });
    }

    //Calculate stastistics

    const values = readings.map((readings) => readings.value);

    const highest = Math.max(...values);
    const lowest = Math.min(...values);

    const average =
      Math.round(
        (values.reduce((total, value) => total + value, 0) / values.length) *
          10,
      ) / 10;

    res.status(200).json({
      success: true,
      report: {
        date,
        highest,
        lowest,
        average,
        count: readings.length,
      },
      readings,
    });
  } catch (error) {
    console.error("Daily report error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate daily report",
    });
  }
};

const getMonthToDateReport = async (req, res) => {
  try {
    const { date } = req.query;
    // Validate date
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid date in YYYY-MM-DD format",
      });
    }

    const selectedDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(selectedDate.getTime()) ||
      selectedDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date",
      });
    }

    // Prevent future dates
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(new Date());

    if (date > today) {
      return res.status(400).json({
        success: false,
        message: "Future dates are not allowed",
      });
    }

    //Get first date of selected month

    const startDate = new Date(
      Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), 1),
    );

    //Get readings from first day to selected date
    const readings = await prisma.reading.findMany({
      where: {
        userId: req.user.id,
        date: {
          gte: startDate,
          lte: selectedDate,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    //Empty state
    if (readings.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No readings found for this period",
        report: {
          startDate: startDate.toISOString().slice(0, 10),
          endDate: date,
          highest: null,
          lowest: null,
          average: null,
          count: 0,
        },
        readings: [],
      });
    }

    // Calculate statistics
    const values = readings.map((reading) => reading.value);

    const highest = Math.max(...values);
    const lowest = Math.min(...values);

    const total = values.reduce((sum, value) => sum + value, 0);

    const average = Math.round((total / values.length) * 10) / 10;

    res.status(200).json({
      success: true,
      report: {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: date,
        highest,
        lowest,
        average,
        count: readings.length,
      },
      readings,
    });
  } catch (error) {
    console.error("Month-to-date report error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate month-to-date report",
    });
  }
};

const getPreviousMonthReport = async (req, res) => {
  try {
    //get current date in India

    const today = new Date();

    const indiaDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(today);

    const currentDate = new Date(`${indiaDate}T00:00:00.000Z`);

    //Calculated previous month start and end
    const startDate = new Date(
      Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() - 1, 1),
    );

    const endDate = new Date(
      Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 0),
    );

    //Get previos month readings

    const readings = await prisma.reading.findMany({
      where: {
        userId: req.user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },

      orderBy: {
        date: "asc",
      },
    });

    // Empty state
    if (readings.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No readings found for previous month",
        report: {
          startDate: startDate.toISOString().slice(0, 10),
          endDate: endDate.toISOString().slice(0, 10),
          highest: null,
          lowest: null,
          average: null,
          count: 0,
        },
        readings: [],
      });
    }

    //Calculate statistics
    const values = readings.map((reading) => reading.value);

    const highest = Math.max(...values);
    const lowest = Math.min(...values);

    const total = values.reduce((sum, value) => sum + value, 0);

    const average = Math.round((total / values.length) * 10) / 10;

    res.status(200).json({
      success: true,
      report: {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        highest,
        lowest,
        average,
        count: readings.length,
      },
      readings,
    });
  } catch (error) {
    console.error("Previous month report error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate previous month report",
    });
  }
};

module.exports = {
  getDailyReport,
  getMonthToDateReport,
  getPreviousMonthReport,
};
