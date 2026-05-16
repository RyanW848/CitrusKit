const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const {
    listLeagues,
    createLeague,
    updateLeague,
    deleteLeague,
    getLeagueById,
    getDraftState,
    getDraftHistory,
    createDraftPick,
    deleteDraftPick,
    updateDraftPick,
    swapDraftPicks,
    createPlanPick,
    deletePlanPick,
    updatePlanPick,
    createMinorLeaguePick,
    deleteMinorLeaguePick,
    createTaxiPick,
    deleteTaxiPick,
    seedTestLeague,
} = require("../controllers/leagues.controller");

router.get("/", protect, listLeagues);
router.post("/", protect, createLeague);
router.post("/test-seed", protect, seedTestLeague);
router.patch("/:leagueId", protect, updateLeague);
router.delete("/:leagueId", protect, deleteLeague);
router.get("/:leagueId/draft", protect, getDraftState);
router.get("/:leagueId/draft/history", protect, getDraftHistory);
router.post("/:leagueId/draft/picks", protect, createDraftPick);
router.post("/:leagueId/draft/picks/swap", protect, swapDraftPicks);
router.patch("/:leagueId/draft/picks/:pickId", protect, updateDraftPick);
router.delete("/:leagueId/draft/picks/:pickId", protect, deleteDraftPick);
router.post("/:leagueId/plan/picks", protect, createPlanPick);
router.patch("/:leagueId/plan/picks/:pickId", protect, updatePlanPick);
router.delete("/:leagueId/plan/picks/:pickId", protect, deletePlanPick);
router.post("/:leagueId/minor-league/picks", protect, createMinorLeaguePick);
router.delete("/:leagueId/minor-league/picks/:pickId", protect, deleteMinorLeaguePick);
router.post("/:leagueId/taxi/picks", protect, createTaxiPick);
router.delete("/:leagueId/taxi/picks/:pickId", protect, deleteTaxiPick);
router.get("/:leagueId", protect, getLeagueById);

module.exports = router;
