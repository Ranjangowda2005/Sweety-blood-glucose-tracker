const prisma = require("../config/database");

const addReading = async (req, res) => {
  try {
    const { date, timeSlot, value } = req.body;

    //check required field
    if (
      !date ||
      !timeSlot ||
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return res.json({
        success: false,
        message: "Date , time slot and glucose value are required",
      });
    }

    //validate glucose value
    const glucoseValue = Number(value);

    if (
      !Number.isInteger(glucoseValue) ||
      glucoseValue < 40 ||
      glucoseValue > 600
    ) {
      return res.json({
        success: false,
        message: "Glicose value must be a whole number betweeen 40 and 600",
      });
    }

    //validate time slot

    const allowedSlots = [
      "MORNING",
      "AFTER_BREAKFAST",
      "AFTER_LUNCH",
      "AFTER_DINNER",
    ];

    console.log("Received timeSlot:", timeSlot);

    if (!allowedSlots.includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time slot",
      });
    }

    //validate date formate actual calender date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "must be in YYYY-MM-DD format",
      });
    }

    const readingDate = new Date(`${date}T00:00:00.000z`);

    if (
      Number.isNaN(readingDate.getTime()) ||
      readingDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({ success: false, message: "Invalid date" });
    }

    //Prevent future dates(using current UTC calender date)
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(new Date());

    if (date > today) {
      return res.json({
        success: false,
        messsage: "Future date are not allowed",
      });
    }

    //Save reading for logge-in user
    const reading = await prisma.reading.create({
      data: {
        date: readingDate,
        timeSlot,
        value: glucoseValue,
        userId: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Glucose reading addded successfully",
      reading,
    });
  } catch (error) {
    //Duplicate reading for same date and time slot

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A reading already exists for this date and time slot",
      });
    }

    console.error("Add reading error", error);

    res.status(500).json({
      success: false,
      message: "Failed to add glucose reading",
    });
  }
};

const getAllReadings = async (req, res) => {
  try {
    const readings = await prisma.reading.findMany({
      where: {
        userId: req.user.id,
      },

      orderBy: {
        date: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: readings.length,
      readings,
    });
  } catch (error) {
    console.error("Get reading error", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch",
    });
  }
};

const updateReading = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, timeSlot, value } = req.body;

    //Check the all field required
    if (
      !date ||
      !timeSlot ||
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    //validate glocouse value
    const glucoseValue = Number(value);

    if (
      !Number.isInteger(glucoseValue) ||
      glucoseValue < 40 ||
      glucoseValue > 600
    ) {
      return res.status(400).json({
        success: false,
        message: "Glucose must be whole number between 40 to 600",
      });
    }

    //validate time slot

    const allowedSlots = [
      "MORNING",
      "AFTER_BREAKFAST",
      "AFTER_LUNCH",
      "AFTER_DINNER",
    ];

    console.log("Received timeSlot:", timeSlot);

    if (!allowedSlots.includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time slot",
      });
    }

    //validate date formate actual calender date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "must be in YYYY-MM-DD format",
      });
    }

    const readingDate = new Date(`${date}T00:00:00.000z`);

    if (
      Number.isNaN(readingDate.getTime()) ||
      readingDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({ success: false, message: "Invalid date" });
    }

    //Prevent future dates(using current UTC calender date)
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(new Date());

    if (date > today) {
      return res.json({
        success: false,
        messsage: "Future date are not allowed",
      });
    }

    // Check whether reading belongs to logged-in user
    const existingReading = await prisma.reading.findFirst({
      where: {
        id: id,
        userId: req.user.id,
      },
    });

    if (!existingReading) {
      return res.status(404).json({
        success: false,
        message: "Reading not found",
      });
    }

    // Update reading
    const updatedReading = await prisma.reading.update({
      where: {
        id: id,
      },
      data: {
        date: readingDate,
        timeSlot: timeSlot,
        value: glucoseValue,
      },
    });

    res.status(200).json({
      success: true,
      message: "Reading updated successfully",
      reading: updatedReading,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A reading already exists for this date and time slot",
      });
    }

    console.error("Update reading error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update reading",
    });
  }
};

const deleteReading = async (req, res) => {
  try {
    const { id } = req.params;

    //check whether reading user is login -in user

    const existingReading = await prisma.reading.findFirst({
      where: {
        id: id,
        userId: req.user.id,
      },
    });

    if (!existingReading) {
      return res.status(404).json({
        success: false,
        message: "Reading not found",
      });
    }

    await prisma.reading.delete({
      where: {
        id: id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Reading deleted successfully",
    });
  } catch (error) {
    console.error("Delete reading error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete",
      error: error.message,
      code: error.code,
    });
  }
};

module.exports = { addReading, getAllReadings, updateReading, deleteReading };
