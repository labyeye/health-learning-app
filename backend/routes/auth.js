const bcrypt = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken, tokenBlacklist } = require('../middleware/authMiddle');
const router = express.Router();

const hashValue = async (value, saltRounds) => {
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(value, salt);
};

const verifyValue = async (value, hashedValue) => {
  return await bcrypt.compare(value, hashedValue);
};


router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    console.log("1");
    const hashedPassword = await hashValue(password, 10);
    console.log("2");
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h',
      },
    );

    res
      .status(201)
      .json({
        message: 'User created successfully',
        user: { id: user._id, name: user.name, email: user.email },
        token,
      });
  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({ message: 'Error creating user', error });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    // Check if user exists first to prevent error on null access
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const isMatch = await verifyValue(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h',
      },
    );

    res
      .status(200)
      .json({
        message: 'Login successful',
        token,
        user: { id: user._id, name: user.name, email: user.email },
      });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Error signing in', error });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const hashedPassword = await hashValue(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error in password reset:', error);
    res.status(500).json({ message: 'Error resetting password', error });
  }
});
router.post('/logout', verifyToken, (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    tokenBlacklist.add(token);
    
    console.log('User logged out successfully. Token added to blacklist.');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
});


module.exports = router;