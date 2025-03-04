const express = require('express');
const Food = require('../models/Food');
const router = express.Router();

router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { userId } = req.query; 

    let foods;
    if (category.toLowerCase() === 'all') {
      foods = await Food.find();
    } else {
      foods = await Food.find({ category: category.toLowerCase() });
    }

    const foodsWithLikeStatus = foods.map(food => {
      const foodObject = food.toObject();
      return {
        ...foodObject,
        liked: userId ? food.usersLiked.includes(userId) : false,
        likes: food.usersLiked.length 
      };
    });

    res.status(200).json(foodsWithLikeStatus);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Error fetching category', error });
  }
});

router.post('/liked/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const food = await Food.findById(id);
    if (!food) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    const userIndex = food.usersLiked.indexOf(userId);

    if (userIndex === -1) {
      food.usersLiked.push(userId);
    } else {
      food.usersLiked.splice(userIndex, 1);
    }

    food.likes = food.usersLiked.length;

    await food.save();

    const responseData = {
      ...food.toObject(),
      liked: food.usersLiked.includes(userId),
      likes: food.usersLiked.length
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Error toggling like', error });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    const food = await Food.findById(id);
    if (!food) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    const responseData = {
      ...food.toObject(),
      liked: userId ? food.usersLiked.includes(userId) : false,
      likes: food.usersLiked.length
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching food item:', error);
    res.status(500).json({ message: 'Error fetching food item', error });
  }
});

module.exports = router;