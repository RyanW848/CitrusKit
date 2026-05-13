const mongoose = require("mongoose");

const playerNoteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    player: {
        type: String, // API player ID; absent for custom players
    },
    playerName: {
        type: String,
        required: [true, "Player name is required"],
        trim: true,
    },
    note: {
        type: String,
        default: "",
        trim: true,
    },
    isCustom: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// One note per API player per user
playerNoteSchema.index({ user: 1, player: 1 }, {
    unique: true,
    partialFilterExpression: { player: { $exists: true } },
});

// One note per custom player name per user (no player ID)
playerNoteSchema.index({ user: 1, playerName: 1 }, {
    unique: true,
    partialFilterExpression: { player: { $exists: false } },
});

module.exports = mongoose.model("PlayerNote", playerNoteSchema);
