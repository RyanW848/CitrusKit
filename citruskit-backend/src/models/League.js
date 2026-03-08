const mongoose = require("mongoose");

const leagueSchema = new mongooseSchema({
    name: {
        type: String,
        required: [true, "League name is required"],
        trim: true,
    },
    createBy: {
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
        min: [0, "Budget must be a positive number"],
    },
    scoringTypes: {
        type: [String],
        required: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model("League", leagueSchema);