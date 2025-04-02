const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'List' }],
});

module.exports = mongoose.model('Board', boardSchema);