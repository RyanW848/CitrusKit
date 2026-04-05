const League = require("../models/League");

// Fetching Leagues for the current user
async function getMyLeagues(req, res) {
    try {
        const leagues = await League.find({ createdBy: req.user._id })
            .sort({ updatedAt: -1 })
            .lean();

        res.status(200).json(
            leagues.map((l) => ({
                id: l._id,
                name: l.name,
                teamCount: l.teamCount,
                budget: l.budget,
                scoringTypes: l.scoringTypes,
                createdAt: l.createdAt,
                updatedAt: l.updatedAt,
            }))
        );
    } catch (error) {
        console.error("LIST LEAGUES ERROR:", error);
        res.status(500).json({
            error: "Error fetching leagues",
        });
    }
}

// Create a new league
async function createLeague(req, res) {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const teamCount = Number(req.body?.teamCount);
    const budget = Number(req.body?.budget);
    let scoringTypes = req.body?.scoringTypes;
    if (!Array.isArray(scoringTypes)) {
        scoringTypes =
            scoringTypes != null && scoringTypes !== ""
                ? [String(scoringTypes)]
                : [];
    }

    if (!name) {
        return res.status(400).json({ error: "League name is required" });
    }
    if (!Number.isInteger(teamCount) || teamCount < 2) {
        return res.status(400).json({
            error: "teamCount must be a whole number of at least 2",
        });
    }
    if (!Number.isFinite(budget) || budget < 1) {
        return res.status(400).json({
            error: "budget must be a number of at least 1",
        });
    }
    if (!scoringTypes.length) {
        return res.status(400).json({
            error: "scoringTypes must be a non-empty array of strings",
        });
    }

    try {
        const newLeague = await League.create({
            name,
            createdBy: req.user._id,
            teamCount,
            budget,
            scoringTypes,
        });

        res.status(201).json({
            id: newLeague._id,
            name: newLeague.name,
            createdBy: newLeague.createdBy,
            teamCount: newLeague.teamCount,
            budget: newLeague.budget,
            scoringTypes: newLeague.scoringTypes,
            createdAt: newLeague.createdAt,
            updatedAt: newLeague.updatedAt,
        });
    } catch (error) {
        console.error("CREATE LEAGUE ERROR:", error);
        if (error.name === "ValidationError") {
            const msg = Object.values(error.errors)
                .map((e) => e.message)
                .join(" ");
            return res.status(400).json({ error: msg || "Invalid league data" });
        }
        res.status(500).json({
            error: "Error creating league",
        });
    }
}

// Get league details by ID
async function getLeagueById(req, res) {
    try {
        const leagueId = req.params.leagueId;
        const league = await League.findById(leagueId);

        if (!league) {
            return res.status(404).json({
                error: "League not found"
            });
        }

        if (league.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                error: "Access denied"
            });
        }

        res.status(200).json({
            id: league._id,
            name: league.name,
            createdBy: league.createdBy,
            teamCount: league.teamCount,
            budget: league.budget,
            scoringTypes: league.scoringTypes,
            createdAt: league.createdAt,
            updatedAt: league.updatedAt,
        });
    } catch (error) {
        console.error("GET LEAGUE ERROR:", error);
        res.status(500).json({
            error: "Error fetching league details"
        });
    }
}

module.exports = {
    getMyLeagues,
    createLeague,
    getLeagueById,
};