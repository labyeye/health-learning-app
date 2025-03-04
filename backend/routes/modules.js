const express = require('express');
const router = express.Router();
const Modules = require('../models/Modules');

// Change from '/modules' to '/'
router.get('/', async (req, res) => {
  try {
    const modules = await Modules.find().sort({ createdAt: -1 });
    res.json(modules);
  } catch (err) {
    console.error('Error fetching modules:', err.message);
    res.status(500).send('Server Error');
  }
});

// Change from '/modules' to '/'
router.post('/', async (req, res) => {
  try {
    const { title, description, category, photo } = req.body;
    
    const newModule = new Modules({
      title,
      description,
      category, // Fix typo: cateogry → category
      photo: photo || ''
    });
    
    const savedModule = await newModule.save();
    res.json(savedModule);
  } catch (err) {
    console.error('Error creating Module:', err.message);
    res.status(500).send('Server Error');
  }
});

// Change from '/modules/:id' to '/:id'
router.get('/:id', async (req, res) => {
  try {
    const module = await Modules.findById(req.params.id);
    
    if (!module) {
      return res.status(404).json({ msg: 'Module not found' });
    }
    
    res.json(module);
  } catch (err) {
    console.error('Error fetching modules:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Module not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

// Change from '/modules/:id' to '/:id'
router.put('/:id', async (req, res) => {
  try {
    const { title, description, category, photo } = req.body;
    
    const moduleFields = {};
    if (title) moduleFields.title = title;
    if (description) moduleFields.description = description;
    if (category) moduleFields.category = category; // Fix typo: cateogry → category
    if (photo !== undefined) moduleFields.photo = photo;
    
    let module = await Modules.findById(req.params.id);
    
    if (!module) {
      return res.status(404).json({ msg: 'Module not found' });
    }
    
    // Update
    module = await Modules.findByIdAndUpdate(
      req.params.id,
      { $set: moduleFields },
      { new: true }
    );
    
    res.json(module);
  } catch (err) {
    console.error('Error updating Module:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Module not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

module.exports = router;