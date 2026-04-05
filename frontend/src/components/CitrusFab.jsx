import { Box } from "@mui/material";

/**
 * The orange rounded-square floating action button used throughout the app.
 *
 * Props:
 *   icon     – icon element to render inside
 *   onClick  – click handler
 *   sx       – additional sx overrides (e.g. position)
 *   size     – width/height in px (default 52)
 */
export default function CitrusFab({ icon, onClick, sx = {}, size = 52 }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        width: size,
        height: size,
        bgcolor: "#f0956a",
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        "&:hover": { bgcolor: "#e8834f" },
        transition: "background-color 0.15s",
        ...sx,
      }}
    >
      {icon}
    </Box>
  );
}
