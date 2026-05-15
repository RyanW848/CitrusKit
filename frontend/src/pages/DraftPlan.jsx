import { useCallback, useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
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
import { getPlayerValues } from "../api/playerClient";
import usePlayerStore from "../components/stores/usePlayerStore";
import useUndoRedo from "../hooks/useUndoRedo";
import PlayerPickerModal from '../components/PlayerPickerModal';

function ownerLetter(slot) {
  return String.fromCharCode(64 + slot);
}

function normalizePlanSlot(slot, allPlayers = []) {
  const planPlayerId = slot.plan?.player ?? null;
  let playerPositions = null;
  if (planPlayerId) {
    const found = allPlayers.find((p) => String(p.id) === String(planPlayerId));
    if (found) {
      playerPositions = Array.isArray(found.positions)
        ? found.positions
        : (found.positions ? found.positions.split(",").map((s) => s.trim()) : []);
    }
  }
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
    playerPositions,
  };
}

function isEligibleForSlot(playerPositions, slotAbbr) {
  if (!playerPositions) return true; // custom player: allow anywhere
  const expanded =
    (slotAbbr === "SP" || slotAbbr === "RP") ? ["P"] :
      slotAbbr === "CI" ? ["1B", "3B"] :
        slotAbbr === "MI" ? ["2B", "SS"] :
          slotAbbr === "U" ? null :
            [slotAbbr];
  if (expanded === null) return true; // U slot accepts anything
  return playerPositions.some((pos) => expanded.includes(pos));
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
    const existing = findNote(slot.planPlayerId, slot.playerName);
    setNoteText(existing?.note ?? "");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setActiveSlot(null);
    setNoteText("");
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
    return isEligibleForSlot(fromSlot.playerPositions, toSlot.posAbbr);
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
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px", overflow: "visible" } }}
      >
        <DialogTitle sx={{ fontSize: "1rem", fontWeight: 600, pb: 1 }}>
          {activeSlot ? `${activeSlot.posAbbr} — ${activeSlot.posName}` : ""}
        </DialogTitle>

        <DialogContent sx={{ overflow: "visible" }}>
          {activeSlot && !activeSlot.isEmpty ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{activeSlot.playerName}</Typography>
                {activeSlot.price > 0 && (
                  <Typography sx={{ color: "#8c7672", fontSize: "0.9rem" }}>
                    Planned bid: ${activeSlot.price}
                  </Typography>
                )}
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
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
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
                onChange={(_, v) => { if (v) setMode(v); }}
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
              </ToggleButtonGroup> */}

              {/* {mode === "search" ? (
                <Box sx={{ position: "relative" }}>
                  <SearchBar
                    value={searchQuery}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    onClear={() => handleQueryChange("")}
                    placeholder="Search for a player..."
                    sx={{ mb: 0 }}
                  />
                  {suggestions.length > 0 && (
                    <Paper
                      elevation={4}
                      sx={{ position: "absolute", width: "100%", zIndex: 10, mt: 0.5, borderRadius: "8px", overflow: "hidden" }}
                    >
                      {suggestions.map((p, i) => (
                        <Box
                          key={p.id}
                          onClick={() => handleSelectPlayer(p)}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            px: 2,
                            py: 1,
                            cursor: "pointer",
                            borderBottom: i < suggestions.length - 1 ? "1px solid #f0e8e4" : "none",
                            "&:hover": { bgcolor: "#fdf6f2" },
                          }}
                        >
                          {p.headshotUrl && (
                            <img
                              src={p.headshotUrl}
                              alt={p.name}
                              style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                            />
                          )}
                          <Box>
                            <Typography sx={{ fontWeight: 500, fontSize: "0.9rem" }}>{p.name}</Typography>
                            <Typography sx={{ fontSize: "0.78rem", color: "#9a8a84" }}>
                              {Array.isArray(p.positions) ? p.positions.join(" · ") : p.positions}
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
                  onChange={(e) => setCustomName(e.target.value)}
                  autoFocus
                  sx={fieldSx}
                />
              )} */}

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
            </Box>
          )}

          {dialogError && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: "8px" }}>{dialogError}</Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={closeDialog}
            disabled={dialogSaving}
            sx={{ textTransform: "none", color: "#8c7672" }}
          >
            Cancel
          </Button>
          {activeSlot && !activeSlot.isEmpty ? (
            <>
              <Button
                variant="outlined"
                onClick={handleRemove}
                disabled={dialogSaving}
                sx={{
                  textTransform: "none",
                  borderColor: "#d32f2f",
                  color: "#d32f2f",
                  "&:hover": { borderColor: "#b71c1c", bgcolor: "#fff5f5" },
                }}
              >
                {dialogSaving ? "Removing…" : "Remove from Plan"}
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveNote}
                disabled={dialogSaving}
                sx={{ textTransform: "none", bgcolor: "#8c7672", "&:hover": { bgcolor: "#6d5a57" } }}
              >
                Save Note
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={dialogSaving}
              sx={{ textTransform: "none", bgcolor: "#8c7672", "&:hover": { bgcolor: "#6d5a57" } }}
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
    </PageLayout>
  );
}
