const mongoose = require("mongoose");

const draftEventSchema = new mongoose.Schema({
    league: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "League",
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ["pick_added", "pick_removed"],
        required: true,
    },
    pickNumber: { type: Number },
    playerName: { type: String, required: true },
    ownerName: { type: String, required: true },
    position: { type: String },
    amount: { type: Number },
    stat: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("DraftEvent", draftEventSchema);
