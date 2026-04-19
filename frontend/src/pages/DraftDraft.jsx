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
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import CitrusFab from "../components/CitrusFab";
import { createDraftPick, fetchDraftState } from "../api/leaguesApi";

const emptyPickForm = {
  ownerId: "",
  playerName: "",
  position: "",
  amount: "",
  stat: "",
};

function ownerLetter(index) {
  return String.fromCharCode(65 + index);
}

function normalizePick(pick) {
  return {
    id: pick.id,
    posAbbr: pick.position || "UT",
    posName: pick.position || `Pick ${pick.pickNumber}`,
    playerName: pick.playerName,
    price: pick.amount,
    stat: pick.stat || "...",
  };
}

function createEmptyRows(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `empty-${index}`,
    posAbbr: index === 0 ? "UT" : "",
    posName: index === 0 ? "Open" : "",
    playerName: index === 0 ? "Select a player ..." : "",
    price: 0,
    stat: "...",
    isEmpty: true,
  }));
}

export default function DraftDraft() {
  const { id } = useParams();
  const [draftState, setDraftState] = useState(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pickForm, setPickForm] = useState(emptyPickForm);
  const [isSaving, setIsSaving] = useState(false);

  const loadDraft = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await fetchDraftState(id);
      setDraftState(data);
      setSelectedOwnerId((current) => current || data.owners?.[0]?.id || "");
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Unable to load draft");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  const owners = useMemo(() => {
    return (draftState?.owners || []).map((owner, index) => ({
      ...owner,
      letter: ownerLetter(index),
    }));
  }, [draftState]);

  const selectedOwner = owners.find((owner) => owner.id === selectedOwnerId) || owners[0];

  const rosterRows = useMemo(() => {
    const picks = (selectedOwner?.roster || []).map(normalizePick);
    return picks.length ? picks : createEmptyRows(8);
  }, [selectedOwner]);

  const openDraftDialog = () => {
    setError("");
    setPickForm({
      ...emptyPickForm,
      ownerId: selectedOwner?.id || owners[0]?.id || "",
    });
    setDialogOpen(true);
  };

  const handleFormChange = (field) => (event) => {
    setPickForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleCreatePick = async (event) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await createDraftPick(id, {
        ownerId: pickForm.ownerId,
        playerName: pickForm.playerName.trim(),
        position: pickForm.position.trim(),
        amount: Number(pickForm.amount),
        stat: pickForm.stat.trim(),
      });
      setDialogOpen(false);
      await loadDraft();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Unable to save draft pick");
    } finally {
      setIsSaving(false);
    }
  };

  const canSavePick = pickForm.ownerId && pickForm.playerName.trim() && pickForm.amount !== "";

  return (
    <PageLayout title="Draft" subtitle="Follow along with your league's draft" showBell>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 4 }}>
          <CircularProgress size={22} />
          <Typography sx={{ color: "#6d5a57", fontSize: "0.95rem" }}>Loading draft...</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1.6fr" },
            border: "1px solid #e5d5c8",
            borderRadius: "8px",
            overflow: "hidden",
            minHeight: 360,
            bgcolor: "#fff",
          }}
        >
          <Box sx={{ borderRight: { xs: "none", md: "1px solid #e5d5c8" }, bgcolor: "#fff", p: 1 }}>
            {owners.map((owner) => {
              const isSelected = selectedOwner?.id === owner.id;
              return (
                <Box
                  key={owner.id}
                  onClick={() => setSelectedOwnerId(owner.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 1.5,
                    py: 1,
                    my: 0.5,
                    border: isSelected ? "1.5px solid #8c7672" : "1.5px solid transparent",
                    borderRadius: "8px",
                    bgcolor: isSelected ? "#f5f0ed" : "transparent",
                    cursor: "pointer",
                    "&:hover": { bgcolor: "#faf4f0" },
                  }}
                >
                  <Typography sx={{ width: 18, fontWeight: 700, color: "#6d5a57", fontSize: "0.8rem" }}>
                    {owner.letter}
                  </Typography>
                  <Typography sx={{ flexGrow: 1, fontWeight: 500, fontSize: "0.9rem", color: "#1a1a1a" }}>
                    {owner.name}
                  </Typography>
                  <Typography sx={{ color: "#8c7672", fontSize: "0.8rem" }}>
                    ${owner.remainingBudget}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <Box sx={{ bgcolor: "#fef0e8", p: 1.5, position: "relative" }}>
            {rosterRows.map((slot, index) => (
              <Box
                key={slot.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  py: 0.8,
                  borderBottom: index < rosterRows.length - 1 ? "1px solid #ead8cd" : "none",
                  color: slot.isEmpty ? "#9b8d87" : "#1a1a1a",
                }}
              >
                <Typography sx={{ width: 28, fontWeight: 700, color: "#6d5a57", fontSize: "0.76rem" }}>
                  {slot.posAbbr}
                </Typography>
                <Typography sx={{ width: 104, fontSize: "0.82rem", color: "#333" }}>
                  {slot.posName}
                </Typography>
                <Typography
                  sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    fontSize: "0.84rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontStyle: slot.isEmpty ? "italic" : "normal",
                  }}
                >
                  {slot.playerName}
                </Typography>
                <Typography sx={{ width: 42, textAlign: "right", fontWeight: 600, fontSize: "0.82rem" }}>
                  ${slot.price}
                </Typography>
                <Typography sx={{ width: 28, textAlign: "right", color: "#8c7672", fontSize: "0.78rem" }}>
                  {slot.stat}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <DraftTabBar activeTab="draft" draftId={id} />

      <CitrusFab
        icon={<span style={{ fontWeight: 700, fontSize: "1.1rem" }}>$</span>}
        onClick={openDraftDialog}
        size={44}
        sx={{ position: "fixed", bottom: 24, right: 24, borderRadius: "8px" }}
      />

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "8px", bgcolor: "#fffaf7" } }}
      >
        <Box component="form" onSubmit={handleCreatePick}>
          <DialogTitle sx={{ pb: 1 }}>Draft Player</DialogTitle>
          <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
            <TextField
              select
              label="Owner"
              value={pickForm.ownerId}
              onChange={handleFormChange("ownerId")}
              required
              fullWidth
            >
              {owners.map((owner) => (
                <MenuItem key={owner.id} value={owner.id}>
                  {owner.name} · ${owner.remainingBudget} left
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Player"
              value={pickForm.playerName}
              onChange={handleFormChange("playerName")}
              required
              fullWidth
            />

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField
                label="Position"
                value={pickForm.position}
                onChange={handleFormChange("position")}
                placeholder="OF"
                fullWidth
              />
              <TextField
                label="Amount"
                type="number"
                value={pickForm.amount}
                onChange={handleFormChange("amount")}
                required
                fullWidth
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Box>

            <TextField
              label="Stat"
              value={pickForm.stat}
              onChange={handleFormChange("stat")}
              placeholder="S1"
              fullWidth
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)} disabled={isSaving} sx={{ color: "#6d5a57" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!canSavePick || isSaving}
              sx={{
                bgcolor: "#f4c9b3",
                color: "#3f332f",
                boxShadow: "none",
                borderRadius: "8px",
                "&:hover": { bgcolor: "#efb997", boxShadow: "none" },
              }}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </PageLayout>
  );
}
