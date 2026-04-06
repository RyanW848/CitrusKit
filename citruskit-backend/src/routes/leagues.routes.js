const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const {
    listLeagues,
    createLeague,
    getLeagueById
} = require("../controllers/leagues.controller");

router.get("/", protect, listLeagues);
router.post("/", protect, createLeague);
router.get("/:leagueId", protect, getLeagueById);

module.exports = router;
