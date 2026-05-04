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
} from "../api/leaguesApi";
import { getPlayerValues } from "../api/playerClient";
import usePlayerStore from "../components/stores/usePlayerStore";

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
    setMlDialogOpen(true);
  };

  const closeMlDialog = () => {
    setMlDialogOpen(false);
    setMlDialogOwnerId(null);
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
    setMlSaving(true);
    setMlError("");
    try {
      await createMinorLeaguePick(id, {
        ownerId: mlDialogOwnerId,
        playerName,
        playerId: mlMode === "custom" ? undefined : mlSelectedPlayer?.id,
      });
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
      await loadDraftState(true);
    } catch {
      // silently reload to reflect true state
      await loadDraftState(true);
    }
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
            const searchPos = (activeSlot.position === "SP" || activeSlot.position === "RP") ? "P" : activeSlot.position;
            const playerPositions = Array.isArray(player.positions)
              ? player.positions
              : (player.positions ? player.positions.split(",").map((item) => item.trim()) : []);
            return playerPositions.some((position) => position === searchPos);
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

    setDialogSaving(true);
    setDialogError("");

    try {
      await createDraftPick(id, {
        ownerId: activeSlot.ownerId,
        playerName,
        position: activeSlot.position,
        slot: activeSlot.slot,
        amount: Number(pickForm.amount),
        stat: pickForm.stat.trim(),
        playerId: mode === "custom" ? undefined : selectedPlayer?.id,
      });
      closeDialog();
      await loadDraftState(true);
    } catch (err) {
      setDialogError(err.response?.data?.error || err.response?.data?.message || "Unable to save team data");
    } finally {
      setDialogSaving(false);
    }
  };

  const handleDeletePick = async () => {
    if (!activeSlot?.pickId) {
      return;
    }

    setDialogSaving(true);
    setDialogError("");

    try {
      await deleteDraftPick(id, activeSlot.pickId);
      closeDialog();
      await loadDraftState(true);
    } catch (err) {
      setDialogError(err.response?.data?.error || err.response?.data?.message || "Unable to remove player");
    } finally {
      setDialogSaving(false);
    }
  };

  const canSavePick = pickForm.amount !== "" && (
    (mode === "custom" && customName.trim()) ||
    (mode === "search" && selectedPlayer)
  );

  return (
    <PageLayout title="Teams" subtitle="Pre-input team data" showBell>
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
        <OwnerRosterPanel
          owners={owners}
          getRoster={getRoster}
          onSlotClick={openDialog}
          getMinorLeague={getMinorLeague}
          onAddMinorLeaguePlayer={openMlDialog}
          onRemoveMinorLeaguePlayer={handleRemoveMinorLeague}
        />
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
            {activeSlot?.pickId ? (
              <Button onClick={handleDeletePick} disabled={dialogSaving} sx={{ color: "#b24b3c", mr: "auto" }}>
                {dialogSaving ? "Removing..." : "Remove"}
              </Button>
            ) : null}
            <Button onClick={closeDialog} disabled={dialogSaving} sx={{ color: "#6d5a57" }}>
              Cancel
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
