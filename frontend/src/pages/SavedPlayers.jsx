import { useContext, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PageLayout from "../components/PageLayout";
import { AuthContext } from "../context/AuthContext";
import useNotes from "../hooks/useNotes";

export default function SavedPlayers() {
  const { user } = useContext(AuthContext);
  const { notes, load, saveNote, removeNote } = useNotes();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeNote, setActiveNote] = useState(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const openDialog = (note) => {
    setActiveNote(note);
    setEditText(note.note ?? "");
    setError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setActiveNote(null);
    setEditText("");
    setError("");
  };

  const handleSave = async () => {
    if (!activeNote) return;
    setSaving(true);
    setError("");
    try {
      await saveNote({
        playerName: activeNote.playerName,
        playerId: activeNote.player || undefined,
        note: editText.trim(),
        isCustom: activeNote.isCustom,
      });
      closeDialog();
    } catch {
      setError("Unable to save note");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeNote) return;
    setSaving(true);
    try {
      await removeNote(activeNote.id);
      closeDialog();
    } catch {
      setError("Unable to delete note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout title="Saved Players" subtitle="Your notes across all drafts">
      {!user && (
        <Typography variant="body2" sx={{ color: "#666" }}>
          Sign in to view your saved players.
        </Typography>
      )}

      {user && notes.length === 0 && (
        <Typography variant="body2" sx={{ color: "#666" }}>
          No saved players yet. Add notes to players during drafting.
        </Typography>
      )}

      {notes.map((note) => (
        <Box
          key={note.id}
          onClick={() => openDialog(note)}
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            p: 2,
            mb: 1.5,
            bgcolor: "#fef0e8",
            borderRadius: "12px",
            border: "1px solid #e5d5c8",
            cursor: "pointer",
            "&:hover": { bgcolor: "#fde8d6" },
          }}
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: "0.95rem",
                color: "#3f332f",
                mb: 0.5,
              }}
            >
              {note.playerName}
              {note.isCustom && (
                <Typography
                  component="span"
                  sx={{ ml: 1, fontSize: "0.75rem", color: "#9a8a84", fontWeight: 400 }}
                >
                  custom
                </Typography>
              )}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.85rem",
                color: "#6d5a57",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {note.note || "No note"}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); removeNote(note.id); }}
            sx={{ color: "#c4b8b4", flexShrink: 0, "&:hover": { color: "#b24b3c" } }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "8px", bgcolor: "#fffaf7" } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          {activeNote?.playerName}
          {activeNote?.isCustom && (
            <Typography component="span" sx={{ ml: 1, fontSize: "0.8rem", color: "#9a8a84", fontWeight: 400 }}>
              custom
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.5, pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: "8px" }}>{error}</Alert>
          )}
          <TextField
            fullWidth
            variant="standard"
            label="Note"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            multiline
            minRows={3}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleDelete}
            disabled={saving}
            sx={{ color: "#b24b3c", mr: "auto" }}
          >
            {saving ? "Deleting..." : "Delete"}
          </Button>
          <Button onClick={closeDialog} disabled={saving} sx={{ color: "#6d5a57" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              bgcolor: "#f4c9b3",
              color: "#3f332f",
              boxShadow: "none",
              borderRadius: "8px",
              "&:hover": { bgcolor: "#efb997", boxShadow: "none" },
            }}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
}
