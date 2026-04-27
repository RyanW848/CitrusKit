import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import OwnerRosterPanel from "../components/OwnerRosterPanel";
import { fetchDraftState } from "../api/leaguesApi";

function ownerLetter(slot) {
  return String.fromCharCode(64 + slot);
}

function normalizeRosterSlot(slot) {
  return {
    id: slot.id,
    posAbbr: slot.abbr,
    posName: slot.name,
    playerName: slot.pick?.playerName ?? null,
    price: slot.pick?.amount ?? 0,
    stat: slot.pick?.stat ?? null,
  };
}

export default function DraftTeams() {
  const { id } = useParams();
  const [draftState, setDraftState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDraftState = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchDraftState(id);
      setDraftState(data);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Unable to load teams");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDraftState();
  }, [loadDraftState]);

  const owners = (draftState?.owners || []).map((owner) => ({
    id: owner.id,
    letter: ownerLetter(owner.slot),
    name: owner.name,
  }));

  const getRoster = (ownerId) => {
    const owner = draftState?.owners?.find((item) => String(item.id) === String(ownerId));
    return (owner?.rosterSlots || []).map(normalizeRosterSlot);
  };

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
        <OwnerRosterPanel owners={owners} getRoster={getRoster} />
      )}

      <DraftTabBar activeTab="teams" draftId={id} />
    </PageLayout>
  );
}
