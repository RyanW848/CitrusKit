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
        slot: pick.slot,
        rosterSlot: `${pick.position}-${pick.slot}`,
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
        rosterPositions: serializeRosterPositions(getLeagueRosterPositions(league)),
        owners: (league.owners || []).map((owner, index) => ({
            id: owner._id,
            name: owner.name,
            slot: index + 1,
        })),
        createdAt: league.createdAt,
        updatedAt: league.updatedAt,
    };
}

function serializeRosterPositions(rosterPositions = []) {
    return rosterPositions
        .map((position) => ({
            abbr: position.abbr,
            name: position.name,
            count: position.count,
            sortOrder: position.sortOrder,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder);
}

function getLeagueRosterPositions(league) {
    if (Array.isArray(league.rosterPositions) && league.rosterPositions.length > 0) {
        return league.rosterPositions;
    }

    return League.defaultRosterPositions();
}

function normalizeRosterPositions(rosterPositions) {
    if (!Array.isArray(rosterPositions) || rosterPositions.length === 0) {
        return undefined;
    }

    const seen = new Set();
    const normalized = rosterPositions
        .map((position, index) => ({
            abbr: position?.abbr?.trim().toUpperCase(),
            name: position?.name?.trim(),
            count: Number(position?.count),
            sortOrder: Number(position?.sortOrder || index + 1),
        }))
        .filter((position) => position.abbr || position.name || position.count);

    if (normalized.length === 0) {
        return { error: "At least one roster position is required" };
    }

    for (const position of normalized) {
        if (!position.abbr || !position.name || !Number.isInteger(position.count) || position.count < 1) {
            return { error: "Each roster position must include abbr, name, and a positive count" };
        }

        if (seen.has(position.abbr)) {
            return { error: "Roster position abbreviations must be unique" };
        }

        seen.add(position.abbr);
    }

    return { rosterPositions: normalized };
}

function normalizeOwners(owners) {
    if (!Array.isArray(owners) || owners.length === 0) {
        return [];
    }

    return owners
        .map((owner) => ({
            id: typeof owner === "object" && owner !== null ? owner.id || owner._id : undefined,
            name: typeof owner === "string" ? owner.trim() : owner?.name?.trim(),
        }))
        .filter((owner) => owner.name);
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

async function getLeaguePickUsage(leagueId) {
    const picks = await DraftPick.find({ league: leagueId });
    const usedOwnerIds = new Set(picks.map((pick) => pick.owner.toString()));
    const usedSlotsByPosition = picks.reduce((positions, pick) => {
        const currentMax = positions.get(pick.position) || 0;
        positions.set(pick.position, Math.max(currentMax, pick.slot));
        return positions;
    }, new Map());

    return {
        picks,
        usedOwnerIds,
        usedSlotsByPosition,
    };
}

function ownerIdsMatch(ownersA = [], ownersB = []) {
    if (ownersA.length !== ownersB.length) {
        return false;
    }

    return ownersA.every((owner, index) => (
        owner._id.toString() === ownersB[index]._id.toString()
    ));
}

function rosterPositionsSupportExistingPicks(rosterPositions, usedSlotsByPosition) {
    return Array.from(usedSlotsByPosition.entries()).every(([abbr, usedSlotCount]) => {
        const position = rosterPositions.find((item) => item.abbr === abbr);
        return position && position.count >= usedSlotCount;
    });
}

function ownerBelongsToLeague(league, ownerId) {
    return (league.owners || []).some((owner) => owner._id.toString() === ownerId.toString());
}

function findRosterPosition(league, abbr) {
    return serializeRosterPositions(getLeagueRosterPositions(league))
        .find((position) => position.abbr === abbr);
}

function findFirstAvailableSlot(league, ownerPicks) {
    for (const position of serializeRosterPositions(getLeagueRosterPositions(league))) {
        for (let slot = 1; slot <= position.count; slot += 1) {
            const isFilled = ownerPicks.some((pick) => pick.position === position.abbr && pick.slot === slot);
            if (!isFilled) {
                return { position, slot };
            }
        }
    }

    return null;
}

function findFirstAvailableSlotForPosition(position, ownerPicks) {
    for (let slot = 1; slot <= position.count; slot += 1) {
        const isFilled = ownerPicks.some((pick) => pick.position === position.abbr && pick.slot === slot);
        if (!isFilled) {
            return slot;
        }
    }

    return null;
}

function buildRosterSlots(league, ownerPicks) {
    return serializeRosterPositions(getLeagueRosterPositions(league))
        .flatMap((position) => {
            return Array.from({ length: position.count }, (_, index) => {
                const slot = index + 1;
                const pick = ownerPicks.find((ownerPick) => (
                    ownerPick.position === position.abbr && ownerPick.slot === slot
                ));

                return {
                    id: `${position.abbr}-${slot}`,
                    abbr: position.abbr,
                    name: position.name,
                    slot,
                    pick: pick ? serializeDraftPick(pick) : null,
                };
            });
        });
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
            rosterSlots: buildRosterSlots(league, ownerPicks),
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
    const { name, teamCount, budget, scoringTypes, owners, rosterPositions } = req.body;
    const normalizedOwners = normalizeOwners(owners);

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

    const normalizedRosterPositions = normalizeRosterPositions(rosterPositions);
    if (normalizedRosterPositions?.error) {
        return res.status(400).json({
            error: normalizedRosterPositions.error
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
            ...(normalizedRosterPositions?.rosterPositions
                ? { rosterPositions: normalizedRosterPositions.rosterPositions }
                : {}),
        });

        res.status(201).json(serializeLeague(newLeague));
    } catch (error) {
        console.error("CREATE LEAGUE ERROR:", error);
        res.status(500).json({
            error: "Error creating league"
        });
    }
}

async function updateLeague(req, res) {
    const {
        name,
        teamCount,
        budget,
        scoringTypes,
        owners,
        rosterPositions,
    } = req.body;

    const hasName = name !== undefined;
    const hasTeamCount = teamCount !== undefined;
    const hasBudget = budget !== undefined;
    const hasScoringTypes = scoringTypes !== undefined;
    const hasOwners = owners !== undefined;
    const hasRosterPositions = rosterPositions !== undefined;

    if (!hasName && !hasTeamCount && !hasBudget && !hasScoringTypes && !hasOwners && !hasRosterPositions) {
        return res.status(400).json({
            error: "Provide at least one league field to update"
        });
    }

    try {
        const result = await findOwnedLeague(req.params.leagueId, req.user._id);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }

        const league = result.league;
        const normalizedOwners = hasOwners ? normalizeOwners(owners) : null;
        if (hasOwners && normalizedOwners.length === 0) {
            return res.status(400).json({
                error: "At least one league owner is required"
            });
        }

        const nextTeamCount = hasTeamCount
            ? Number(teamCount)
            : (hasOwners ? normalizedOwners.length : league.teamCount);
        if (!Number.isInteger(nextTeamCount) || nextTeamCount < 1) {
            return res.status(400).json({
                error: "teamCount must be a positive integer"
            });
        }

        if (hasOwners && normalizedOwners.length !== nextTeamCount) {
            return res.status(400).json({
                error: "The number of league owners must match teamCount"
            });
        }

        if (!hasOwners && hasTeamCount && nextTeamCount !== (league.owners || []).length) {
            return res.status(400).json({
                error: "teamCount must match the current number of league owners"
            });
        }

        if (hasName) {
            const trimmedName = typeof name === "string" ? name.trim() : "";
            if (!trimmedName) {
                return res.status(400).json({
                    error: "League name is required"
                });
            }
            league.name = trimmedName;
        }

        if (hasBudget) {
            const normalizedBudget = Number(budget);
            if (!Number.isFinite(normalizedBudget) || normalizedBudget < 1) {
                return res.status(400).json({
                    error: "budget must be a positive number"
                });
            }
            league.budget = normalizedBudget;
        }

        if (hasScoringTypes) {
            if (!Array.isArray(scoringTypes) || scoringTypes.length === 0) {
                return res.status(400).json({
                    error: "At least one scoring type is required"
                });
            }

            const normalizedScoringTypes = scoringTypes
                .map((type) => (typeof type === "string" ? type.trim() : ""))
                .filter(Boolean);

            if (normalizedScoringTypes.length === 0) {
                return res.status(400).json({
                    error: "At least one scoring type is required"
                });
            }

            league.scoringTypes = normalizedScoringTypes;
        }

        const normalizedRosterPositions = hasRosterPositions
            ? normalizeRosterPositions(rosterPositions)
            : null;
        if (normalizedRosterPositions?.error) {
            return res.status(400).json({
                error: normalizedRosterPositions.error
            });
        }

        const { usedOwnerIds, usedSlotsByPosition } = await getLeaguePickUsage(league._id);

        if (hasOwners && usedOwnerIds.size > 0) {
            const ownerIdsById = new Map((league.owners || []).map((owner) => [owner._id.toString(), owner]));
            const nextOwners = normalizedOwners.map((owner) => {
                if (!owner.id) {
                    return null;
                }

                return ownerIdsById.get(owner.id.toString())
                    ? { _id: owner.id, name: owner.name }
                    : null;
            });

            if (nextOwners.includes(null)) {
                return res.status(400).json({
                    error: "Owners with existing draft picks must keep their current ids"
                });
            }

            if (!ownerIdsMatch(league.owners || [], nextOwners)) {
                return res.status(400).json({
                    error: "Cannot add, remove, or reorder owners after draft picks exist"
                });
            }

            league.owners = nextOwners;
        } else if (hasOwners) {
            league.owners = normalizedOwners.map((owner) => ({ name: owner.name }));
        }

        if (hasRosterPositions) {
            if (
                usedSlotsByPosition.size > 0 &&
                !rosterPositionsSupportExistingPicks(
                    normalizedRosterPositions.rosterPositions,
                    usedSlotsByPosition
                )
            ) {
                return res.status(400).json({
                    error: "Roster positions cannot remove or shrink slots that already contain draft picks"
                });
            }

            league.rosterPositions = normalizedRosterPositions.rosterPositions;
        }

        league.teamCount = nextTeamCount;

        await league.save();

        return res.status(200).json(serializeLeague(league));
    } catch (error) {
        console.error("UPDATE LEAGUE ERROR:", error);
        return res.status(500).json({
            error: "Error updating league"
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
        const { ownerId, playerId, playerName, position, slot, rosterSlot, amount, stat } = req.body;

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

        const requestedRosterSlot = rosterSlot?.trim().toUpperCase();
        const [rosterSlotPosition, rosterSlotNumber] = requestedRosterSlot
            ? requestedRosterSlot.split("-")
            : [];
        const requestedPosition = (position || rosterSlotPosition)?.trim().toUpperCase();
        const requestedSlot = slot !== undefined
            ? Number(slot)
            : (rosterSlotNumber ? Number(rosterSlotNumber) : undefined);
        const targetPosition = requestedPosition
            ? findRosterPosition(league, requestedPosition)
            : null;

        if (requestedPosition && !targetPosition) {
            return res.status(400).json({
                error: "position must match a league roster position"
            });
        }

        if (requestedSlot !== undefined && (!Number.isInteger(requestedSlot) || requestedSlot < 1)) {
            return res.status(400).json({
                error: "slot must be a positive integer"
            });
        }

        let targetSlotAssignment;
        if (targetPosition && requestedSlot !== undefined) {
            targetSlotAssignment = { position: targetPosition, slot: requestedSlot };
        } else if (targetPosition) {
            targetSlotAssignment = {
                position: targetPosition,
                slot: findFirstAvailableSlotForPosition(targetPosition, ownerPicks),
            };
        } else {
            targetSlotAssignment = findFirstAvailableSlot(league, ownerPicks);
        }

        if (!targetSlotAssignment || !targetSlotAssignment.slot) {
            return res.status(400).json({
                error: requestedPosition
                    ? `${targetPosition.abbr} roster slots are full for this owner`
                    : "No open roster slots remain for this owner"
            });
        }

        if (targetSlotAssignment.slot > targetSlotAssignment.position.count) {
            return res.status(400).json({
                error: `${targetSlotAssignment.position.abbr}-${targetSlotAssignment.slot} is not a valid roster slot`
            });
        }

        const existingSlotPick = ownerPicks.find((pick) => (
            pick.position === targetSlotAssignment.position.abbr && pick.slot === targetSlotAssignment.slot
        ));

        if (existingSlotPick) {
            return res.status(409).json({
                error: `${targetSlotAssignment.position.abbr}-${targetSlotAssignment.slot} is already filled`
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
            position: targetSlotAssignment.position.abbr,
            slot: targetSlotAssignment.slot,
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
    updateLeague,
    getLeagueById,
    getDraftState,
    createDraftPick,
    deleteDraftPick,
};
