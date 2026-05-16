const League = require("../models/League");
const DraftPick = require("../models/DraftPick");
const DraftEvent = require("../models/DraftEvent");
const PlanPick = require("../models/PlanPick");
const MinorLeaguePick = require("../models/MinorLeaguePick");
const TaxiPick = require("../models/TaxiPick");
const PlayerNote = require("../models/PlayerNote");
const testFixture = require("../fixtures/testDraft2026.json");

async function ensureCustomPlayerNote(userId, playerName) {
    await PlayerNote.updateOne(
        { user: userId, playerName: playerName.trim(), player: { $exists: false } },
        {
            $setOnInsert: {
                user: userId,
                playerName: playerName.trim(),
                note: "Custom player",
                isCustom: true,
            },
        },
        { upsert: true },
    );
}

function serializeTaxiPick(pick) {
    return {
        id: pick._id,
        owner: pick.owner,
        player: pick.player,
        playerName: pick.playerName,
    };
}

function serializeMinorLeaguePick(pick) {
    return {
        id: pick._id,
        owner: pick.owner,
        player: pick.player,
        playerName: pick.playerName,
    };
}

function serializePlanPick(pick) {
    return {
        id: pick._id,
        league: pick.league,
        owner: pick.owner,
        player: pick.player,
        playerName: pick.playerName,
        position: pick.position,
        plannedAmount: pick.plannedAmount,
        createdAt: pick.createdAt,
        updatedAt: pick.updatedAt,
    };
}

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

