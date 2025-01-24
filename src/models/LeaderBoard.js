const { Schema, model } = require('mongoose');

const leaderboardMessageSchema = new Schema({
  guildId: {
    type: String,
    required: true,
  },
  messageId: {
    type: String,
    required: true,
  },
});

module.exports = model('LeaderboardMessage', leaderboardMessageSchema);