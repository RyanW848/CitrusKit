import { useCallback, useEffect, useState } from "react";
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
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import OwnerRosterPanel from "../components/OwnerRosterPanel";
import SearchBar from "../components/SearchBar";
import {
  fetchDraftState,
  createPlanPick as apiCreatePlanPick,
  deletePlanPick as apiDeletePlanPick,
} from "../api/leaguesApi";
import { getPlayerValues } from "../api/playerClient";
import usePlayerStore from "../components/stores/usePlayerStore";
import useUndoRedo from "../hooks/useUndoRedo";

function ownerLetter(slot) {
  return String.fromCharCode(64 + slot);
}

function normalizePlanSlot(slot) {
  return {
    id: slot.plan?.id ?? null,
    posAbbr: slot.abbr,
    posName: slot.name,
    playerName: slot.plan?.playerName ?? null,
    price: slot.plan?.plannedAmount ?? 0,
    stat: null,
    position: slot.abbr,
    isEmpty: !slot.plan,
  };
}

function normalizeActualSlot(slot) {
  return {
    id: slot.pick?.id ?? null,
    posAbbr: slot.abbr,
    posName: slot.name,
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

  const owners = (draftState?.owners ?? []).map((o) => ({
    id: o.id,
    letter: ownerLetter(o.slot),
    name: o.name,
  }));

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
        return { ...normalizePlanSlot(planSlot), isPlan: !planSlot.isEmpty, isActual: false };
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
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setActiveSlot(null);
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
            const searchPos = (activeSlot.position === "SP" || activeSlot.position === "RP") ? "P" : activeSlot.position;
            const playerPositions = Array.isArray(p.positions)
              ? p.positions
              : (p.positions ? p.positions.split(",").map((s) => s.trim()) : []);
            return playerPositions.some((pos) => pos === searchPos);
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
      closeDialog();
      loadData(true);
    } catch (err) {
      setDialogError(err.response?.data?.error || "Failed to save");
    } finally {
      setDialogSaving(false);
    }
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

  return (
    <PageLayout
      title="Plan"
      subtitle="Plan your team"
      showBell
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
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{activeSlot.playerName}</Typography>
              {activeSlot.price > 0 && (
                <Typography sx={{ color: "#8c7672", fontSize: "0.9rem" }}>
                  Planned bid: ${activeSlot.price}
                </Typography>
              )}
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
              <ToggleButtonGroup
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
              </ToggleButtonGroup>

              {mode === "search" ? (
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
      </Dialog>

      <DraftTabBar activeTab="plan" draftId={id} />
    </PageLayout>
  );
}