function touchLeague(leagueId) {
    League.updateOne({ _id: leagueId }, { $set: { updatedAt: new Date() } }).catch(() => {});
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

function buildPlannedRosterSlots(league, ownerPlans, ownerPicks = []) {
    const remainingPlans = [...ownerPlans];

    return serializeRosterPositions(getLeagueRosterPositions(league))
        .flatMap((position) => {
            return Array.from({ length: position.count }, (_, index) => {
                const slot = index + 1;
                const isFilledByActual = ownerPicks.some(
                    (pick) => pick.position === position.abbr && pick.slot === slot
                );

                let plan = null;
                if (!isFilledByActual) {
                    const planIndex = remainingPlans.findIndex((p) => p.position === position.abbr);
                    if (planIndex >= 0) {
                        plan = remainingPlans.splice(planIndex, 1)[0];
                    }
                }

                return {
                    id: `plan-${position.abbr}-${index + 1}`,
                    abbr: position.abbr,
                    name: position.name,
                    slot,
                    plan: plan ? serializePlanPick(plan) : null,
                };
            });
        });
}

function buildDraftState(league, picks, planPicks = [], minorLeaguePicks = [], taxiPicks = []) {
    const ownerStates = (league.owners || []).map((owner, index) => {
        const ownerPicks = picks.filter((pick) => pick.owner.toString() === owner._id.toString());
        const ownerPlans = planPicks.filter((p) => p.owner.toString() === owner._id.toString());
        const ownerMinorLeague = minorLeaguePicks.filter((p) => p.owner.toString() === owner._id.toString());
        const ownerTaxi = taxiPicks.filter((p) => p.owner.toString() === owner._id.toString());
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
            plannedRosterSlots: buildPlannedRosterSlots(league, ownerPlans, ownerPicks),
            minorLeaguePlayers: ownerMinorLeague.map(serializeMinorLeaguePick),
            taxiPlayers: ownerTaxi.map(serializeTaxiPick),
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

async function getDraftHistory(req, res) {
    try {
        const result = await findOwnedLeague(req.params.leagueId, req.user._id);
        if (result.error) return res.status(result.status).json({ error: result.error });

        const events = await DraftEvent.find({ league: result.league._id }).sort({ createdAt: 1 });
        return res.status(200).json({
            events: events.map((e) => ({
                id: e._id,
                type: e.type,
                pickNumber: e.pickNumber,
                playerName: e.playerName,
                ownerName: e.ownerName,
                fromOwnerName: e.fromOwnerName,
                position: e.position,
                amount: e.amount,
                stat: e.stat,
                timestamp: e.createdAt,
            })),
        });
    } catch (error) {
        console.error("GET DRAFT HISTORY ERROR:", error);
        return res.status(500).json({ error: "Error fetching draft history" });
    }
}

async function getDraftState(req, res) {
    try {
        const result = await findOwnedLeague(req.params.leagueId, req.user._id);

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }

        const [picks, planPicks, minorLeaguePicks, taxiPicks] = await Promise.all([
            DraftPick.find({ league: result.league._id }).sort({ pickNumber: 1 }),
            PlanPick.find({ league: result.league._id }),
            MinorLeaguePick.find({ league: result.league._id }),
            TaxiPick.find({ league: result.league._id }),
        ]);

        return res.status(200).json(buildDraftState(result.league, picks, planPicks, minorLeaguePicks, taxiPicks));
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

        const playerQuery = {
            league: league._id,
            $or: [
                ...(playerId ? [{ player: playerId }] : []),
                { playerName: playerName.trim() },
            ],
        };

        const [existingPlayer, existingTaxiPick, existingMinorLeaguePick] = await Promise.all([
            DraftPick.findOne(playerQuery),
            TaxiPick.findOne(playerQuery),
            MinorLeaguePick.findOne(playerQuery),
        ]);

        if (existingPlayer) {
            return res.status(409).json({
                error: "Player has already been drafted in this league"
            });
        }

        if (existingTaxiPick) {
            return res.status(409).json({
                error: "Player is already on a taxi squad in this league"
            });
        }

        if (existingMinorLeaguePick) {
            return res.status(409).json({
                error: "Player is already on a minor league roster in this league"
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

        // Remove the owner's plan pick for this player if one exists
        await PlanPick.deleteOne({ league: league._id, owner: ownerId, playerName: playerName.trim() });

        if (!playerId) await ensureCustomPlayerNote(req.user._id, playerName);

        const ownerRecord = league.owners.find((o) => String(o._id) === String(ownerId));
        DraftEvent.create({
            league: league._id,
            type: "pick_added",
            pickNumber: pick.pickNumber,
            playerName: pick.playerName,
            ownerName: ownerRecord?.name ?? "Unknown",
            position: pick.position,
            amount: pick.amount,
            stat: pick.stat,
        }).catch(() => {});
        touchLeague(league._id);

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

        const ownerRecord = result.league.owners.find((o) => String(o._id) === String(pick.owner));
        DraftEvent.create({
            league: result.league._id,
            type: "pick_removed",
            pickNumber: pick.pickNumber,
            playerName: pick.playerName,
            ownerName: ownerRecord?.name ?? "Unknown",
            position: pick.position,
            amount: pick.amount,
            stat: pick.stat,
        }).catch(() => {});
        touchLeague(result.league._id);

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

async function updateDraftPick(req, res) {
    try {
        const { position, slot } = req.body;

        const result = await findOwnedLeague(req.params.leagueId, req.user._id);
        if (result.error) return res.status(result.status).json({ error: result.error });

        const league = result.league;
        const normalizedPosition = position?.trim().toUpperCase();
        const targetPosition = normalizedPosition ? findRosterPosition(league, normalizedPosition) : null;
        if (!targetPosition) return res.status(400).json({ error: "position must match a league roster position" });

        const targetSlot = slot !== undefined ? Number(slot) : 1;
        if (!Number.isInteger(targetSlot) || targetSlot < 1) {
            return res.status(400).json({ error: "slot must be a positive integer" });
        }

        const pick = await DraftPick.findOne({ _id: req.params.pickId, league: league._id });
        if (!pick) return res.status(404).json({ error: "Draft pick not found" });

        const conflict = await DraftPick.findOne({
            _id: { $ne: pick._id },
            league: league._id,
            owner: pick.owner,
            position: normalizedPosition,
            slot: targetSlot,
        });
        if (conflict) return res.status(409).json({ error: `${normalizedPosition}-${targetSlot} is already filled` });

        pick.position = normalizedPosition;
        pick.slot = targetSlot;
        await pick.save();
        touchLeague(league._id);

        return res.status(200).json(serializeDraftPick(pick));
    } catch (error) {
        console.error("UPDATE DRAFT PICK ERROR:", error);
        return res.status(500).json({ error: "Error updating draft pick" });
    }
}

async function swapDraftPicks(req, res) {
    try {
        const { pickAId, pickBId } = req.body;
        if (!pickAId || !pickBId) {
            return res.status(400).json({ error: "pickAId and pickBId are required" });
        }

        const result = await findOwnedLeague(req.params.leagueId, req.user._id);
        if (result.error) return res.status(result.status).json({ error: result.error });

        const league = result.league;
        const [pickA, pickB] = await Promise.all([
            DraftPick.findOne({ _id: pickAId, league: league._id }),
            DraftPick.findOne({ _id: pickBId, league: league._id }),
        ]);

        if (!pickA || !pickB) return res.status(404).json({ error: "Draft pick not found" });

        const origA = { position: pickA.position, slot: pickA.slot };
        const origB = { position: pickB.position, slot: pickB.slot };

        // 3-step swap to avoid unique (league, owner, position, slot) constraint conflict:
        // move pickA to a temporary position that can't exist in the league, swap pickB, then finalize pickA
        const tempPosition = `__SWAPTMP_${pickA._id}`;
        await DraftPick.updateOne({ _id: pickA._id }, { $set: { position: tempPosition } });
        await DraftPick.updateOne({ _id: pickB._id }, { $set: { position: origA.position, slot: origA.slot } });
        await DraftPick.updateOne({ _id: pickA._id }, { $set: { position: origB.position, slot: origB.slot } });
        touchLeague(league._id);

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("SWAP DRAFT PICKS ERROR:", error);
        return res.status(500).json({ error: "Error swapping draft picks" });
    }
}

async function transferDraftPick(req, res) {
    try {
        const { targetOwnerId, position, slot } = req.body;
        if (!targetOwnerId || !position || slot === undefined) {
            return res.status(400).json({ error: "targetOwnerId, position, and slot are required" });
        }

        const result = await findOwnedLeague(req.params.leagueId, req.user._id);
        if (result.error) return res.status(result.status).json({ error: result.error });

        const league = result.league;

        if (!ownerBelongsToLeague(league, targetOwnerId)) {
            return res.status(400).json({ error: "targetOwnerId must belong to the league" });
        }

        const normalizedPosition = position.trim().toUpperCase();
        const targetPosition = findRosterPosition(league, normalizedPosition);
        if (!targetPosition) return res.status(400).json({ error: "position must match a league roster position" });

        const targetSlot = Number(slot);
        if (!Number.isInteger(targetSlot) || targetSlot < 1 || targetSlot > targetPosition.count) {
            return res.status(400).json({ error: "slot is out of range for that position" });
        }

        const pick = await DraftPick.findOne({ _id: req.params.pickId, league: league._id });
        if (!pick) return res.status(404).json({ error: "Draft pick not found" });

        if (String(pick.owner) === String(targetOwnerId)) {
            return res.status(400).json({ error: "Player is already on that team" });
        }

        const fromOwnerRecord = league.owners.find((o) => String(o._id) === String(pick.owner));
        const toOwnerRecord   = league.owners.find((o) => String(o._id) === String(targetOwnerId));

        const occupant = await DraftPick.findOne({
            league: league._id,
            owner: targetOwnerId,
            position: normalizedPosition,
            slot: targetSlot,
        });

        if (occupant) {
            // Cross-team swap — budget check accounts for amounts trading hands
            const [sourceOwnerPicks, targetOwnerPicks] = await Promise.all([
                DraftPick.find({ league: league._id, owner: pick.owner }),
                DraftPick.find({ league: league._id, owner: targetOwnerId }),
            ]);
            const sourceSpend = sourceOwnerPicks.reduce((sum, p) => sum + p.amount, 0);
            const targetSpend = targetOwnerPicks.reduce((sum, p) => sum + p.amount, 0);

            if (sourceSpend - pick.amount + occupant.amount > league.budget) {
                return res.status(400).json({ error: "Swap would exceed the source team's budget" });
            }
            if (targetSpend - occupant.amount + pick.amount > league.budget) {
                return res.status(400).json({ error: "Swap would exceed the target team's budget" });
            }

            const origA = { owner: pick.owner,     position: pick.position,         slot: pick.slot };
            const origB = { owner: occupant.owner, position: occupant.position,     slot: occupant.slot };
            const tempPosition = `__SWAPTMP_${pick._id}`;

            await DraftPick.updateOne({ _id: pick._id },     { $set: { position: tempPosition } });
            await DraftPick.updateOne({ _id: occupant._id }, { $set: { owner: origA.owner, position: origA.position, slot: origA.slot } });
            await DraftPick.updateOne({ _id: pick._id },     { $set: { owner: origB.owner, position: origB.position, slot: origB.slot } });

            Promise.all([
                DraftEvent.create({
                    league: league._id,
                    type: "pick_transferred",
                    pickNumber: pick.pickNumber,
                    playerName: pick.playerName,
                    ownerName: toOwnerRecord?.name ?? "Unknown",
                    fromOwnerName: fromOwnerRecord?.name ?? "Unknown",
                    position: normalizedPosition,
                    amount: pick.amount,
                    stat: pick.stat,
                }),
                DraftEvent.create({
                    league: league._id,
                    type: "pick_transferred",
                    pickNumber: occupant.pickNumber,
                    playerName: occupant.playerName,
                    ownerName: fromOwnerRecord?.name ?? "Unknown",
                    fromOwnerName: toOwnerRecord?.name ?? "Unknown",
                    position: origA.position,
                    amount: occupant.amount,
                    stat: occupant.stat,
                }),
            ]).catch(() => {});
            touchLeague(league._id);

            return res.status(200).json({ swapped: true });
        }

        // Empty slot — simple transfer, budget check for new owner
        const targetOwnerPicks = await DraftPick.find({ league: league._id, owner: targetOwnerId });
        const targetSpend = targetOwnerPicks.reduce((sum, p) => sum + p.amount, 0);
        if (targetSpend + pick.amount > league.budget) {
            return res.status(400).json({ error: "Move would exceed that team's budget" });
        }

        pick.owner    = targetOwnerId;
        pick.position = normalizedPosition;
        pick.slot     = targetSlot;
        await pick.save();

        DraftEvent.create({
            league: league._id,
            type: "pick_transferred",
            pickNumber: pick.pickNumber,
            playerName: pick.playerName,
            ownerName: toOwnerRecord?.name ?? "Unknown",
            fromOwnerName: fromOwnerRecord?.name ?? "Unknown",
            position: normalizedPosition,
            amount: pick.amount,
            stat: pick.stat,
        }).catch(() => {});
        touchLeague(league._id);

        return res.status(200).json(serializeDraftPick(pick));
    } catch (error) {
        console.error("TRANSFER DRAFT PICK ERROR:", error);
        return res.status(500).json({ error: "Error transferring draft pick" });
    }
}

async function createPlanPick(req, res) {
    try {
        const { ownerId, playerName, position, plannedAmount, playerId } = req.body;

        if (!ownerId || !playerName) {
            return res.status(400).json({ error: "ownerId and playerName are required" });
        }

        const result = await findOwnedLeague(req.params.leagueId, req.user._id);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }

        const league = result.league;
        if (!ownerBelongsToLeague(league, ownerId)) {
            return res.status(400).json({ error: "ownerId must belong to the league" });
        }

        const normalizedPosition = position?.trim().toUpperCase();
        if (normalizedPosition && !findRosterPosition(league, normalizedPosition)) {
            return res.status(400).json({ error: "position must match a league roster position" });
        }

        const plan = await PlanPick.create({
            league: league._id,
            owner: ownerId,
            player: playerId || undefined,
            playerName: playerName.trim(),
            position: normalizedPosition || undefined,
            plannedAmount: plannedAmount != null ? Math.max(0, Number(plannedAmount)) : 0,
        });

        if (!playerId) await ensureCustomPlayerNote(req.user._id, playerName);
        touchLeague(req.params.leagueId);

        return res.status(201).json(serializePlanPick(plan));
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: "Player is already in your plan for this league" });
        }
        console.error("CREATE PLAN PICK ERROR:", err);
        return res.status(500).json({ error: "Error creating plan pick" });
    }
}

async function deletePlanPick(req, res) {
    try {
        const result = await findOwnedLeague(req.params.leagueId, req.user._id);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }

        const plan = await PlanPick.findOne({
            _id: req.params.pickId,
            league: result.league._id,
        });

        if (!plan) {
            return res.status(404).json({ error: "Plan pick not found" });
        }

        await plan.deleteOne();
        touchLeague(req.params.leagueId);
        return res.status(200).json({ deleted: true, pick: serializePlanPick(plan) });
    } catch (err) {
        console.error("DELETE PLAN PICK ERROR:", err);
        return res.status(500).json({ error: "Error deleting plan pick" });
    }
}

async function updatePlanPick(req, res) {
    try {
        const { position } = req.body;

        const result = await findOwnedLeague(req.params.leagueId, req.user._id);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }

        const league = result.league;
        const normalizedPosition = position?.trim().toUpperCase();
        if (!normalizedPosition || !findRosterPosition(league, normalizedPosition)) {
            return res.status(400).json({ error: "position must match a league roster position" });
        }

        const plan = await PlanPick.findOne({
            _id: req.params.pickId,
            league: league._id,
        });

        if (!plan) {
            return res.status(404).json({ error: "Plan pick not found" });
        }

        plan.position = normalizedPosition;
        await plan.save();
        touchLeague(req.params.leagueId);

        return res.status(200).json(serializePlanPick(plan));
    } catch (err) {
        console.error("UPDATE PLAN PICK ERROR:", err);
        return res.status(500).json({ error: "Error updating plan pick" });
    }
}

async function createMinorLeaguePick(req, res) {
    try {
        const { ownerId, playerName, playerId } = req.body;

        if (!ownerId || !playerName) {
            return res.status(400).json({ error: "ownerId and playerName are required" });
        }

        const result = await findOwnedLeague(req.params.leagueId, req.user._id);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }

        if (!ownerBelongsToLeague(result.league, ownerId)) {
            return res.status(400).json({ error: "ownerId must belong to the league" });
        }

        const playerQuery = {
            league: result.league._id,
            $or: [
                ...(playerId ? [{ player: playerId }] : []),
                { playerName: playerName.trim() },
            ],
        };

        const [existingDraftPick, existingTaxiPick] = await Promise.all([
            DraftPick.findOne(playerQuery),
            TaxiPick.findOne(playerQuery),
        ]);

        if (existingDraftPick) {
            return res.status(409).json({ error: "Player is already on a roster in this league" });
        }

        if (existingTaxiPick) {
            return res.status(409).json({ error: "Player is already on a taxi squad in this league" });
        }

        const pick = await MinorLeaguePick.create({
            league: result.league._id,
            owner: ownerId,
            player: playerId || undefined,
            playerName: playerName.trim(),
        });

        if (!playerId) await ensureCustomPlayerNote(req.user._id, playerName);
        touchLeague(req.params.leagueId);

        return res.status(201).json(serializeMinorLeaguePick(pick));
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: "Player is already on this owner's minor league team" });
        }
        console.error("CREATE MINOR LEAGUE PICK ERROR:", err);
        return res.status(500).json({ error: "Error creating minor league pick" });
    }
}

