import { useCallback, useEffect, useState, useMemo } from "react";
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
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import RedoIcon from "@mui/icons-material/Redo";
import UndoIcon from "@mui/icons-material/Undo";
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import OwnerRosterPanel from "../components/OwnerRosterPanel";
import SearchBar from "../components/SearchBar";
import {
  fetchDraftState,
  createPlanPick as apiCreatePlanPick,
  deletePlanPick as apiDeletePlanPick,
  updatePlanPick as apiUpdatePlanPick,
} from "../api/leaguesApi";
import useNotes from "../hooks/useNotes";
import { getPlayerValues, getPlayerStats } from "../api/playerClient";
import usePlayerStore from "../components/stores/usePlayerStore";
import useUndoRedo from "../hooks/useUndoRedo";
import PlayerPickerModal from '../components/PlayerPickerModal';
import PlayerStatsModal from '../components/PlayerStatsModal';
import { isEligibleForSlot, resolvePlayerPositions } from "../utils/rosterEligibility";
import { getKeyStats, fmtStat } from "../utils/draftStatsHelpers";

function ownerLetter(slot) {
  return String.fromCharCode(64 + slot);
}

function normalizePlanSlot(slot, allPlayers = []) {
  const planPlayerId = slot.plan?.player ?? null;
  return {
    id: slot.plan?.id ?? null,
    posAbbr: slot.abbr,
    posName: slot.name,
    playerName: slot.plan?.playerName ?? null,
    price: slot.plan?.plannedAmount ?? 0,
    stat: null,
    position: slot.abbr,
    isEmpty: !slot.plan,
    planPlayerId,
    playerPositions: resolvePlayerPositions(allPlayers, planPlayerId),
  };
}

function normalizeActualSlot(slot) {
  return {
    id: slot.pick?.id ?? null,
    posAbbr: slot.abbr,
    posName: slot.name,
    playerId: slot.pick?.player ?? null,
    playerName: slot.pick?.playerName ?? null,
    price: slot.pick?.amount ?? 0,
    stat: slot.pick?.stat ?? null,
    position: slot.abbr,
    isEmpty: !slot.pick,
  };
}

