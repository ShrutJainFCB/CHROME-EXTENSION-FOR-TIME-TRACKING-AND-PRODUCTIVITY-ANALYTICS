const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  url: String,
  duration: Number,
  timestamp: Date,
  category: String   
});

module.exports = mongoose.model('Log', logSchema);
