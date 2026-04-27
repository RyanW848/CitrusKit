const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const {
    listLeagues,
    createLeague,
    updateLeague,
    getLeagueById,
    getDraftState,
    createDraftPick,
    deleteDraftPick
} = require("../controllers/leagues.controller");

router.get("/", protect, listLeagues);
router.post("/", protect, createLeague);
router.patch("/:leagueId", protect, updateLeague);
router.get("/:leagueId/draft", protect, getDraftState);
router.post("/:leagueId/draft/picks", protect, createDraftPick);
router.delete("/:leagueId/draft/picks/:pickId", protect, deleteDraftPick);
router.get("/:leagueId", protect, getLeagueById);

module.exports = router;
