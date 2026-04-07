import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

/** Hardcoded demo player until API wiring exists */
const MOCK_PLAYER = {
  name: "Shohei Ohtani",
  team: "Los Angeles Dodgers",
  position: "DH / SP",
  stats: [
    { label: "AVG", value: ".310" },
    { label: "HR", value: "34" },
    { label: "RBI", value: "95" },
    { label: "SB", value: "20" },
    { label: "OPS", value: ".989" },
  ],
};

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 */
export default function PlayerViewPopUp({ open, onClose }) {
  const player = MOCK_PLAYER;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: "14px",
            border: "1px solid #e5d5c8",
            bgcolor: "#fef0e8",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
          pb: 1,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, color: "#1a1a1a", fontSize: "1.15rem" }}>
            {player.name}
          </Typography>
          <Typography sx={{ fontSize: "0.88rem", color: "#666", mt: 0.25 }}>
            {player.team} · {player.position}
          </Typography>
        </Box>
        <IconButton
          aria-label="Close player view"
          onClick={onClose}
          size="small"
          sx={{ color: "#6d5a57" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: "#ead8cd" }} />

      <DialogContent sx={{ pt: 2.5 }}>
        <Typography sx={{ fontWeight: 600, color: "#5a3e35", fontSize: "0.85rem", mb: 1.5 }}>
          Season stats
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 1.5,
          }}
        >
          {player.stats.map((row) => (
            <Box
              key={row.label}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                px: 1.5,
                py: 1,
                borderRadius: "10px",
                bgcolor: "#fff",
                border: "1px solid #ead8cd",
              }}
            >
              <Typography sx={{ fontSize: "0.88rem", color: "#666" }}>{row.label}</Typography>
              <Typography sx={{ fontWeight: 700, color: "#1a1a1a" }}>{row.value}</Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
