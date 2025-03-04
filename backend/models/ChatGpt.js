const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    sender: {
      type: String,
      enum: ['user', 'ai'],
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);