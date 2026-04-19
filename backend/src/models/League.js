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

const defaultRosterPositions = [
    { abbr: "C", name: "Catcher", count: 2, sortOrder: 1 },
    { abbr: "1B", name: "1st Baseman", count: 1, sortOrder: 2 },
    { abbr: "3B", name: "3rd Baseman", count: 1, sortOrder: 3 },
    { abbr: "CI", name: "Corner Infielder", count: 1, sortOrder: 4 },
    { abbr: "2B", name: "2nd Baseman", count: 1, sortOrder: 5 },
    { abbr: "SS", name: "Shortstop", count: 1, sortOrder: 6 },
    { abbr: "MI", name: "Middle Infielder", count: 1, sortOrder: 7 },
    { abbr: "OF", name: "Outfielder", count: 5, sortOrder: 8 },
    { abbr: "UT", name: "Utility", count: 1, sortOrder: 9 },
];

const rosterPositionSchema = new mongoose.Schema({
    abbr: {
        type: String,
        required: [true, "Roster position abbreviation is required"],
        trim: true,
        uppercase: true,
    },
    name: {
        type: String,
        required: [true, "Roster position name is required"],
        trim: true,
    },
    count: {
        type: Number,
        required: true,
        min: [1, "Roster position count must be positive"],
    },
    sortOrder: {
        type: Number,
        required: true,
        min: 1,
    },
}, {
    _id: false,
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
    rosterPositions: {
        type: [rosterPositionSchema],
        default: () => defaultRosterPositions.map((position) => ({ ...position })),
        validate: {
            validator(value) {
                return Array.isArray(value) && value.length > 0;
            },
            message: "At least one roster position is required",
        },
    },
}, {
    timestamps: true,
});

leagueSchema.statics.defaultRosterPositions = function defaultLeagueRosterPositions() {
    return defaultRosterPositions.map((position) => ({ ...position }));
};

module.exports = mongoose.model("League", leagueSchema);
