const mongoose = require('mongoose')

const warnIdSchema = mongoose.Schema({
  serverId: {
    type: String,
    required: true,
  },
  WarnIDS: {
    type: [Object],
    required: true,
  },
})

module.exports = mongoose.model('Warning-IDS', warnIdSchema)