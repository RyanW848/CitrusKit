import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import RedoIcon from "@mui/icons-material/Redo";
import UndoIcon from "@mui/icons-material/Undo";
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import OwnerRosterPanel from "../components/OwnerRosterPanel";
import SearchBar from "../components/SearchBar";
import {
  createDraftPick,
  deleteDraftPick,
  createMinorLeaguePick,
  deleteMinorLeaguePick,
  fetchDraftState,
  updatePlanPick,
  updateDraftPick,
  swapDraftPicks,
  transferDraftPick,
} from "../api/leaguesApi";
import { getPlayerValues, getPlayerStats } from "../api/playerClient";
import usePlayerStore from "../components/stores/usePlayerStore";
import PlayerStatsModal from "../components/PlayerStatsModal";
import { getKeyStats, fmtStat } from "../utils/draftStatsHelpers";
import useUndoRedo from "../hooks/useUndoRedo";
import useNotes from "../hooks/useNotes";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined"
import PlayerPickerModal from "../components/PlayerPickerModal";
import { isEligibleForSlot, resolvePlayerPositions } from "../utils/rosterEligibility";

const emptyPickForm = {
  amount: "",
  stat: "",
};

function ownerLetter(slot) {
  return String.fromCharCode(64 + slot);
}

function normalizeRosterSlot(slot, ownerId) {
  return {
    id: slot.id,
    ownerId,
    posAbbr: slot.abbr,
    posName: slot.name,
    position: slot.abbr,
    slot: slot.slot,
    pickId: slot.pick?.id ?? null,
    playerId: slot.pick?.player ?? null,
    playerName: slot.pick?.playerName ?? null,
    price: slot.pick?.amount ?? 0,
    stat: slot.pick?.stat ?? null,
    isEmpty: !slot.pick,
  };
}

