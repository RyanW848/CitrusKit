const mongoose = require("mongoose");

const planPickSchema = new mongoose.Schema({
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
    // External player ID from the DYKB API (omitted for custom players)
    player: {
        type: String,
    },
    playerName: {
        type: String,
        required: [true, "Player name is required"],
        trim: true,
    },
    position: {
        type: String,
        trim: true,
    },
    plannedAmount: {
        type: Number,
        default: 0,
        min: [0, "Planned amount cannot be negative"],
    },
}, {
    timestamps: true,
});

// Each owner can only plan a given player once per league
planPickSchema.index({ league: 1, owner: 1, playerName: 1 }, { unique: true });

module.exports = mongoose.model("PlanPick", planPickSchema);
