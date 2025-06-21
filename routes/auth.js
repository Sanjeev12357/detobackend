const express = require("express");
const authRouter = express.Router();

const { validateSignUpData } = require("../utils/validation");
const User = require("../models/user");
const bcrypt = require("bcrypt");

// Password strength validation
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    throw new Error("Password must be at least 8 characters long");
  }
  if (!hasUpperCase) {
    throw new Error("Password must contain at least one uppercase letter");
  }
  if (!hasLowerCase) {
    throw new Error("Password must contain at least one lowercase letter");
  }
  if (!hasNumbers) {
    throw new Error("Password must contain at least one number");
  }
  if (!hasSpecialChar) {
    throw new Error("Password must contain at least one special character");
  }
};

authRouter.post("/signup", async (req, res) => {
  try {
    console.log('Received signup data:', req.body);
    
    // Validation of data
    validateSignUpData(req);

    const { 
      firstName, 
      lastName, 
      emailId, 
      password,
      age,
      gender,
      photoUrl,
      about,
      skills
    } = req.body;

    // Validate password strength
    validatePassword(password);

    // Check if user already exists
    const existingUser = await User.findOne({ emailId: emailId });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "User with this email already exists" 
      });
    }

    // Encrypt the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Creating a new instance of the User model
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      age: age ? parseInt(age) : undefined,
      gender,
      photoUrl, // This will now be a Cloudinary URL
      about,
      skills
    });

    const savedUser = await user.save();
    const token = await savedUser.getJWT();

    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000),
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    res.status(201).json({ 
      success: true,
      message: "User created successfully!", 
      data: {
        id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        emailId: savedUser.emailId,
        photoUrl: savedUser.photoUrl
      }
    });
  } catch (err) {
    console.log('Signup error:', err.message);
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const user = await User.findOne({ emailId: emailId });
    if (!user) {
      throw new Error("Invalid credentials");
    }
    const isPasswordValid = await user.validatePassword(password);

    if (isPasswordValid) {
      const token = await user.getJWT();

      res.cookie("token", token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      res.send(user);
    } else {
      throw new Error("Invalid credentials");
    }
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
});

authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });
  res.json({
    success: true,
    message: "Logout successful"
  });
});

module.exports = authRouter;
