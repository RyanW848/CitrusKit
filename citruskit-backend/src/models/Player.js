const mongoose = require("mongoose");

// The projectedValue here should be computed via the API later on(?)
const playerSchema = new mongoose.Schema({
    name: String, 
    position: String, 
    projectedValue: Number,
},
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Player", playerSchema);