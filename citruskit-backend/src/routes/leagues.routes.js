const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { getMyLeagues, createLeague, getLeagueById } = require("../controllers/leagues.controller");

function requireMongo(req, res, next) {
  if (mongoose.connection.readyState === 1) return next();
  return res.status(503).json({
    error:
      "Database is not connected. Check MongoDB is running and MONGO_URI in citruskit-backend/.env is reachable.",
  });
}

router.use(requireMongo);

router.get("/", protect, getMyLeagues);
router.post("/", protect, createLeague);
router.get("/:leagueId", protect, getLeagueById);

module.exports = router;