const mongoose = require("mongoose");

const minorLeaguePickSchema = new mongoose.Schema({
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
        type: String,
    },
    playerName: {
        type: String,
        required: [true, "Player name is required"],
        trim: true,
    },
}, {
    timestamps: true,
});

minorLeaguePickSchema.index({ league: 1, owner: 1, playerName: 1 }, { unique: true });

module.exports = mongoose.model("MinorLeaguePick", minorLeaguePickSchema);
