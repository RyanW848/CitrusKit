const mongoose = require("mongoose");

const draftPickSchema = new mongoose.Schema({
    league: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "League",
        required: true,
        index: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
    },
    playerName: {
        type: String,
        required: [true, "Player name is required"],
        trim: true,
    },
    position: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
    },
    slot: {
        type: Number,
        required: true,
        min: [1, "Roster slot must be positive"],
    },
    amount: {
        type: Number,
        required: true,
        min: [0, "Draft amount cannot be negative"],
    },
    stat: {
        type: String,
        trim: true,
    },
    pickNumber: {
        type: Number,
        required: true,
        min: [1, "Pick number must be positive"],
    },
}, {
    timestamps: true,
});

draftPickSchema.index({ league: 1, player: 1 }, {
    unique: true,
    partialFilterExpression: { player: { $exists: true } },
});
draftPickSchema.index({ league: 1, playerName: 1 }, { unique: true });
draftPickSchema.index({ league: 1, pickNumber: 1 }, { unique: true });
draftPickSchema.index({ league: 1, owner: 1, position: 1, slot: 1 }, { unique: true });

module.exports = mongoose.model("DraftPick", draftPickSchema);
