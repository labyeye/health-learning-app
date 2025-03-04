const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {verifyToken} = require('../middleware/authMiddle');
const User = require('../models/User');
const CommunityPost = require('../models/Community');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/community';

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, {recursive: true});
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `dish-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {fileSize: 5 * 1024 * 1024}, 
});
router.post(
  '/community/post',
  verifyToken,
  upload.single('photo'), 
  async (req, res) => {
    try {
      const { dishName, description, category } = req.body;

      if (!dishName || !req.file) {
        return res.status(400).json({ message: 'Dish name and photo are required' });
      }

      const user = await User.findById(req.user.id).select('name profilePhoto');

      const post = new CommunityPost({
        userId: req.user.id,
        userName: user.name,
        userPhoto: user.profilePhoto,
        dishName,
        description,
        category,
        photoUrl: `/${req.file.path.replace(/\\/g, '/')}`,
        likes: 0,
      });

      await post.save();
      res.status(201).json({ message: 'Post created successfully', post });
    } catch (error) {
      console.error('Error creating community post:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);


// Get all community posts
router.get('/community/posts', async (req, res) => {
  try {
    const userId = req.query.userId;

    // Get all posts sorted by creation date (newest first)
    const posts = await CommunityPost.find().sort({createdAt: -1}).lean();

    // If userId is provided, mark posts as liked by the user
    if (userId) {
      const userLikedPosts = await CommunityPost.find(
        {likedBy: mongoose.Types.ObjectId(userId)},
        {_id: 1},
      ).lean();

      const likedPostIds = new Set(
        userLikedPosts.map(post => post._id.toString()),
      );

      posts.forEach(post => {
        post.liked = likedPostIds.has(post._id.toString());
      });
    }

    res.json(posts);
  } catch (error) {
    console.error('Error fetching community posts:', error);
    res.status(500).json({message: 'Server error', error: error.message});
  }
});

// Toggle like on a post
router.post('/community/like/:postId', verifyToken, async (req, res) => {
  try {
    const {postId} = req.params;
    const userId = req.user.id;

    const post = await CommunityPost.findById(postId);

    if (!post) {
      return res.status(404).json({message: 'Post not found'});
    }

    // Check if user has already liked the post
    const userIndex = post.likedBy.indexOf(userId);

    if (userIndex === -1) {
      // User hasn't liked the post, so add like
      post.likedBy.push(userId);
      post.likes += 1;
    } else {
      // User already liked the post, so remove like
      post.likedBy.splice(userIndex, 1);
      post.likes = Math.max(0, post.likes - 1);
    }

    await post.save();

    res.json({
      liked: userIndex === -1, // true if liked, false if unliked
      likes: post.likes,
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({message: 'Server error', error: error.message});
  }
});

// Get posts by specific user
router.get('/community/user/:userId', async (req, res) => {
  try {
    const {userId} = req.params;

    const posts = await CommunityPost.find({userId})
      .sort({createdAt: -1})
      .lean();

    res.json(posts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({message: 'Server error', error: error.message});
  }
});

// Delete a post (only by post owner)
router.delete('/community/post/:postId', verifyToken, async (req, res) => {
  try {
    const {postId} = req.params;

    const post = await CommunityPost.findById(postId);

    if (!post) {
      return res.status(404).json({message: 'Post not found'});
    }

    // Check if the user is the post owner
    if (post.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({message: 'Not authorized to delete this post'});
    }

    // Delete the image file
    if (post.photoUrl) {
      const imagePath = path.join(
        __dirname,
        '..',
        post.photoUrl.replace(/^\//, ''),
      );

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await post.deleteOne();

    res.json({message: 'Post deleted successfully'});
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({message: 'Server error', error: error.message});
  }
});

module.exports = router;