const fieldSx = {
  "& .MuiInput-underline:before": { borderColor: "#d0bcb6" },
  "& .MuiInput-underline:hover:before": { borderColor: "#8c7672" },
  "& .MuiInput-underline:after": { borderColor: "#8c7672" },
  "& .MuiInputLabel-root": { color: "#8c7672" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#6d5a57" },
};

export default function DraftPlan() {
  const { id } = useParams();

  const [draftState, setDraftState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [mode, setMode] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [customName, setCustomName] = useState("");
  const [plannedAmount, setPlannedAmount] = useState("");
  const [projectedValue, setProjectedValue] = useState(null);
  const [valuationLoading, setValuationLoading] = useState(false);
  const [dialogSaving, setDialogSaving] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [noteText, setNoteText] = useState("");

  const { load: loadNotes, findNote, saveNote } = useNotes();
  useEffect(() => { loadNotes(); }, [loadNotes]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [statsResult, setStatsResult] = useState(null);
  const [statsEntry, setStatsEntry] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const { allPlayers, fetchAllPlayers } = usePlayerStore();
  useEffect(() => { fetchAllPlayers(); }, [fetchAllPlayers]);

  const loadData = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    return fetchDraftState(id)
      .then(setDraftState)
      .catch((err) => setError(err.response?.data?.error || "Failed to load draft data"))
      .finally(() => { if (!silent) setLoading(false); });
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const { push, undo, redo, canUndo, canRedo } = useUndoRedo(() => loadData(true));

  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === "y" || (e.key === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // Owner at slot 1 is always the current user (matches DraftRules seeding convention)
  const myOwner = draftState?.owners?.[0] ?? null;

  const owners = (draftState?.owners ?? []).map((o) => {
    let remaining = o.remainingBudget;
    if (String(o.id) === String(myOwner?.id)) {
      const plannedDeduction = (o.plannedRosterSlots ?? []).reduce((sum, planSlot, i) => {
        const actualSlot = (o.rosterSlots ?? [])[i];
        if (!actualSlot?.pick && planSlot?.plan?.plannedAmount) {
          return sum + planSlot.plan.plannedAmount;
        }
        return sum;
      }, 0);
      remaining = o.remainingBudget - plannedDeduction;
    }
    return {
      id: o.id,
      letter: ownerLetter(o.slot),
      name: o.name,
      detail: `$${remaining}`,
    };
  });

  const getRoster = (ownerId) => {
    const owner = draftState?.owners?.find((o) => String(o.id) === String(ownerId));
    if (!owner) return [];
    if (String(ownerId) === String(myOwner?.id)) {
      const plannedSlots = owner.plannedRosterSlots ?? [];
      const actualSlots = owner.rosterSlots ?? [];
      return plannedSlots.map((planSlot, i) => {
        const actualSlot = actualSlots[i];
        if (actualSlot?.pick) {
          return { ...normalizeActualSlot(actualSlot), isPlan: false, isActual: true };
        }
        return { ...normalizePlanSlot(planSlot, allPlayers), isPlan: !planSlot.isEmpty, isActual: false };
      });
    }
    return (owner.rosterSlots ?? []).map((slot) => ({
      ...normalizeActualSlot(slot),
      isPlan: false,
      isActual: false,
    }));
  };

  const openDialog = (slot) => {
    if (slot.isActual) return;
    setActiveSlot(slot);
    setMode("search");
    setSearchQuery("");
    setSuggestions([]);
    setSelectedPlayer(null);
    setCustomName("");
    setPlannedAmount(slot.isEmpty ? "" : String(slot.price || ""));
    setProjectedValue(null);
    setDialogError("");
    setStatsResult(null);
    setStatsEntry(null);
    const existing = findNote(slot.planPlayerId, slot.playerName);
    setNoteText(existing?.note ?? "");

    if (!slot.isEmpty && slot.planPlayerId) {
      const entry = allPlayers.find((p) => String(p.id) === String(slot.planPlayerId));
      setStatsEntry(entry ?? null);
      setStatsLoading(true);
      getPlayerStats(slot.planPlayerId)
        .then((result) => setStatsResult(result))
        .catch(() => setStatsResult(null))
        .finally(() => setStatsLoading(false));
    }

    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setActiveSlot(null);
    setNoteText("");
    setStatsResult(null);
    setStatsEntry(null);
  };

  const handleQueryChange = (q) => {
    setSearchQuery(q);
    setSelectedPlayer(null);
    setProjectedValue(null);
    setSuggestions(
      q.length > 1
        ? allPlayers.filter((p) => {
          if (!p.name.toLowerCase().includes(q.toLowerCase())) return false;
          if (!activeSlot?.position) return true;
          const searchPositions =
            (activeSlot.position === "SP" || activeSlot.position === "RP") ? ["P"] :
              activeSlot.position === "CI" ? ["1B", "3B"] :
                activeSlot.position === "MI" ? ["2B", "SS"] :
                  [activeSlot.position];
          const playerPositions = Array.isArray(p.positions)
            ? p.positions
            : (p.positions ? p.positions.split(",").map((s) => s.trim()) : []);
          return playerPositions.some((pos) => searchPositions.includes(pos));
        }).slice(0, 6)
        : []
    );
  };

  const handleSelectPlayer = async (player) => {
    setSelectedPlayer(player);
    setSearchQuery(player.name);
    setSuggestions([]);
    const existing = findNote(player.id, player.name);
    if (existing) setNoteText(existing.note ?? "");

    if (!draftState?.league) return;
    setValuationLoading(true);
    try {
      const result = await getPlayerValues({
        budget: draftState.league.budget,
        relevantStats: draftState.league.scoringTypes,
        playerIds: [player.id],
      });
      // Handle various possible response shapes from the API
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

  const handleSave = async () => {
    const playerName = mode === "custom" ? customName.trim() : selectedPlayer?.name;
    if (!playerName) {
      setDialogError(mode === "custom" ? "Enter a player name" : "Select a player first");
      return;
    }
    const payload = {
      ownerId: myOwner.id,
      playerName,
      position: activeSlot.position,
      plannedAmount: plannedAmount !== "" ? Number(plannedAmount) : 0,
      playerId: mode === "custom" ? undefined : selectedPlayer?.id,
    };
    setDialogSaving(true);
    setDialogError("");
    try {
      const newPick = await apiCreatePlanPick(id, payload);
      const action = {
        undo: async () => apiDeletePlanPick(id, newPick.id),
        redo: async () => {
          const rePick = await apiCreatePlanPick(id, payload);
          action.undo = async () => apiDeletePlanPick(id, rePick.id);
        },
      };
      push(action);
      if (noteText.trim()) {
        saveNote({
          playerName,
          playerId: mode === "custom" ? undefined : selectedPlayer?.id,
          note: noteText.trim(),
          isCustom: mode === "custom",
        });
      }
      closeDialog();
      loadData(true);
    } catch (err) {
      setDialogError(err.response?.data?.error || "Failed to save");
    } finally {
      setDialogSaving(false);
    }
  };

  const handleSaveNote = async () => {
    if (!activeSlot) return;
    const playerId = activeSlot.planPlayerId ?? null;
    const playerName = activeSlot.playerName;
    if (!playerName) return;
    await saveNote({ playerName, playerId: playerId || undefined, note: noteText.trim(), isCustom: !playerId });
    closeDialog();
  };

  const handleRemove = async () => {
    if (!activeSlot?.id) return;
    const pickId = activeSlot.id;
    const deletePayload = {
      ownerId: myOwner.id,
      playerName: activeSlot.playerName,
      position: activeSlot.position,
      plannedAmount: activeSlot.price,
    };
    setDialogSaving(true);
    setDialogError("");
    try {
      await apiDeletePlanPick(id, pickId);
      const action = {
        undo: async () => {
          const newPick = await apiCreatePlanPick(id, deletePayload);
          action.redo = async () => apiDeletePlanPick(id, newPick.id);
        },
        redo: async () => apiDeletePlanPick(id, pickId),
      };
      push(action);
      closeDialog();
      loadData(true);
    } catch (err) {
      setDialogError(err.response?.data?.error || "Failed to remove");
    } finally {
      setDialogSaving(false);
    }
  };

  const canDrop = useCallback((fromSlot, toSlot) => {
    if (!fromSlot.isPlan || fromSlot.isActual) return false;
    if (toSlot.isActual) return false;
    if (!isEligibleForSlot(fromSlot.playerPositions, toSlot.posAbbr)) return false;
    if (toSlot.isPlan && !isEligibleForSlot(toSlot.playerPositions, fromSlot.posAbbr)) return false;
    return true;
  }, []);

  const handleDropSlot = useCallback(async (fromSlot, toSlot) => {
    if (!fromSlot.id && !toSlot.id) return;
    if (fromSlot.posAbbr === toSlot.posAbbr) return;
    const fromOrigPos = fromSlot.posAbbr;
    const toOrigPos = toSlot.posAbbr;
    try {
      if (fromSlot.id) await apiUpdatePlanPick(id, fromSlot.id, { position: toSlot.posAbbr });
      if (toSlot.id) await apiUpdatePlanPick(id, toSlot.id, { position: fromSlot.posAbbr });
      const action = {
        undo: async () => {
          if (fromSlot.id) await apiUpdatePlanPick(id, fromSlot.id, { position: fromOrigPos });
          if (toSlot.id) await apiUpdatePlanPick(id, toSlot.id, { position: toOrigPos });
        },
        redo: async () => {
          if (fromSlot.id) await apiUpdatePlanPick(id, fromSlot.id, { position: toOrigPos });
          if (toSlot.id) await apiUpdatePlanPick(id, toSlot.id, { position: fromOrigPos });
        },
      };
      push(action);
      loadData(true);
    } catch {
      loadData(true);
    }
  }, [id, push, loadData]);

const draftContext = useMemo(() => {
    if (!draftState?.league) return null;

    const unavailablePlayers = (draftState.owners ?? [])
        .flatMap(owner => owner.rosterSlots ?? [])
        .map(slot => slot.pick?.player)
        .filter(Boolean);

    const myOwner = draftState.owners?.[0] ?? null; 
    const playersLeftToDraft = (myOwner?.rosterSlots ?? [])
        .filter(slot => !slot.pick)
        .length;

    return {
        budget: draftState.league.budget,
        relevantStats: draftState.league.scoringTypes,
        unavailablePlayers,
        playersLeftToDraft,
    };
}, [draftState]);

  return (
    <PageLayout
      title="Plan"
      subtitle="Plan your team"
      //showBell
      actions={<>
        <Button size="small" variant="outlined" startIcon={<UndoIcon />} onClick={undo} disabled={!canUndo} sx={{ textTransform: "none", borderColor: "#d0bcb6", color: "#6d5a57", "&:hover": { borderColor: "#8c7672", bgcolor: "rgba(140,118,114,0.06)" }, "&.Mui-disabled": { borderColor: "#e8d8cc", color: "#c4aba6" } }}>Undo</Button>
        <Button size="small" variant="outlined" startIcon={<RedoIcon />} onClick={redo} disabled={!canRedo} sx={{ textTransform: "none", borderColor: "#d0bcb6", color: "#6d5a57", "&:hover": { borderColor: "#8c7672", bgcolor: "rgba(140,118,114,0.06)" }, "&.Mui-disabled": { borderColor: "#e8d8cc", color: "#c4aba6" } }}>Redo</Button>
      </>}
    >
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "#8c7672" }} />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>{error}</Alert>
      )}
      {!loading && !error && (
        <>
          <OwnerRosterPanel
            owners={owners}
            getRoster={getRoster}
            editableOwnerId={myOwner?.id}
            onSlotClick={openDialog}
            canDrop={canDrop}
            onDropSlot={handleDropSlot}
          />
        </>
      )}

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "8px", bgcolor: "#fffaf7", overflow: "visible" } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          {activeSlot ? `${activeSlot.posAbbr} · ${activeSlot.posName}` : "Plan Slot"}
        </DialogTitle>

        <DialogContent sx={{ display: "grid", gap: 2, pt: 1, overflow: "visible" }}>
          {dialogError && (
            <Alert severity="error" sx={{ borderRadius: "8px" }}>{dialogError}</Alert>
          )}
          {activeSlot && !activeSlot.isEmpty ? (
            <>
              <Box sx={{ p: 1.5, borderRadius: "8px", bgcolor: "#fef0e8" }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  {statsEntry?.headshotUrl && (
                    <img src={statsEntry.headshotUrl} alt={activeSlot.playerName}
                      style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0, marginTop: 2 }} />
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }}>{activeSlot.playerName}</Typography>
                    {activeSlot.price > 0 && (
                      <Typography sx={{ color: "#8c7672", fontSize: "0.9rem" }}>
                        Planned bid: ${activeSlot.price}
                      </Typography>
                    )}
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
                  {activeSlot.planPlayerId && statsResult && (
                    <Button size="small" onClick={() => setStatsModalOpen(true)}
                      sx={{ textTransform: "none", color: "#6d5a57", borderColor: "#d0bcb6", flexShrink: 0, alignSelf: "flex-start" }}
                      variant="outlined">
                      More Info
                    </Button>
                  )}
                </Box>
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
                sx={fieldSx}
              />
            </>
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
                {selectedPlayer ? selectedPlayer.name : 'Add Player'}
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

              <TextField
                variant="standard"
                label="Planned bid ($)"
                type="number"
                value={plannedAmount}
                onChange={(e) => setPlannedAmount(e.target.value)}
                slotProps={{ htmlInput: { min: 0 } }}
                sx={{ width: 140, ...fieldSx }}
              />
              <TextField
                fullWidth
                variant="standard"
                label="Notes"
                multiline
                minRows={2}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a scouting note..."
                sx={fieldSx}
              />
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          {activeSlot && !activeSlot.isEmpty && (
            <Button onClick={handleRemove} disabled={dialogSaving} sx={{ color: "#b24b3c", mr: "auto" }}>
              {dialogSaving ? "Removing…" : "Remove"}
            </Button>
          )}
          <Button onClick={closeDialog} disabled={dialogSaving} sx={{ color: "#6d5a57" }}>
            Cancel
          </Button>
          {activeSlot && !activeSlot.isEmpty ? (
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
              variant="contained"
              onClick={handleSave}
              disabled={dialogSaving}
              sx={{ bgcolor: "#f4c9b3", color: "#3f332f", boxShadow: "none", borderRadius: "8px", "&:hover": { bgcolor: "#efb997", boxShadow: "none" } }}
            >
              {dialogSaving ? "Saving…" : "Add to Plan"}
            </Button>
          )}
        </DialogActions>

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
      </Dialog>

      <DraftTabBar activeTab="plan" draftId={id} />
      <PlayerStatsModal
        open={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        playerResult={statsResult}
        playerEntry={statsEntry}
      />
    </PageLayout>
  );
}
