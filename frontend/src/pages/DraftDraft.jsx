import { useCallback, useEffect, useMemo, useState } from "react";
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
import { createDraftPick, deleteDraftPick, fetchDraftState } from "../api/leaguesApi";
import { getPlayerValues } from "../api/playerClient";
import usePlayerStore from "../components/stores/usePlayerStore";
import useUndoRedo from "../hooks/useUndoRedo";

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
    playerName: slot.pick?.playerName ?? null,
    price: slot.pick?.amount ?? 0,
    stat: slot.pick?.stat ?? null,
    isEmpty: !slot.pick,
  };
}

export default function DraftDraft() {
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

  const { allPlayers, fetchAllPlayers } = usePlayerStore();
  useEffect(() => { fetchAllPlayers(); }, [fetchAllPlayers]);

  const loadDraftState = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");

    try {
      const data = await fetchDraftState(id);
      setDraftState(data);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Unable to load draft");
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
      detail: `$${owner.remainingBudget}`,
    }));
  }, [draftState]);

  const getRoster = (ownerId) => {
    const owner = draftState?.owners?.find((item) => String(item.id) === String(ownerId));
    if (!owner) return [];
    const rosterSlots = owner.rosterSlots || [];
    const plannedSlots = owner.plannedRosterSlots || [];
    return rosterSlots.map((slot, i) => {
      if (slot.pick) {
        return { ...normalizeRosterSlot(slot, ownerId), isActual: true, isPlan: false };
      }
      const planSlot = plannedSlots[i];
      if (planSlot?.plan) {
        return {
          id: slot.id,
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
        };
      }
      return { ...normalizeRosterSlot(slot, ownerId), isActual: false, isPlan: false };
    });
  };

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
    if (!activeSlot) {
      return;
    }

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
      closeDialog();
      await loadDraftState(true);
    } catch (err) {
      setDialogError(err.response?.data?.error || err.response?.data?.message || "Unable to save draft pick");
    } finally {
      setDialogSaving(false);
    }
  };

  const canSavePick = pickForm.amount !== "" && (
    (mode === "custom" && customName.trim()) ||
    (mode === "search" && selectedPlayer)
  );

  return (
    <PageLayout
      title="Draft"
      subtitle="Follow along with your league's draft"
      showBell
      actions={<>
        <Button size="small" variant="outlined" startIcon={<UndoIcon />} onClick={undo} disabled={!canUndo} sx={{ textTransform: "none", borderColor: "#d0bcb6", color: "#6d5a57", "&:hover": { borderColor: "#8c7672", bgcolor: "rgba(140,118,114,0.06)" }, "&.Mui-disabled": { borderColor: "#e8d8cc", color: "#c4aba6" } }}>Undo</Button>
        <Button size="small" variant="outlined" startIcon={<RedoIcon />} onClick={redo} disabled={!canRedo} sx={{ textTransform: "none", borderColor: "#d0bcb6", color: "#6d5a57", "&:hover": { borderColor: "#8c7672", bgcolor: "rgba(140,118,114,0.06)" }, "&.Mui-disabled": { borderColor: "#e8d8cc", color: "#c4aba6" } }}>Redo</Button>
      </>}
    >
      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 4 }}>
          <CircularProgress size={22} />
          <Typography sx={{ color: "#6d5a57", fontSize: "0.95rem" }}>Loading draft...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          <Alert severity="info" sx={{ mb: 2, borderRadius: "10px" }}>
            Select an owner, then click an open roster slot to enter a drafted player.
          </Alert>
          <OwnerRosterPanel owners={owners} getRoster={getRoster} onSlotClick={openDialog} />
        </>
      )}

      <DraftTabBar activeTab="draft" draftId={id} />

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "8px", bgcolor: "#fffaf7", overflow: "visible" } }}
      >
        <Box component="form" onSubmit={handleCreatePick}>
          <DialogTitle sx={{ pb: 1 }}>
            {activeSlot ? `${activeSlot.posAbbr} · ${activeSlot.posName}` : "Draft Slot"}
          </DialogTitle>
          <DialogContent sx={{ display: "grid", gap: 2, pt: 1, overflow: "visible" }}>
            {dialogError && (
              <Alert severity="error" sx={{ borderRadius: "8px" }}>
                {dialogError}
              </Alert>
            )}

            {activeSlot?.pickId ? (
              <Box sx={{ p: 1.5, borderRadius: "8px", bgcolor: "#fef0e8" }}>
                <Typography sx={{ fontWeight: 600 }}>{activeSlot.playerName}</Typography>
                <Typography sx={{ color: "#8c7672", fontSize: "0.9rem" }}>
                  ${activeSlot.price}{activeSlot.stat ? ` · ${activeSlot.stat}` : ""}
                </Typography>
              </Box>
            ) : (
              <>
                <ToggleButtonGroup
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
                )}

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
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog} disabled={dialogSaving} sx={{ color: "#6d5a57" }}>
              Close
            </Button>
            {!activeSlot?.pickId && (
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
    </PageLayout>
  );
}
