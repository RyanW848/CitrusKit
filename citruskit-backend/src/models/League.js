const mongoose = require("mongoose");

const leagueOwnerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Owner name is required"],
        trim: true,
    },
}, {
    _id: true,
});

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
    owners: {
        type: [leagueOwnerSchema],
        required: true,
        validate: {
            validator(value) {
                return Array.isArray(value) && value.length > 0;
            },
            message: "At least one league owner is required",
        },
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model("League", leagueSchema);
