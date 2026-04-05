import { useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

/**
 * Two-panel view shared by Teams, Plan, Draft, and View tabs.
 *
 * Left panel  – selectable owner list
 * Right panel – position/player roster for the selected owner
 *
 * Props:
 *   owners       – array of { id, letter, name }
 *   getRoster    – fn(ownerId) => array of { posAbbr, posName, playerName, price, stat }
 *   rightSlot    – optional element rendered at the bottom-right of the right panel
 */
export default function OwnerRosterPanel({ owners, getRoster, rightSlot }) {
  const [selectedId, setSelectedId] = useState(owners[0]?.id ?? null);
  const roster = getRoster ? getRoster(selectedId) : [];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1.6fr",
        border: "1px solid #e5d5c8",
        borderRadius: "14px",
        overflow: "hidden",
        minHeight: 360,
      }}
    >
      {/* Left – owner list */}
      <Box sx={{ bgcolor: "#fff", borderRight: "1px solid #e5d5c8" }}>
        {owners.map((owner) => {
          const isSelected = owner.id === selectedId;
          return (
            <Box
              key={owner.id}
              onClick={() => setSelectedId(owner.id)}
              sx={{
                display: "flex",
                alignItems: "center",
                px: 2,
                py: 1.5,
                cursor: "pointer",
                border: isSelected ? "1.5px solid #8c7672" : "1.5px solid transparent",
                borderRadius: isSelected ? "8px" : 0,
                mx: isSelected ? 1 : 0,
                my: isSelected ? 0.5 : 0,
                bgcolor: isSelected ? "#f5f0ed" : "transparent",
                "&:hover": { bgcolor: isSelected ? "#f5f0ed" : "#faf4f0" },
              }}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  color: "#6d5a57",
                  width: 20,
                  fontSize: "0.88rem",
                }}
              >
                {owner.letter}
              </Typography>
              <Typography sx={{ flexGrow: 1, fontWeight: 500, fontSize: "0.95rem" }}>
                {owner.name}
              </Typography>
              <IconButton size="small" sx={{ color: "#b0a0a0", p: 0.25 }}>
                <MoreHorizIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton size="small" sx={{ color: "#b0a0a0", p: 0.25 }}>
                <ChevronRightIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          );
        })}
      </Box>

      {/* Right – roster */}
      <Box sx={{ bgcolor: "#fef0e8", position: "relative", p: 1.5 }}>
        {roster.map((slot, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              alignItems: "center",
              py: 1,
              borderBottom: i < roster.length - 1 ? "1px solid #e8d8cc" : "none",
              gap: 1,
            }}
          >
            {/* Position abbreviation */}
            <Typography
              sx={{
                width: 28,
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#8c7672",
                flexShrink: 0,
              }}
            >
              {slot.posAbbr}
            </Typography>

            {/* Position name */}
            <Typography
              sx={{
                width: 110,
                fontSize: "0.88rem",
                color: "#333",
                flexShrink: 0,
              }}
            >
              {slot.posName}
            </Typography>

            {/* Player name */}
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                minWidth: 0,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.88rem",
                  color: slot.playerName ? "#1a1a1a" : "#aaa",
                  fontStyle: slot.playerName ? "normal" : "italic",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {slot.playerName || "Select a player ..."}
              </Typography>
              {slot.playerName && (
                <ChevronRightIcon sx={{ fontSize: 16, color: "#8c7672", flexShrink: 0 }} />
              )}
            </Box>

            {/* Price */}
            <Typography
              sx={{
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "#555",
                width: 36,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {slot.price != null ? `$${slot.price}` : "$0"}
            </Typography>

            {/* Stat label */}
            <Typography
              sx={{
                fontSize: "0.82rem",
                color: "#8c7672",
                width: 24,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {slot.stat ?? "..."}
            </Typography>
          </Box>
        ))}

        {/* Optional slot for FAB etc. */}
        {rightSlot && (
          <Box sx={{ position: "absolute", bottom: 12, right: 12 }}>{rightSlot}</Box>
        )}
      </Box>
    </Box>
  );
}
