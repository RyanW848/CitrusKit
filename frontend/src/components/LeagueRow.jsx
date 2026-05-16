import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

/**
 * Reusable league list row used on Home and Leagues pages.
 *
 * Props:
 *   league    – { name: string, lastEdited: string }
 *   onClick   – optional click handler for the row body
 *   onDelete  – optional callback called with league.id after confirmation
 */
export default function LeagueRow({ league, onClick, onDelete }) {
  const initial = league.name.charAt(0).toUpperCase();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onDelete(league.id);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "stretch",
          bgcolor: "#fef0e8",
          border: "1px solid #e5d5c8",
          borderRadius: "12px",
          mb: 1,
          overflow: "hidden",
        }}
      >
        {/* Row body */}
        <Box
          onClick={onClick}
          sx={{
            display: "flex",
            alignItems: "center",
            flexGrow: 1,
            p: 1.5,
            cursor: onClick ? "pointer" : "default",
          }}
        >
          <Avatar
            sx={{
              bgcolor: "#f4c9b3",
              color: "#5a3e35",
              fontWeight: 700,
              width: 40,
              height: 40,
              mr: 2,
              fontSize: "1rem",
            }}
          >
            {initial}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#1a1a1a" }}>
                {league.name}
              </Typography>
              {league.createdAt && (
                <Typography variant="caption" sx={{ bgcolor: "#f4c9b3", px: 0.75, py: 0.15, borderRadius: "4px", fontWeight: 600, fontSize: "0.65rem", color: "#5a3e35", lineHeight: 1.6 }}>
                  {new Date(league.createdAt).getFullYear()}
                </Typography>
              )}
            </Box>
            <Typography variant="caption" sx={{ color: "#888" }}>
              Last Edited: {league.lastEdited}
            </Typography>
          </Box>
        </Box>

        {/* Delete icon */}
        {onDelete && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              px: 1,
              borderLeft: "1px solid #e5d5c8",
            }}
          >
            <IconButton
              size="small"
              onClick={handleDeleteClick}
              sx={{ color: "#c0aeaa", "&:hover": { color: "#b24b3c" } }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        )}
      </Box>

      <Dialog
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "8px", bgcolor: "#fffaf7" } }}
      >
        <DialogTitle sx={{ pb: 1 }}>Delete league?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#6d5a57", fontSize: "0.95rem" }}>
            <strong>{league.name}</strong> and all its draft data will be permanently deleted. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={deleting}
            sx={{ color: "#6d5a57" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={deleting}
            sx={{
              bgcolor: "#d32f2f",
              color: "#fff",
              boxShadow: "none",
              borderRadius: "8px",
              "&:hover": { bgcolor: "#b71c1c", boxShadow: "none" },
            }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
