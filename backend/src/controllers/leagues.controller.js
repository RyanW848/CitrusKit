const League = require("../models/League");
const DraftPick = require("../models/DraftPick");

function serializeDraftPick(pick) {
    return {
        id: pick._id,
        league: pick.league,
        owner: pick.owner,
        player: pick.player,
        playerName: pick.playerName,
        position: pick.position,
        amount: pick.amount,
        stat: pick.stat,
        pickNumber: pick.pickNumber,
        createdAt: pick.createdAt,
        updatedAt: pick.updatedAt,
    };
}

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

async function findOwnedLeague(leagueId, userId) {
    const league = await League.findById(leagueId);

    if (!league) {
        return { status: 404, error: "League not found" };
    }

    if (league.createdBy.toString() !== userId.toString()) {
        return { status: 403, error: "Access denied" };
    }

    return { league };
}

function ownerBelongsToLeague(league, ownerId) {
    return (league.owners || []).some((owner) => owner._id.toString() === ownerId.toString());
}

function buildDraftState(league, picks) {
    const ownerStates = (league.owners || []).map((owner, index) => {
        const ownerPicks = picks.filter((pick) => pick.owner.toString() === owner._id.toString());
        const spent = ownerPicks.reduce((sum, pick) => sum + pick.amount, 0);

        return {
            id: owner._id,
            name: owner.name,
            slot: index + 1,
            budget: league.budget,
            spent,
            remainingBudget: league.budget - spent,
            roster: ownerPicks.map(serializeDraftPick),
        };
    });

    return {
        league: serializeLeague(league),
        picks: picks.map(serializeDraftPick),
        owners: ownerStates,
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
        const result = await findOwnedLeague(leagueId, req.user._id);

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }

        res.status(200).json(serializeLeague(result.league));
    } catch (error) {
        console.error("GET LEAGUE ERROR:", error);
        res.status(500).json({
            error: "Error fetching league details"
        });
    }
}

async function getDraftState(req, res) {
    try {
        const result = await findOwnedLeague(req.params.leagueId, req.user._id);

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }

        const picks = await DraftPick.find({ league: result.league._id }).sort({ pickNumber: 1 });

        return res.status(200).json(buildDraftState(result.league, picks));
    } catch (error) {
        console.error("GET DRAFT STATE ERROR:", error);
        return res.status(500).json({
            error: "Error fetching draft state"
        });
    }
}

async function createDraftPick(req, res) {
    try {
        const { ownerId, playerId, playerName, position, amount, stat } = req.body;

        if (!ownerId || !playerName || amount === undefined) {
            return res.status(400).json({
                error: "ownerId, playerName, and amount are required"
            });
        }

        const draftAmount = Number(amount);
        if (!Number.isFinite(draftAmount) || draftAmount < 0) {
            return res.status(400).json({
                error: "amount must be a non-negative number"
            });
        }

        const result = await findOwnedLeague(req.params.leagueId, req.user._id);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }

        const league = result.league;
        if (!ownerBelongsToLeague(league, ownerId)) {
            return res.status(400).json({
                error: "ownerId must belong to the league"
            });
        }

        const ownerPicks = await DraftPick.find({ league: league._id, owner: ownerId });
        const spent = ownerPicks.reduce((sum, pick) => sum + pick.amount, 0);
        if (spent + draftAmount > league.budget) {
            return res.status(400).json({
                error: "Draft pick exceeds owner budget"
            });
        }

        const existingPlayer = await DraftPick.findOne({
            league: league._id,
            $or: [
                ...(playerId ? [{ player: playerId }] : []),
                { playerName: playerName.trim() },
            ],
        });

        if (existingPlayer) {
            return res.status(409).json({
                error: "Player has already been drafted in this league"
            });
        }

        const lastPick = await DraftPick.findOne({ league: league._id }).sort({ pickNumber: -1 });
        const pick = await DraftPick.create({
            league: league._id,
            owner: ownerId,
            player: playerId || undefined,
            playerName,
            position,
            amount: draftAmount,
            stat,
            pickNumber: lastPick ? lastPick.pickNumber + 1 : 1,
        });

        return res.status(201).json(serializeDraftPick(pick));
    } catch (error) {
        console.error("CREATE DRAFT PICK ERROR:", error);
        return res.status(500).json({
            error: "Error creating draft pick"
        });
    }
}

async function deleteDraftPick(req, res) {
    try {
        const result = await findOwnedLeague(req.params.leagueId, req.user._id);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }

        const pick = await DraftPick.findOne({
            _id: req.params.pickId,
            league: result.league._id,
        });

        if (!pick) {
            return res.status(404).json({
                error: "Draft pick not found"
            });
        }

        await pick.deleteOne();

        return res.status(200).json({
            deleted: true,
            pick: serializeDraftPick(pick),
        });
    } catch (error) {
        console.error("DELETE DRAFT PICK ERROR:", error);
        return res.status(500).json({
            error: "Error deleting draft pick"
        });
    }
}

module.exports = {
    listLeagues,
    createLeague,
    getLeagueById,
    getDraftState,
    createDraftPick,
    deleteDraftPick,
};
