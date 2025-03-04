const mongoose = require('mongoose');
const foodSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    desc: {
      type: String,
      required: true,
      trim: true,
    },
    uri: {
      type: String,
      required: false,
    },
    usersLiked: {
      type: [String], 
      default: []
    },
    ingredients: {
      type: [{
        name: { type: String, required: true },
        quantity: { type: String, required: false },
        note: { type: String, required: false }
      }],
      default: []
    }
  },
  {timestamps: true},
);
module.exports = mongoose.model('Food', foodSchema);