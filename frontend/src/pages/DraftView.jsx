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
  Typography,
} from "@mui/material";
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import OwnerRosterPanel from "../components/OwnerRosterPanel";
import { fetchDraftState } from "../api/leaguesApi";

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

export default function DraftView() {
  const { id } = useParams();
  const [draftState, setDraftState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);

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
    return (owner?.rosterSlots || []).map((slot) => normalizeRosterSlot(slot, ownerId));
  };

  const openDialog = (slot) => {
    if (slot.isEmpty) {
      return;
    }

    setActiveSlot(slot);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setActiveSlot(null);
  };

  return (
    <PageLayout title="View" subtitle="View your finished league" showBell>
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
          <Alert severity="info" sx={{ mb: 2, borderRadius: "10px" }}>
            This view matches the Teams layout, but stays read-only. Click a filled slot to inspect the player.
          </Alert>
          <OwnerRosterPanel owners={owners} getRoster={getRoster} onSlotClick={openDialog} />
        </>
      )}

      <DraftTabBar activeTab="view" draftId={id} />

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "8px", bgcolor: "#fffaf7" } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          {activeSlot ? `${activeSlot.posAbbr} · ${activeSlot.posName}` : "Roster Slot"}
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.5, pt: 1 }}>
          {activeSlot && (
            <Box sx={{ p: 1.5, borderRadius: "8px", bgcolor: "#fef0e8" }}>
              <Typography sx={{ fontWeight: 600, fontSize: "1rem" }}>
                {activeSlot.playerName}
              </Typography>
              <Typography sx={{ color: "#8c7672", fontSize: "0.9rem", mt: 0.5 }}>
                {activeSlot.position}{activeSlot.slot ? `-${activeSlot.slot}` : ""}
              </Typography>
              <Typography sx={{ color: "#6d5a57", fontSize: "0.95rem", mt: 1 }}>
                Price: ${activeSlot.price}
              </Typography>
              <Typography sx={{ color: "#6d5a57", fontSize: "0.95rem", mt: 0.5 }}>
                Stat: {activeSlot.stat || "..."}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} sx={{ color: "#6d5a57" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
}