async function deleteMinorLeaguePick(req, res) {
    try {
        const result = await findOwnedLeague(req.params.leagueId, req.user._id);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }

        const pick = await MinorLeaguePick.findOne({
            _id: req.params.pickId,
            league: result.league._id,
        });

        if (!pick) {
            return res.status(404).json({ error: "Minor league pick not found" });
        }

        await pick.deleteOne();
        touchLeague(req.params.leagueId);
        return res.status(200).json({ deleted: true, pick: serializeMinorLeaguePick(pick) });
    } catch (err) {
        console.error("DELETE MINOR LEAGUE PICK ERROR:", err);
        return res.status(500).json({ error: "Error deleting minor league pick" });
    }
}

async function createTaxiPick(req, res) {
    try {
        const { ownerId, playerName, playerId } = req.body;

        if (!ownerId || !playerName) {
            return res.status(400).json({ error: "ownerId and playerName are required" });
        }

        const result = await findOwnedLeague(req.params.leagueId, req.user._id);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }

        if (!ownerBelongsToLeague(result.league, ownerId)) {
            return res.status(400).json({ error: "ownerId must belong to the league" });
        }

        const playerQuery = {
            league: result.league._id,
            $or: [
                ...(playerId ? [{ player: playerId }] : []),
                { playerName: playerName.trim() },
            ],
        };

        const [existingDraftPick, existingMinorLeaguePick] = await Promise.all([
            DraftPick.findOne(playerQuery),
            MinorLeaguePick.findOne(playerQuery),
        ]);

        if (existingDraftPick) {
            return res.status(409).json({ error: "Player is already on a roster in this league" });
        }

        if (existingMinorLeaguePick) {
            return res.status(409).json({ error: "Player is already on a minor league roster in this league" });
        }

        const pick = await TaxiPick.create({
            league: result.league._id,
            owner: ownerId,
            player: playerId || undefined,
            playerName: playerName.trim(),
        });

        if (!playerId) await ensureCustomPlayerNote(req.user._id, playerName);
        touchLeague(req.params.leagueId);

        return res.status(201).json(serializeTaxiPick(pick));
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: "Player is already on this owner's taxi squad" });
        }
        console.error("CREATE TAXI PICK ERROR:", err);
        return res.status(500).json({ error: "Error creating taxi pick" });
    }
}

