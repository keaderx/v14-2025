const mongoose = require('mongoose');

const planSchema = mongoose.Schema({
    guildId: String,
    userId: String,
    ktmsenergy: {
        type: Number,
        default: 0,
    },
    ktmsrespect: {
        type: Number,
        default: 0,
    },
    ktmscoins: {
        type: Number,
        default: 0,
    },
    lastGave: {type: Number},
    lastUsed: {type: Number},
    dailyTime: {type: Number},

});

module.exports = mongoose.model('ktms-system', planSchema, 'ktms-system');