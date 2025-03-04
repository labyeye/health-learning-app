const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatGpt');
const auth = require('../middleware/auth');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const axios = require('axios');

router.get('/history/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const messages = await ChatMessage.find({ userId })
        .sort({ createdAt: 1 });
      
      res.status(200).json(messages);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      res.status(500).json({ message: 'Error fetching chat history', error: error.message });
    }
  });
  

router.post('/message', auth, async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Unauthorized message sending' });
    }
    
    const userMessage = new ChatMessage({
      userId,
      text: message,
      sender: 'user'
    });
    
    await userMessage.save();
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant focused on providing information about food, recipes, cooking techniques, and dietary advice. Keep responses concise and relevant to food topics.'
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const reply = response.data.choices[0].message.content;
    
    const aiMessage = new ChatMessage({
      userId,
      text: reply,
      sender: 'ai'
    });
    
    await aiMessage.save();
    
    res.status(200).json({ reply });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ message: 'Error processing message', error: error.message });
  }
});

router.delete('/history/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Unauthorized deletion of chat history' });
    }
    
    await ChatMessage.deleteMany({ userId });
    
    res.status(200).json({ message: 'Chat history deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    res.status(500).json({ message: 'Error deleting chat history', error: error.message });
  }
});

module.exports = router;