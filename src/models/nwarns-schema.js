const mongoose = require('mongoose')

const warnSchema = mongoose.Schema({
  serverId: {
    type: String,
    required: true,
  },
  memberId: {
    type: String,
    required: true,
  },
  memberName: {
    type: String,
    required: true,
  },
  warnings: {
    type: Array,
    required: true,
  },
  warningsReceived: {
    type: Number,
    default: 0,
  },

})

module.exports = mongoose.model('Member-Warnings', warnSchema)