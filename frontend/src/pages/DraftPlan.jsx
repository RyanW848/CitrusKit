import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, CircularProgress, Box } from "@mui/material";
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import OwnerRosterPanel from "../components/OwnerRosterPanel";
import { fetchDraftState } from "../api/leaguesApi";

function ownerLetter(slot) {
  return String.fromCharCode(64 + slot);
}

function normalizeRosterSlot(slot) {
  return {
    posAbbr: slot.abbr,
    posName: slot.name,
    playerName: slot.pick?.playerName ?? null,
    price: slot.pick?.amount ?? 0,
    stat: slot.pick?.stat ?? null,
  };
}

export default function DraftPlan() {
  const { id } = useParams();
  const [draftState, setDraftState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDraftState(id)
      .then(setDraftState)
      .catch((err) => setError(err.response?.data?.error || "Failed to load draft data"))
      .finally(() => setLoading(false));
  }, [id]);

  const owners = (draftState?.owners ?? []).map((o) => ({
    id: o.id,
    letter: ownerLetter(o.slot),
    name: o.name,
  }));

  const rosterSlotsByOwner = Object.fromEntries(
    (draftState?.owners ?? []).map((o) => [o.id, o.rosterSlots])
  );

  const getRoster = (ownerId) =>
    (rosterSlotsByOwner[ownerId] ?? []).map(normalizeRosterSlot);

  return (
    <PageLayout title="Plan" subtitle="Plan your team" showBell>
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "#8c7672" }} />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>{error}</Alert>}
      {!loading && !error && (
        <OwnerRosterPanel owners={owners} getRoster={getRoster} />
      )}
      <DraftTabBar activeTab="plan" draftId={id} />
    </PageLayout>
  );
}
