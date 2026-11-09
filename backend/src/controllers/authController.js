const prisma = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { get } = require("../routes/authRoutes");

//Register User
const RegisterUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    //check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All field required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    //Check whether already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: true,
        message: "Email already registered",
      });
    }

    //Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    //save the user in PostgreSQL

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Registrstion sucessfully",
    });
  } catch (error) {
    console.error("Registration Error", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

//Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    //Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    //compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    //Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      success: true,
      message: "Login successfull",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error :", error);
    res.json({
      success: false,
      message: "Login failed",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      res.json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("profile error", error);
    res.json({
      success: false,
      message: "Unable to get profile",
    });
  }
};

module.exports = { RegisterUser, loginUser, getProfile };