export default function DraftTeams() {
  const { id } = useParams();
  const [draftState, setDraftState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [pickForm, setPickForm] = useState(emptyPickForm);
  const [dialogError, setDialogError] = useState("");
  const [dialogSaving, setDialogSaving] = useState(false);
  const [mode, setMode] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [customName, setCustomName] = useState("");
  const [projectedValue, setProjectedValue] = useState(null);
  const [valuationLoading, setValuationLoading] = useState(false);

  const [mlDialogOpen, setMlDialogOpen] = useState(false);
  const [mlDialogOwnerId, setMlDialogOwnerId] = useState(null);
  const [mlMode, setMlMode] = useState("search");
  const [mlSearchQuery, setMlSearchQuery] = useState("");
  const [mlSuggestions, setMlSuggestions] = useState([]);
  const [mlSelectedPlayer, setMlSelectedPlayer] = useState(null);
  const [mlCustomName, setMlCustomName] = useState("");
  const [mlSaving, setMlSaving] = useState(false);
  const [mlError, setMlError] = useState("");
  const [noteText, setNoteText] = useState("");
  const [mlNoteText, setMlNoteText] = useState("");

  const [pickerOpen, setPickerOpen] = useState(false);
  const [moveExpanded, setMoveExpanded] = useState(false);
  const [moveOwner, setMoveOwner] = useState("");
  const [moveSlot, setMoveSlot] = useState("");
  const [moveSaving, setMoveSaving] = useState(false);
  const [moveError, setMoveError] = useState("");
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [statsResult, setStatsResult] = useState(null);
  const [statsEntry, setStatsEntry] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const { load: loadNotes, findNote, saveNote } = useNotes();
  useEffect(() => { loadNotes(); }, [loadNotes]);

  const { allPlayers, fetchAllPlayers } = usePlayerStore();
  useEffect(() => { fetchAllPlayers(); }, [fetchAllPlayers]);

  const loadDraftState = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");

    try {
      const data = await fetchDraftState(id);
      setDraftState(data);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Unable to load teams");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDraftState();
  }, [loadDraftState]);

  const { push, undo, redo, canUndo, canRedo } = useUndoRedo(() => loadDraftState(true));

  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === "y" || (e.key === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const owners = useMemo(() => {
    return (draftState?.owners || []).map((owner) => ({
      id: owner.id,
      letter: ownerLetter(owner.slot),
      name: owner.name,
    }));
  }, [draftState]);

  const getRoster = (ownerId) => {
    const owner = draftState?.owners?.find((item) => String(item.id) === String(ownerId));
    if (!owner) return [];
    const rosterSlots = owner.rosterSlots || [];
    const plannedSlots = owner.plannedRosterSlots || [];
    return rosterSlots.map((slot, i) => {
      if (slot.pick) {
        return {
          ...normalizeRosterSlot(slot, ownerId),
          playerPositions: resolvePlayerPositions(allPlayers, slot.pick.player),
          isActual: true,
          isPlan: false,
        };
      }
      const planSlot = plannedSlots[i];
      if (planSlot?.plan) {
        return {
          id: slot.id,
          planPickId: planSlot.plan.id,
          ownerId,
          posAbbr: slot.abbr,
          posName: slot.name,
          position: slot.abbr,
          slot: slot.slot,
          pickId: null,
          playerName: planSlot.plan.playerName,
          price: planSlot.plan.plannedAmount ?? 0,
          stat: null,
          isEmpty: true,
          isPlan: true,
          isActual: false,
          playerPositions: resolvePlayerPositions(allPlayers, planSlot.plan.player),
        };
      }
      return { ...normalizeRosterSlot(slot, ownerId), isActual: false, isPlan: false };
    });
  };

  const getMinorLeague = (ownerId) => {
    const owner = draftState?.owners?.find((item) => String(item.id) === String(ownerId));
    return owner?.minorLeaguePlayers ?? [];
  };

  const openMlDialog = (ownerId) => {
    setMlDialogOwnerId(ownerId);
    setMlMode("search");
    setMlSearchQuery("");
    setMlSuggestions([]);
    setMlSelectedPlayer(null);
    setMlCustomName("");
    setMlError("");
    setMlNoteText("");
    setMlDialogOpen(true);
  };

  const closeMlDialog = () => {
    setMlDialogOpen(false);
    setMlDialogOwnerId(null);
    setMlNoteText("");
  };

  const handleMlQueryChange = (query) => {
    setMlSearchQuery(query);
    setMlSelectedPlayer(null);
    setMlSuggestions(
      query.length > 1
        ? allPlayers.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
        : []
    );
  };

  const handleSaveMinorLeague = async () => {
    const playerName = mlMode === "custom" ? mlCustomName.trim() : mlSelectedPlayer?.name;
    if (!playerName) {
      setMlError(mlMode === "custom" ? "Enter a player name" : "Select a player first");
      return;
    }
    const mlPayload = {
      ownerId: mlDialogOwnerId,
      playerName,
      playerId: mlMode === "custom" ? undefined : mlSelectedPlayer?.id,
    };
    setMlSaving(true);
    setMlError("");
    try {
      const newPick = await createMinorLeaguePick(id, mlPayload);
      const action = {
        undo: async () => deleteMinorLeaguePick(id, newPick.id),
        redo: async () => {
          const rePick = await createMinorLeaguePick(id, mlPayload);
          action.undo = async () => deleteMinorLeaguePick(id, rePick.id);
        },
      };
      push(action);
      if (mlNoteText.trim()) {
        saveNote({
          playerName,
          playerId: mlMode === "custom" ? undefined : mlSelectedPlayer?.id,
          note: mlNoteText.trim(),
          isCustom: mlMode === "custom",
        });
      }
      closeMlDialog();
      await loadDraftState(true);
    } catch (err) {
      setMlError(err.response?.data?.error || "Unable to add player");
    } finally {
      setMlSaving(false);
    }
  };

  const handleRemoveMinorLeague = async (player) => {
    try {
      await deleteMinorLeaguePick(id, player.id);
      const removePayload = { ownerId: player.owner, playerName: player.playerName };
      const originalId = player.id;
      const action = {
        undo: async () => {
          const newPick = await createMinorLeaguePick(id, removePayload);
          action.redo = async () => deleteMinorLeaguePick(id, newPick.id);
        },
        redo: async () => deleteMinorLeaguePick(id, originalId),
      };
      push(action);
      await loadDraftState(true);
    } catch {
      await loadDraftState(true);
    }
  };

  const canDrop = useCallback((fromSlot, toSlot) => {
    if (fromSlot.isPlan && !fromSlot.isActual) {
      if (toSlot.isActual) return false;
      if (!isEligibleForSlot(fromSlot.playerPositions, toSlot.posAbbr)) return false;
      if (toSlot.isPlan && !isEligibleForSlot(toSlot.playerPositions, fromSlot.posAbbr)) return false;
      return true;
    }
    if (fromSlot.isActual) {
      if (fromSlot.isEmpty) return false;
      if (!isEligibleForSlot(fromSlot.playerPositions, toSlot.posAbbr)) return false;
      if (toSlot.isActual && !isEligibleForSlot(toSlot.playerPositions, fromSlot.posAbbr)) return false;
      return toSlot.isActual || toSlot.isEmpty;
    }
    return false;
  }, []);

  const handleDropSlot = useCallback(async (fromSlot, toSlot) => {
    if (fromSlot.posAbbr === toSlot.posAbbr && fromSlot.slot === toSlot.slot) return;
    try {
      if (fromSlot.isPlan && !fromSlot.isActual) {
        if (!fromSlot.planPickId) return;
        if (fromSlot.planPickId) await updatePlanPick(id, fromSlot.planPickId, { position: toSlot.posAbbr });
        if (toSlot.planPickId) await updatePlanPick(id, toSlot.planPickId, { position: fromSlot.posAbbr });
      } else if (fromSlot.isActual) {
        if (toSlot.isActual && toSlot.pickId) {
          await swapDraftPicks(id, { pickAId: fromSlot.pickId, pickBId: toSlot.pickId });
        } else {
          await updateDraftPick(id, fromSlot.pickId, { position: toSlot.posAbbr, slot: toSlot.slot });
        }
      }
      loadDraftState(true);
    } catch {
      loadDraftState(true);
    }
  }, [id, loadDraftState]);

  const openDialog = (slot) => {
    setActiveSlot(slot);
    setPickForm({
      amount: slot.playerName ? String(slot.price ?? 0) : "",
      stat: slot.stat && slot.stat !== "..." ? slot.stat : "",
    });
    setMode("search");
    setSearchQuery("");
    setSuggestions([]);
    setSelectedPlayer(null);
    setCustomName("");
    setProjectedValue(null);
    setDialogError("");
    setStatsResult(null);
    setStatsEntry(null);
    setMoveExpanded(false);
    setMoveOwner("");
    setMoveSlot("");
    setMoveError("");
    const existing = findNote(slot.playerId, slot.playerName);
    setNoteText(existing?.note ?? "");

    if (slot.isActual && slot.playerId) {
      const entry = allPlayers.find((p) => String(p.id) === String(slot.playerId));
      setStatsEntry(entry ?? null);
      setStatsLoading(true);
      getPlayerStats(slot.playerId)
        .then((result) => setStatsResult(result))
        .catch(() => setStatsResult(null))
        .finally(() => setStatsLoading(false));
    }

    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setActiveSlot(null);
    setPickForm(emptyPickForm);
    setMode("search");
    setSearchQuery("");
    setSuggestions([]);
    setSelectedPlayer(null);
    setCustomName("");
    setProjectedValue(null);
    setDialogError("");
    setNoteText("");
    setStatsResult(null);
    setStatsEntry(null);
    setMoveExpanded(false);
    setMoveOwner("");
    setMoveSlot("");
    setMoveError("");
  };

  const handleFormChange = (field) => (event) => {
    setPickForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleQueryChange = (query) => {
    setSearchQuery(query);
    setSelectedPlayer(null);
    setProjectedValue(null);
    setSuggestions(
      query.length > 1
        ? allPlayers.filter((player) => {
          if (!player.name.toLowerCase().includes(query.toLowerCase())) return false;
          if (!activeSlot?.position) return true;
          const searchPositions =
            (activeSlot.position === "SP" || activeSlot.position === "RP") ? ["P"] :
              activeSlot.position === "CI" ? ["1B", "3B"] :
                activeSlot.position === "MI" ? ["2B", "SS"] :
                  [activeSlot.position];
          const playerPositions = Array.isArray(player.positions)
            ? player.positions
            : (player.positions ? player.positions.split(",").map((item) => item.trim()) : []);
          return playerPositions.some((position) => searchPositions.includes(position));
        }).slice(0, 6)
        : []
    );
  };

  const handleSelectPlayer = async (player) => {
    setSelectedPlayer(player);
    setSearchQuery(player.name);
    setSuggestions([]);

    if (!draftState?.league) return;
    setValuationLoading(true);
    try {
      const result = await getPlayerValues({
        budget: draftState.league.budget,
        relevantStats: draftState.league.scoringTypes,
        playerIds: [player.id],
      });
      const value =
        result?.players?.[0]?.value ??
        result?.valuations?.[player.id] ??
        result?.[player.id] ??
        null;
      setProjectedValue(typeof value === "number" ? value : null);
    } catch {
      setProjectedValue(null);
    } finally {
      setValuationLoading(false);
    }
  };

  const handleCreatePick = async (event) => {
    event.preventDefault();
    if (!activeSlot) return;

    const playerName = mode === "custom" ? customName.trim() : selectedPlayer?.name;
    if (!playerName) {
      setDialogError(mode === "custom" ? "Enter a player name" : "Select a player first");
      return;
    }

    const payload = {
      ownerId: activeSlot.ownerId,
      playerName,
      position: activeSlot.position,
      slot: activeSlot.slot,
      amount: Number(pickForm.amount),
      stat: pickForm.stat.trim(),
      playerId: mode === "custom" ? undefined : selectedPlayer?.id,
    };

    setDialogSaving(true);
    setDialogError("");
    try {
      const newPick = await createDraftPick(id, payload);
      const action = {
        undo: async () => deleteDraftPick(id, newPick.id),
        redo: async () => {
          const rePick = await createDraftPick(id, payload);
          action.undo = async () => deleteDraftPick(id, rePick.id);
        },
      };
      push(action);
      const playerName = mode === "custom" ? customName.trim() : selectedPlayer?.name;
      if (noteText.trim() && playerName) {
        saveNote({
          playerName,
          playerId: mode === "custom" ? undefined : selectedPlayer?.id,
          note: noteText.trim(),
          isCustom: mode === "custom",
        });
      }
      closeDialog();
      await loadDraftState(true);
    } catch (err) {
      setDialogError(err.response?.data?.error || err.response?.data?.message || "Unable to save team data");
    } finally {
      setDialogSaving(false);
    }
  };

  const handleSaveNote = async () => {
    if (!activeSlot) return;
    const playerName = activeSlot.playerName;
    if (!playerName) return;
    await saveNote({
      playerName,
      playerId: activeSlot.playerId || undefined,
      note: noteText.trim(),
      isCustom: !activeSlot.playerId,
    });
    closeDialog();
  };

  const handleDeletePick = async () => {
    if (!activeSlot?.pickId) return;

    const pickId = activeSlot.pickId;
    const slotSnapshot = {
      ownerId: activeSlot.ownerId,
      playerName: activeSlot.playerName,
      position: activeSlot.position,
      slot: activeSlot.slot,
      amount: activeSlot.price,
      stat: activeSlot.stat || "",
    };

    setDialogSaving(true);
    setDialogError("");
    try {
      await deleteDraftPick(id, pickId);
      const action = {
        undo: async () => {
          const newPick = await createDraftPick(id, slotSnapshot);
          action.redo = async () => deleteDraftPick(id, newPick.id);
        },
        redo: async () => deleteDraftPick(id, pickId),
      };
      push(action);
      closeDialog();
      await loadDraftState(true);
    } catch (err) {
      setDialogError(err.response?.data?.error || err.response?.data?.message || "Unable to remove player");
    } finally {
      setDialogSaving(false);
    }
  };

  const availableSlotsForOwner = (ownerId) => {
    const owner = draftState?.owners?.find((o) => String(o.id) === String(ownerId));
    if (!owner) return [];
    return (owner?.rosterSlots ?? []).reduce((acc, s) => {
      if (!isEligibleForSlot(activeSlot?.playerPositions, s.abbr)) return acc;
      if (!s.pick) {
        acc.push({
          value: `${s.abbr}:${s.slot}`,
          label: s.slot > 1 ? `${s.abbr}-${s.slot} (${s.name})` : `${s.abbr} (${s.name})`,
        });
      } else {
        const otherPositions = resolvePlayerPositions(allPlayers, s.pick.player);
        if (!isEligibleForSlot(otherPositions, activeSlot?.posAbbr)) return acc;
        acc.push({
          value: `${s.abbr}:${s.slot}`,
          label: `Swap with ${s.pick.playerName}`,
        });
      }
      return acc;
    }, []);
  };

  const handleTransfer = async () => {
    if (!activeSlot?.pickId || !moveOwner || !moveSlot) return;
    const [position, slotNum] = moveSlot.split(":");
    setMoveSaving(true);
    setMoveError("");
    try {
      await transferDraftPick(id, activeSlot.pickId, { targetOwnerId: moveOwner, position, slot: Number(slotNum) });
      closeDialog();
      await loadDraftState(true);
    } catch (err) {
      setMoveError(err.response?.data?.error || "Unable to move player");
    } finally {
      setMoveSaving(false);
    }
  };

  const canSavePick = pickForm.amount !== "" && (
    (mode === "custom" && customName.trim()) ||
    (mode === "search" && selectedPlayer)
  );

  const draftContext = useMemo(() => {
    if (!draftState?.league) return null;

    const relevantStats = (draftState.league.scoringTypes ?? []).map(s => {
      const match = s.match(/\(([^)]+)\)/);
      return match ? match[1] : s;
    });

    const unavailablePlayers = (draftState.owners ?? [])
      .flatMap(owner => owner.rosterSlots ?? [])
      .map(slot => slot.pick?.player)
      .filter(Boolean);

    const playersLeftToDraft = (draftState.owners ?? [])
      .flatMap(owner => owner.rosterSlots ?? [])
      .filter(slot => !slot.pick)
      .length;

    const activeOwner = draftState.owners?.find(o => String(o.id) === String(activeSlot?.ownerId));
    const budget = activeOwner?.remainingBudget ?? draftState.league.budget;

    return {
      budget,
      relevantStats,
      unavailablePlayers,
      playersLeftToDraft,
    };
  }, [draftState, activeSlot]);

  return (
    <PageLayout
      title="Teams"
      subtitle="Pre-input team data"
      //showBell
      actions={<>
        <Button size="small" variant="outlined" startIcon={<UndoIcon />} onClick={undo} disabled={!canUndo} sx={{ textTransform: "none", borderColor: "#d0bcb6", color: "#6d5a57", "&:hover": { borderColor: "#8c7672", bgcolor: "rgba(140,118,114,0.06)" }, "&.Mui-disabled": { borderColor: "#e8d8cc", color: "#c4aba6" } }}>Undo</Button>
        <Button size="small" variant="outlined" startIcon={<RedoIcon />} onClick={redo} disabled={!canRedo} sx={{ textTransform: "none", borderColor: "#d0bcb6", color: "#6d5a57", "&:hover": { borderColor: "#8c7672", bgcolor: "rgba(140,118,114,0.06)" }, "&.Mui-disabled": { borderColor: "#e8d8cc", color: "#c4aba6" } }}>Redo</Button>
      </>}
    >
      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 4 }}>
          <CircularProgress size={22} />
          <Typography sx={{ color: "#6d5a57", fontSize: "0.95rem" }}>Loading teams...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          <OwnerRosterPanel
            owners={owners}
            getRoster={getRoster}
            onSlotClick={openDialog}
            canDrop={canDrop}
            onDropSlot={handleDropSlot}
            allowActualDrag
            getMinorLeague={getMinorLeague}
            onAddMinorLeaguePlayer={openMlDialog}
            onRemoveMinorLeaguePlayer={handleRemoveMinorLeague}
          />
        </>
      )}

      <Dialog
        open={mlDialogOpen}
        onClose={closeMlDialog}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: "8px", bgcolor: "#fffaf7", overflow: "visible" } }}
      >
        <DialogTitle sx={{ pb: 1 }}>Add Minor League Player</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1, overflow: "visible" }}>
          {mlError && (
            <Alert severity="error" sx={{ borderRadius: "8px" }}>{mlError}</Alert>
          )}
          <ToggleButtonGroup
            value={mlMode}
            exclusive
            onChange={(_, value) => { if (value) setMlMode(value); }}
            size="small"
            fullWidth
            sx={{
              "& .MuiToggleButton-root": {
                textTransform: "none",
                borderColor: "#d0bcb6",
                "&.Mui-selected": { bgcolor: "#f5f0ed", color: "#6d5a57", borderColor: "#8c7672" },
              },
            }}
          >
            <ToggleButton value="search">Search Players</ToggleButton>
            <ToggleButton value="custom">Custom Player</ToggleButton>
          </ToggleButtonGroup>
          {mlMode === "search" ? (
            <Box sx={{ position: "relative" }}>
              <SearchBar
                value={mlSearchQuery}
                onChange={(event) => handleMlQueryChange(event.target.value)}
                onClear={() => handleMlQueryChange("")}
                placeholder="Search for a player..."
                sx={{ mb: 0 }}
              />
              {mlSuggestions.length > 0 && (
                <Paper
                  elevation={4}
                  sx={{ position: "absolute", width: "100%", zIndex: 10, mt: 0.5, borderRadius: "8px", overflow: "hidden" }}
                >
                  {mlSuggestions.map((player, index) => (
                    <Box
                      key={player.id}
                      onClick={() => { setMlSelectedPlayer(player); setMlSearchQuery(player.name); setMlSuggestions([]); }}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        px: 2,
                        py: 1,
                        cursor: "pointer",
                        borderBottom: index < mlSuggestions.length - 1 ? "1px solid #f0e8e4" : "none",
                        "&:hover": { bgcolor: "#fdf6f2" },
                      }}
                    >
                      {player.headshotUrl && (
                        <img src={player.headshotUrl} alt={player.name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                      )}
                      <Box>
                        <Typography sx={{ fontWeight: 500, fontSize: "0.9rem" }}>{player.name}</Typography>
                        <Typography sx={{ fontSize: "0.78rem", color: "#9a8a84" }}>
                          {Array.isArray(player.positions) ? player.positions.join(" · ") : player.positions}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Paper>
              )}
            </Box>
          ) : (
            <TextField
              fullWidth
              variant="standard"
              label="Player name"
              value={mlCustomName}
              onChange={(event) => setMlCustomName(event.target.value)}
              autoFocus
            />
          )}
          <TextField
            fullWidth
            variant="standard"
            label="Notes"
            multiline
            minRows={2}
            value={mlNoteText}
            onChange={(e) => setMlNoteText(e.target.value)}
            placeholder="Add a scouting note..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeMlDialog} disabled={mlSaving} sx={{ color: "#6d5a57" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveMinorLeague}
            disabled={mlSaving || (mlMode === "search" ? !mlSelectedPlayer : !mlCustomName.trim())}
            sx={{ bgcolor: "#f4c9b3", color: "#3f332f", boxShadow: "none", borderRadius: "8px", "&:hover": { bgcolor: "#efb997", boxShadow: "none" } }}
          >
            {mlSaving ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      <DraftTabBar activeTab="teams" draftId={id} />

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "8px", bgcolor: "#fffaf7", overflow: "visible" } }}
      >
        <Box component="form" onSubmit={handleCreatePick}>
          <DialogTitle sx={{ pb: 1 }}>
            {activeSlot ? `${activeSlot.posAbbr} · ${activeSlot.posName}` : "Team Slot"}
          </DialogTitle>
          <DialogContent sx={{ display: "grid", gap: 2, pt: 1, overflow: "visible" }}>
            {dialogError && (
              <Alert severity="error" sx={{ borderRadius: "8px" }}>
                {dialogError}
              </Alert>
            )}

            {activeSlot?.pickId ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: "8px", bgcolor: "#fef0e8" }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    {statsEntry?.headshotUrl && (
                      <img src={statsEntry.headshotUrl} alt={activeSlot.playerName}
                        style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0, marginTop: 2 }} />
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600 }}>{activeSlot.playerName}</Typography>
                      <Typography sx={{ color: "#8c7672", fontSize: "0.9rem" }}>
                        ${activeSlot.price}{activeSlot.stat ? ` · ${activeSlot.stat}` : ""}
                      </Typography>
                      {activeSlot.playerPositions?.length > 0 && (
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.75 }}>
                          {activeSlot.playerPositions.map((pos) => (
                            <Chip key={pos} label={pos} size="small"
                              sx={{ height: 20, fontSize: "0.7rem", bgcolor: "#f4c9b3", color: "#3f332f", "& .MuiChip-label": { px: 1 } }} />
                          ))}
                        </Box>
                      )}
                      {statsLoading && <CircularProgress size={14} sx={{ mt: 0.75, color: "#8c7672" }} />}
                      {!statsLoading && statsResult && (
                        <Box sx={{ display: "flex", gap: 2, mt: 0.75, flexWrap: "wrap" }}>
                          {getKeyStats(activeSlot.playerPositions).map(({ key, label }) => {
                            const val = fmtStat(key, statsResult?.results?.[0]?.stats?.[key]);
                            if (val == null) return null;
                            return (
                              <Box key={key} sx={{ textAlign: "center" }}>
                                <Typography sx={{ fontSize: "0.68rem", color: "#8c7672", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</Typography>
                                <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: "#3f332f" }}>{val}</Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                    {activeSlot.playerId && statsResult && (
                      <Button size="small" onClick={() => setStatsModalOpen(true)}
                        sx={{ textTransform: "none", color: "#6d5a57", borderColor: "#d0bcb6", flexShrink: 0, alignSelf: "flex-start" }}
                        variant="outlined">
                        More Info
                      </Button>
                    )}
                  </Box>
                </Box>
                {moveExpanded && (
                  <Box sx={{ border: "1px solid #e5d5c8", borderRadius: "8px", p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#6d5a57" }}>Move to another team</Typography>
                    <Select size="small" value={moveOwner} displayEmpty
                      onChange={(e) => { setMoveOwner(e.target.value); setMoveSlot(""); setMoveError(""); }}
                      sx={{ fontSize: "0.85rem" }}>
                      <MenuItem value="" disabled>Select owner…</MenuItem>
                      {(draftState?.owners ?? [])
                        .filter((o) => String(o.id) !== String(activeSlot?.ownerId))
                        .map((o) => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
                    </Select>
                    {moveOwner && (
                      <Select size="small" value={moveSlot} displayEmpty
                        onChange={(e) => setMoveSlot(e.target.value)}
                        sx={{ fontSize: "0.85rem" }}>
                        <MenuItem value="" disabled>Select slot…</MenuItem>
                        {availableSlotsForOwner(moveOwner).map((s) =>
                          <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                      </Select>
                    )}
                    {moveError && <Alert severity="error" sx={{ borderRadius: "8px", py: 0.5 }}>{moveError}</Alert>}
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button size="small" onClick={() => { setMoveExpanded(false); setMoveOwner(""); setMoveSlot(""); setMoveError(""); }}
                        sx={{ color: "#6d5a57", textTransform: "none" }}>Cancel</Button>
                      <Button size="small" variant="contained" onClick={handleTransfer}
                        disabled={!moveOwner || !moveSlot || moveSaving}
                        sx={{ bgcolor: "#f4c9b3", color: "#3f332f", boxShadow: "none", textTransform: "none", borderRadius: "8px", "&:hover": { bgcolor: "#efb997", boxShadow: "none" } }}>
                        {moveSaving ? "Moving…" : "Confirm Move"}
                      </Button>
                    </Box>
                  </Box>
                )}
                <TextField
                  fullWidth
                  variant="standard"
                  label="Notes"
                  multiline
                  minRows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a scouting note..."
                />
              </Box>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={() => setPickerOpen(true)}
                  startIcon={<SearchOutlinedIcon />}
                  sx={{
                    textTransform: 'none',
                    borderColor: '#d0bcb6',
                    color: '#6d5a57',
                    borderRadius: '8px',
                    '&:hover': { borderColor: '#8c7672', bgcolor: 'rgba(140,118,114,0.06)' },
                  }}
                >
                  {selectedPlayer ? `${selectedPlayer.name}` : 'Add Player'}
                </Button>

                {selectedPlayer && (
                  <Box sx={{ p: 1.5, bgcolor: '#fef0e8', borderRadius: '8px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {selectedPlayer.headshotUrl && (
                        <img src={selectedPlayer.headshotUrl} alt={selectedPlayer.name}
                          style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedPlayer.name}</Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: '#8c7672' }}>
                          {Array.isArray(selectedPlayer.positions) ? selectedPlayer.positions.join(' · ') : selectedPlayer.positions}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
                {/* <ToggleButtonGroup
                  value={mode}
                  exclusive
                  onChange={(_, value) => { if (value) setMode(value); }}
                  size="small"
                  fullWidth
                  sx={{
                    "& .MuiToggleButton-root": {
                      textTransform: "none",
                      borderColor: "#d0bcb6",
                      "&.Mui-selected": { bgcolor: "#f5f0ed", color: "#6d5a57", borderColor: "#8c7672" },
                    },
                  }}
                >
                  <ToggleButton value="search">Search Players</ToggleButton>
                  <ToggleButton value="custom">Custom Player</ToggleButton>
                </ToggleButtonGroup>

                {mode === "search" ? (
                  <Box sx={{ position: "relative" }}>
                    <SearchBar
                      value={searchQuery}
                      onChange={(event) => handleQueryChange(event.target.value)}
                      onClear={() => handleQueryChange("")}
                      placeholder="Search for a player..."
                      sx={{ mb: 0 }}
                    />
                    {suggestions.length > 0 && (
                      <Paper
                        elevation={4}
                        sx={{ position: "absolute", width: "100%", zIndex: 10, mt: 0.5, borderRadius: "8px", overflow: "hidden" }}
                      >
                        {suggestions.map((player, index) => (
                          <Box
                            key={player.id}
                            onClick={() => handleSelectPlayer(player)}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              px: 2,
                              py: 1,
                              cursor: "pointer",
                              borderBottom: index < suggestions.length - 1 ? "1px solid #f0e8e4" : "none",
                              "&:hover": { bgcolor: "#fdf6f2" },
                            }}
                          >
                            {player.headshotUrl && (
                              <img
                                src={player.headshotUrl}
                                alt={player.name}
                                style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                              />
                            )}
                            <Box>
                              <Typography sx={{ fontWeight: 500, fontSize: "0.9rem" }}>{player.name}</Typography>
                              <Typography sx={{ fontSize: "0.78rem", color: "#9a8a84" }}>
                                {Array.isArray(player.positions) ? player.positions.join(" · ") : player.positions}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Paper>
                    )}
                    {selectedPlayer && (
                      <Box sx={{ mt: 1.5, p: 1.5, bgcolor: "#fef0e8", borderRadius: "8px" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          {selectedPlayer.headshotUrl && (
                            <img
                              src={selectedPlayer.headshotUrl}
                              alt={selectedPlayer.name}
                              style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                            />
                          )}
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: "0.95rem" }}>{selectedPlayer.name}</Typography>
                            <Typography sx={{ fontSize: "0.8rem", color: "#8c7672" }}>
                              {Array.isArray(selectedPlayer.positions)
                                ? selectedPlayer.positions.join(" · ")
                                : selectedPlayer.positions}
                            </Typography>
                          </Box>
                          {valuationLoading && <CircularProgress size={16} sx={{ color: "#8c7672", flexShrink: 0 }} />}
                          {!valuationLoading && projectedValue !== null && (
                            <Typography sx={{ fontWeight: 700, color: "#6d5a57", fontSize: "0.9rem", flexShrink: 0 }}>
                              ~${Math.round(projectedValue)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <TextField
                    fullWidth
                    variant="standard"
                    label="Player name"
                    value={customName}
                    onChange={(event) => setCustomName(event.target.value)}
                    autoFocus
                  />
                )} */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <TextField
                    label="Amount"
                    type="number"
                    value={pickForm.amount}
                    onChange={handleFormChange("amount")}
                    required
                    fullWidth
                    slotProps={{ htmlInput: { min: 0 } }}
                  />
                  <TextField
                    label="Stat"
                    value={pickForm.stat}
                    onChange={handleFormChange("stat")}
                    placeholder="S1"
                    fullWidth
                  />
                </Box>
                <TextField
                  fullWidth
                  variant="standard"
                  label="Notes"
                  multiline
                  minRows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a scouting note..."
                />
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            {activeSlot?.pickId ? (
              <Box sx={{ display: "flex", gap: 1, mr: "auto" }}>
                <Button onClick={handleDeletePick} disabled={dialogSaving} sx={{ color: "#b24b3c" }}>
                  {dialogSaving ? "Removing..." : "Remove"}
                </Button>
                {!moveExpanded && (
                  <Button onClick={() => setMoveExpanded(true)} disabled={dialogSaving} sx={{ color: "#6d5a57" }}>
                    Move
                  </Button>
                )}
              </Box>
            ) : null}
            <Button onClick={closeDialog} disabled={dialogSaving} sx={{ color: "#6d5a57" }}>
              Cancel
            </Button>
            {activeSlot?.pickId ? (
              <Button
                variant="contained"
                onClick={handleSaveNote}
                disabled={dialogSaving}
                sx={{ bgcolor: "#f4c9b3", color: "#3f332f", boxShadow: "none", borderRadius: "8px", "&:hover": { bgcolor: "#efb997", boxShadow: "none" } }}
              >
                Save Note
              </Button>
            ) : (
              <Button
                type="submit"
                variant="contained"
                disabled={!canSavePick || dialogSaving}
                sx={{
                  bgcolor: "#f4c9b3",
                  color: "#3f332f",
                  boxShadow: "none",
                  borderRadius: "8px",
                  "&:hover": { bgcolor: "#efb997", boxShadow: "none" },
                }}
              >
                {dialogSaving ? "Saving..." : "Save"}
              </Button>
            )}
          </DialogActions>
        </Box>
      </Dialog>
      <PlayerPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        slotAbbr={activeSlot?.position}
        slotName={activeSlot?.posName}
        draftContext={draftContext}
        onSelectPlayer={player => {
          setSelectedPlayer(player);
          setSearchQuery(player.name);
          setPickerOpen(false);
        }}
      />
      <PlayerStatsModal
        open={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        playerResult={statsResult}
        playerEntry={statsEntry}
      />
    </PageLayout>
  );
}
