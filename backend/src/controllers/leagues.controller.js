const League = require("../models/League");

function serializeLeague(league) {
    return {
        id: league._id,
        name: league.name,
        createdBy: league.createdBy,
        teamCount: league.teamCount,
        budget: league.budget,
        scoringTypes: league.scoringTypes,
        owners: (league.owners || []).map((owner, index) => ({
            id: owner._id,
            name: owner.name,
            slot: index + 1,
        })),
        createdAt: league.createdAt,
        updatedAt: league.updatedAt,
    };
}

// List leagues for the current user
async function listLeagues(req, res) {
    try {
        const leagues = await League.find({ createdBy: req.user._id })
            .sort({ updatedAt: -1, createdAt: -1 });

        return res.status(200).json({
            leagues: leagues.map(serializeLeague),
        });
    } catch (error) {
        console.error("LIST LEAGUES ERROR:", error);
        return res.status(500).json({
            error: "Error fetching leagues"
        });
    }
}

// Create a new league
async function createLeague(req, res) {
    const { name, teamCount, budget, scoringTypes, owners } = req.body;
    const normalizedOwners = Array.isArray(owners)
        ? owners
            .map((owner) => ({
                name: typeof owner === "string" ? owner.trim() : owner?.name?.trim(),
            }))
            .filter((owner) => owner.name)
        : [];

    if (!name || !teamCount || !budget || !scoringTypes || normalizedOwners.length === 0) {
        return res.status(400).json({
            error: "name, teamCount, budget, scoringTypes, and owners are required"
        });
    }

    if (normalizedOwners.length !== Number(teamCount)) {
        return res.status(400).json({
            error: "The number of league owners must match teamCount"
        });
    }

    try {
        const newLeague = await League.create({
            name,
            createdBy: req.user._id,
            teamCount,
            budget,
            scoringTypes,
            owners: normalizedOwners,
        });

        res.status(201).json(serializeLeague(newLeague));
    } catch (error) {
        console.error("CREATE LEAGUE ERROR:", error);
        res.status(500).json({
            error: "Error creating league"
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

        res.status(200).json(serializeLeague(league));
    } catch (error) {
        console.error("GET LEAGUE ERROR:", error);
        res.status(500).json({
            error: "Error fetching league details"
        });
    }
}

module.exports = {
    listLeagues,
    createLeague,
    getLeagueById,
};