async function deleteTaxiPick(req, res) {
    try {
        const result = await findOwnedLeague(req.params.leagueId, req.user._id);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }

        const pick = await TaxiPick.findOne({
            _id: req.params.pickId,
            league: result.league._id,
        });

        if (!pick) {
            return res.status(404).json({ error: "Taxi pick not found" });
        }

        await pick.deleteOne();
        touchLeague(req.params.leagueId);
        return res.status(200).json({ deleted: true, pick: serializeTaxiPick(pick) });
    } catch (err) {
        console.error("DELETE TAXI PICK ERROR:", err);
        return res.status(500).json({ error: "Error deleting taxi pick" });
    }
}

async function deleteLeague(req, res) {
    try {
        const result = await findOwnedLeague(req.params.leagueId, req.user._id);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }

        const leagueId = result.league._id;

        await Promise.all([
            DraftPick.deleteMany({ league: leagueId }),
            PlanPick.deleteMany({ league: leagueId }),
            MinorLeaguePick.deleteMany({ league: leagueId }),
            TaxiPick.deleteMany({ league: leagueId }),
        ]);

        await result.league.deleteOne();

        return res.status(200).json({ deleted: true });
    } catch (error) {
        console.error("DELETE LEAGUE ERROR:", error);
        return res.status(500).json({ error: "Error deleting league" });
    }
}

