import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import OwnerRosterPanel from "../components/OwnerRosterPanel";
import { fetchDraftState } from "../api/leaguesApi";
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

export default function DraftView() {
  const { id } = useParams();
  const [draftState, setDraftState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Stats modal state
  const [statsOpen, setStatsOpen]     = useState(false);
  const [statsResult, setStatsResult] = useState(null);
  const [statsEntry, setStatsEntry]   = useState(null);
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
        // stats unavailable — modal will still open showing what we have
      } finally {
        setStatsLoading(false);
      }
    }

    setStatsOpen(true);
  };

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
          {statsLoading && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <CircularProgress size={16} sx={{ color: "#8c7672" }} />
              <Typography sx={{ color: "#6d5a57", fontSize: "0.85rem" }}>
                Loading player stats...
              </Typography>
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

      <DraftTabBar activeTab="view" draftId={id} />

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