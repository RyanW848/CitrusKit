const League = require("../models/League");

// Create a new league
async function createLeague(req, res) {
    const { name, teamCount, budget, scoringTypes } = req.body;

    if (!name || !teamCount || !budget || !scoringTypes) {
        return res.status(400).json({
            error: "name, teamCount, budget, and scoringTypes are required"
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
    createLeague,
    getLeagueById,
};