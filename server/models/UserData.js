const mongoose = require('mongoose');

const UserDataSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    targetSlots: {
        type: Number,
        default: 1
    },
    ownedRare: {
        type: Number,
        default: 0
    },
    ownedUncommon: {
        type: Number,
        default: 0
    },
    ownedCommon: {
        type: Number,
        default: 0
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('UserData', UserDataSchema);
