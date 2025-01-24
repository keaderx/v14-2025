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
  adminwarns: {
    type: [Object],
    required: true,
  },
  adminWarnings: {
    type: Number,
    default: 0,
  },

})

module.exports = mongoose.model('Admin-Warnings', warnSchema)