const express = require('express');
const router = express.Router();
const Tips = require('../models/Tips');

router.get('/tips', async (req, res) => {
  try {
    const tips = await Tips.find().sort({ createdAt: -1 });
    res.json(tips);
  } catch (err) {
    console.error('Error fetching tips:', err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/tips', async (req, res) => {
  try {
    const { title, description, photo } = req.body;
    
    const newTip = new Tips({
      title,
      description,
      photo: photo || ''
    });
    
    const savedTip = await newTip.save();
    res.json(savedTip);
  } catch (err) {
    console.error('Error creating tip:', err.message);
    res.status(500).send('Server Error');
  }
});

// GET api/profile/tips/:id - Get a specific tip
router.get('/tips/:id', async (req, res) => {
  try {
    const tip = await Tips.findById(req.params.id);
    
    if (!tip) {
      return res.status(404).json({ msg: 'Tip not found' });
    }
    
    res.json(tip);
  } catch (err) {
    console.error('Error fetching tip:', err.message);
    
    // Handle invalid ObjectId format
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Tip not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

// PUT api/profile/tips/:id - Update a tip
router.put('/tips/:id', async (req, res) => {
  try {
    const { title, description, photo } = req.body;
    
    // Build tip object
    const tipFields = {};
    if (title) tipFields.title = title;
    if (description) tipFields.description = description;
    if (photo !== undefined) tipFields.photo = photo;
    
    let tip = await Tips.findById(req.params.id);
    
    if (!tip) {
      return res.status(404).json({ msg: 'Tip not found' });
    }
    
    // Update
    tip = await Tips.findByIdAndUpdate(
      req.params.id,
      { $set: tipFields },
      { new: true }
    );
    
    res.json(tip);
  } catch (err) {
    console.error('Error updating tip:', err.message);
    
    // Handle invalid ObjectId format
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Tip not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

// DELETE api/profile/tips/:id - Delete a tip
router.delete('/tips/:id', async (req, res) => {
  try {
    const tip = await Tips.findById(req.params.id);
    
    if (!tip) {
      return res.status(404).json({ msg: 'Tip not found' });
    }
    
    await tip.remove();
    
    res.json({ msg: 'Tip removed' });
  } catch (err) {
    console.error('Error deleting tip:', err.message);
    
    // Handle invalid ObjectId format
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Tip not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

module.exports = router;