import { Box, Avatar, Typography, IconButton } from "@mui/material";
import IosShareOutlinedIcon from "@mui/icons-material/IosShareOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

/**
 * Reusable league list row used on Home and Leagues pages.
 *
 * Props:
 *   league  – { name: string, lastEdited: string }
 *   onClick – optional click handler for the row body
 */
export default function LeagueRow({ league, onClick }) {
  const initial = league.name.charAt(0).toUpperCase();

  return (
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
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#1a1a1a" }}>
            {league.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "#888" }}>
            Last Edited: {league.lastEdited}
          </Typography>
        </Box>
      </Box>

      {/* Action icons */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.25,
          px: 1,
          borderLeft: "1px solid #e5d5c8",
        }}
      >
        <IconButton size="small" sx={{ color: "#c0aeaa" }}>
          <IosShareOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton size="small" sx={{ color: "#c0aeaa" }}>
          <SettingsOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton size="small" sx={{ color: "#c0aeaa" }}>
          <DeleteOutlineIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Box>
  );
}