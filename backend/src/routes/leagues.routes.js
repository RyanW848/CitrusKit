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
    deleteDraftPick,
    createPlanPick,
    deletePlanPick,
} = require("../controllers/leagues.controller");

router.get("/", protect, listLeagues);
router.post("/", protect, createLeague);
router.patch("/:leagueId", protect, updateLeague);
router.get("/:leagueId/draft", protect, getDraftState);
router.post("/:leagueId/draft/picks", protect, createDraftPick);
router.delete("/:leagueId/draft/picks/:pickId", protect, deleteDraftPick);
router.post("/:leagueId/plan/picks", protect, createPlanPick);
router.delete("/:leagueId/plan/picks/:pickId", protect, deletePlanPick);
router.get("/:leagueId", protect, getLeagueById);

module.exports = router;