const VALID_CHECKPOINTS = new Set(testFixture.checkpoints);

async function seedTestLeague(req, res) {
    const checkpoint = Number(req.body.checkpoint);
    if (!VALID_CHECKPOINTS.has(checkpoint)) {
        return res.status(400).json({
            error: `checkpoint must be one of: ${testFixture.checkpoints.join(", ")}`,
        });
    }

    try {
        // Reuse an existing test league so the ID stays stable across checkpoint switches
        let league = await League.findOne({
            createdBy: req.user._id,
            name: testFixture.league.name,
        });

        if (!league) {
            league = await League.create({
                name: testFixture.league.name,
                createdBy: req.user._id,
                teamCount: testFixture.league.teamCount,
                budget: testFixture.league.budget,
                scoringTypes: testFixture.league.scoringTypes,
                owners: testFixture.league.owners.map((name) => ({ name })),
                rosterPositions: testFixture.league.rosterPositions,
            });
        }

        // Clear existing picks/plans/minors/history, then re-insert picks up to the checkpoint
        await Promise.all([
            DraftPick.deleteMany({ league: league._id }),
            PlanPick.deleteMany({ league: league._id }),
            MinorLeaguePick.deleteMany({ league: league._id }),
            TaxiPick.deleteMany({ league: league._id }),
            DraftEvent.deleteMany({ league: league._id }),
        ]);

        const ownerByName = new Map(
            (league.owners || []).map((o) => [o.name, o._id])
        );

        const mapPick = (p) => ({
            league: league._id,
            owner: ownerByName.get(p.wonBy),
            player: p.player || undefined,
            playerName: p.playerName,
            position: p.position,
            slot: p.slot,
            amount: p.salary,
            pickNumber: p.pickNumber,
            stat: p.stat,
        });

        const preDraftToInsert = testFixture.preDraftPicks.map(mapPick);
        const auctionToInsert  = testFixture.auctionPicks.slice(0, checkpoint).map(mapPick);
        const minorsToInsert   = testFixture.minorLeaguePicks.map((p) => ({
            league: league._id,
            owner: ownerByName.get(p.wonBy),
            player: p.player || undefined,
            playerName: p.playerName,
        }));

        const allDraftPicks = [...preDraftToInsert, ...auctionToInsert];
        if (allDraftPicks.length > 0) {
            await DraftPick.insertMany(allDraftPicks, { ordered: false });
        }
        if (minorsToInsert.length > 0) {
            await MinorLeaguePick.insertMany(minorsToInsert, { ordered: false });
        }

        // Populate draft history for auction picks — space them 90 seconds apart
        // starting 3 hours before now so the log looks like a finished draft
        if (auctionToInsert.length > 0) {
            const draftStart = new Date(Date.now() - auctionToInsert.length * 90 * 1000);
            const eventsToInsert = testFixture.auctionPicks.slice(0, checkpoint).map((p, i) => ({
                league: league._id,
                type: "pick_added",
                pickNumber: p.pickNumber,
                playerName: p.playerName,
                ownerName: p.wonBy,
                position: p.position,
                amount: p.salary,
                stat: p.stat || undefined,
                createdAt: new Date(draftStart.getTime() + i * 90 * 1000),
                updatedAt: new Date(draftStart.getTime() + i * 90 * 1000),
            }));
            await DraftEvent.insertMany(eventsToInsert, { ordered: false });
        }

        return res.status(200).json({
            leagueId: league._id,
            checkpoint,
            picksLoaded: auctionToInsert.length,
        });
    } catch (error) {
        console.error("SEED TEST LEAGUE ERROR:", error);
        return res.status(500).json({ error: "Error seeding test league" });
    }
}

module.exports = {
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
    transferDraftPick,
    createPlanPick,
    deletePlanPick,
    updatePlanPick,
    createMinorLeaguePick,
    deleteMinorLeaguePick,
    createTaxiPick,
    deleteTaxiPick,
    seedTestLeague,
};
