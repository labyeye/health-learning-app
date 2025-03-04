const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  cateogry:{
    type: String,
    required: true
  },
  photo: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Modules', moduleSchema);