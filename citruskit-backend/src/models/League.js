const mongoose = require("mongoose");

const leagueSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "League name is required"],
        trim: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    teamCount: {
        type: Number,
        required: true,
        min: [2, "A league must have at least 2 teams"],
    },
    budget: {
        type: Number,
        required: true,
        min: [1, "Budget must be a positive number"],
    },
    scoringTypes: {
        type: [String],
        required: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model("League", leagueSchema);