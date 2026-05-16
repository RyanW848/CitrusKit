import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import DepthChartView from "../components/DepthChartView";
import OwnerRosterPanel from "../components/OwnerRosterPanel";
import TeamComparisonTable from "../components/TeamComparisonTable";
import { fetchDraftState, fetchDraftHistory } from "../api/leaguesApi";
import { getPlayerStats } from "../api/playerClient";
import PlayerStatsModal from "../components/PlayerStatsModal";
import usePlayerStore from "../components/stores/usePlayerStore";

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

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function DraftView() {
  const { id } = useParams();
  const [draftState, setDraftState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("rosters");

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  // Stats modal state
  const [statsOpen, setStatsOpen]       = useState(false);
  const [statsResult, setStatsResult]   = useState(null);
  const [statsEntry, setStatsEntry]     = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const { allPlayers, fetchAllPlayers } = usePlayerStore();
  useEffect(() => { fetchAllPlayers(); }, [fetchAllPlayers]);

  const loadDraftState = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchDraftState(id);
      setDraftState(data);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Unable to load league view");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadDraftState(); }, [loadDraftState]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const events = await fetchDraftHistory(id);
      setHistory(events);
    } catch (err) {
      setHistoryError(err.response?.data?.error || "Unable to load draft history");
    } finally {
      setHistoryLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (activeView === "log") loadHistory();
  }, [activeView, loadHistory]);

  const owners = useMemo(() => {
    return (draftState?.owners || []).map((owner) => ({
      id: owner.id,
      letter: ownerLetter(owner.slot),
      name: owner.name,
    }));
  }, [draftState]);

  const getRoster = (ownerId) => {
    const owner = draftState?.owners?.find((item) => String(item.id) === String(ownerId));
    return (owner?.rosterSlots || []).map((slot) => normalizeRosterSlot(slot, ownerId));
  };

  const allRostersFull = useMemo(() => {
    if (!draftState?.owners?.length) return false;
    return draftState.owners.every((owner) =>
      (owner.rosterSlots || []).every((slot) => slot.pick !== null)
    );
  }, [draftState]);

  const getTaxi = (ownerId) => {
    const owner = draftState?.owners?.find((item) => String(item.id) === String(ownerId));
    return owner?.taxiPlayers ?? [];
  };

  const openDialog = async (slot) => {
    if (slot.isEmpty) return;

    const playerEntry = allPlayers.find(p => String(p.id) === String(slot.playerId)) ?? null;
    setStatsEntry(playerEntry);
    setStatsResult(null);

    if (slot.playerId) {
      setStatsLoading(true);
      try {
        const data = await getPlayerStats(slot.playerId);
        setStatsResult(data);
      } catch {
        // stats unavailable — modal still opens
      } finally {
        setStatsLoading(false);
      }
    }

    setStatsOpen(true);
  };

  // Group history events by date for display
  const groupedHistory = useMemo(() => {
    const groups = [];
    let lastDate = null;
    for (const event of history) {
      const date = formatDate(event.timestamp);
      if (date !== lastDate) {
        groups.push({ type: "date", label: date });
        lastDate = date;
      }
      groups.push({ type: "event", event });
    }
    return groups;
  }, [history]);

  return (
    <PageLayout title="View" subtitle="View your finished league">
      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 4 }}>
          <CircularProgress size={22} />
          <Typography sx={{ color: "#6d5a57", fontSize: "0.95rem" }}>Loading league view...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          {activeView === "rosters" && (
            <>
              {statsLoading && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <CircularProgress size={16} sx={{ color: "#8c7672" }} />
                  <Typography sx={{ color: "#6d5a57", fontSize: "0.85rem" }}>Loading player stats...</Typography>
                </Box>
              )}
              <Alert severity="info" sx={{ mb: 2, borderRadius: "10px" }}>
                Click a filled slot to view the player's stats.
              </Alert>
              <OwnerRosterPanel
                owners={owners}
                getRoster={getRoster}
                onSlotClick={openDialog}
                getTaxi={getTaxi}
                taxiEnabled={allRostersFull}
              />
            </>
          )}

          {activeView === "comparison" && (
            <TeamComparisonTable draftState={draftState} />
          )}

          {activeView === "log" && (
            <Box>
              {historyLoading && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 4 }}>
                  <CircularProgress size={22} />
                  <Typography sx={{ color: "#6d5a57", fontSize: "0.95rem" }}>Loading draft log...</Typography>
                </Box>
              )}
              {historyError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>{historyError}</Alert>
              )}
              {!historyLoading && !historyError && history.length === 0 && (
                <Typography sx={{ color: "#8c7672", fontSize: "0.9rem", py: 4, textAlign: "center" }}>
                  No draft events recorded yet.
                </Typography>
              )}
              {!historyLoading && !historyError && groupedHistory.map((item, i) => {
                if (item.type === "date") {
                  return (
                    <Typography key={`date-${i}`} sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#a3681e", textTransform: "uppercase", letterSpacing: "0.08em", mt: i === 0 ? 0 : 2, mb: 0.75 }}>
                      {item.label}
                    </Typography>
                  );
                }
                const { event } = item;
                const isAdd      = event.type === "pick_added";
                const isTransfer = event.type === "pick_transferred";
                const isRemove   = event.type === "pick_removed";
                const iconColor  = isAdd ? "#f97316" : isTransfer ? "#7c3aed" : "#dc2626";
                const bgColor    = isAdd ? "#fef9f5" : isTransfer ? "#faf5ff" : "#fff5f5";
                const borderColor = isAdd ? "#f4c9b3" : isTransfer ? "#e9d5ff" : "#fecaca";
                return (
                  <Box
                    key={event.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      px: 1.5,
                      py: 1,
                      mb: 0.5,
                      borderRadius: "8px",
                      bgcolor: bgColor,
                      border: `1px solid ${borderColor}`,
                      opacity: isRemove ? 0.75 : 1,
                    }}
                  >
                    {/* Pick number */}
                    {event.pickNumber != null && (
                      <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem", color: "#a3681e", minWidth: 28, textAlign: "right", flexShrink: 0 }}>
                        #{event.pickNumber}
                      </Typography>
                    )}

                    {/* Icon */}
                    <Box sx={{ color: iconColor, flexShrink: 0, display: "flex" }}>
                      {isAdd && <AddCircleOutlineIcon sx={{ fontSize: 16 }} />}
                      {isTransfer && <SwapHorizIcon sx={{ fontSize: 16 }} />}
                      {isRemove && <RemoveCircleOutlineIcon sx={{ fontSize: 16 }} />}
                    </Box>

                    {/* Player + owner */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.88rem", color: "#1a1008", textDecoration: isRemove ? "line-through" : "none" }}>
                        {event.playerName}
                      </Typography>
                      <Typography sx={{ fontSize: "0.75rem", color: "#6d5a57" }}>
                        {isTransfer
                          ? `${event.fromOwnerName} → ${event.ownerName}`
                          : `${event.ownerName}${event.position ? ` · ${event.position}` : ""}`}
                      </Typography>
                    </Box>

                    {/* Price */}
                    {event.amount != null && (
                      <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", fontWeight: 600, color: isRemove ? "#9a8a84" : "#3f332f", flexShrink: 0 }}>
                        ${event.amount}
                      </Typography>
                    )}

                    {/* Time */}
                    <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", color: "#a3681e", flexShrink: 0 }}>
                      {formatTime(event.timestamp)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
          {activeView === "depth" && <DepthChartView />}
        </>
      )}

      <DraftTabBar
        activeTab="view"
        draftId={id}
        subTab={activeView}
        onSubTabChange={setActiveView}
      />

      <PlayerStatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        playerResult={statsResult}
        playerEntry={statsEntry}
        allPlayersStats={null}
      />
    </PageLayout>
  );
}
