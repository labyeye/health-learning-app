const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/authMiddle');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profile';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    mimetype && extname ? cb(null, true) : cb(new Error('Only .png, .jpg and .jpeg formats are allowed!'));
  }
});

// Get user details
router.get('/details', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    user ? res.json(user) : res.status(404).json({ message: 'User not found' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/updateprofile', verifyToken, async (req, res) => {
  const { name, email, phone, height , weight } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.height = height || user.height;
    user.weight = weight || user.weight;

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload profile photo
router.put('/uploadphoto', verifyToken, upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.profilePhoto && fs.existsSync(path.join(__dirname, '..', user.profilePhoto))) {
      fs.unlinkSync(path.join(__dirname, '..', user.profilePhoto));
    }

    user.profilePhoto = req.file.path.replace(/\\/g, '/');
    await user.save();

    res.json({ message: 'Profile photo updated successfully', photoUrl: user.profilePhoto });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
    res.status(200).json({ 
        success: true,
        result: {
          filePath: `/uploads/profile/${req.file.filename}`,
          fileUrl: `${req.protocol}://${req.get('host')}/uploads/profile/${req.file.filename}`
        }
      });
      
  }
});

module.exports = router;