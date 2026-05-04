import { useEffect, useRef, useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

/**
 * SlotRow is defined outside OwnerRosterPanel to avoid remounting on every parent re-render,
 * which would break HTML5 drag-and-drop state mid-drag.
 */
function SlotRow({
  slot,
  index,
  rosterLength,
  isEditable,
  draggable,
  isDragging,
  isDragTarget,
  onClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
}) {
  return (
    <Box
      draggable={draggable || undefined}
      onClick={isEditable ? onClick : undefined}
      onDragStart={draggable ? onDragStart : undefined}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      sx={{
        display: "flex",
        alignItems: "center",
        py: 1,
        borderBottom: index < rosterLength - 1 ? "1px solid #e8d8cc" : "none",
        gap: 1,
        cursor: draggable ? "grab" : isEditable ? "pointer" : "default",
        borderRadius: "6px",
        bgcolor: isDragTarget ? "#fcd9b4" : slot.isPlan ? "#fde8d0" : "transparent",
        outline: isDragTarget ? "2px dashed #c8905a" : isDragging ? "2px dashed #d0bcb6" : "none",
        opacity: isDragging ? 0.45 : 1,
        transition: "opacity 0.1s, outline 0.1s",
        "&:hover": isEditable || draggable
          ? { bgcolor: isDragTarget ? "#fcd9b4" : slot.isPlan ? "#fddec2" : "rgba(140, 118, 114, 0.06)" }
          : undefined,
      }}
    >
      <Typography
        sx={{ width: 28, fontSize: "0.78rem", fontWeight: 700, color: "#8c7672", flexShrink: 0 }}
      >
        {slot.posAbbr}
      </Typography>

      <Typography
        sx={{ width: 110, fontSize: "0.88rem", color: "#333", flexShrink: 0 }}
      >
        {slot.posName}
      </Typography>

      <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: "0.88rem",
            color: slot.playerName
              ? (slot.isPlan ? "#7a5c44" : "#1a1a1a")
              : "#aaa",
            fontStyle: slot.playerName ? "normal" : "italic",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {slot.playerName || "Select a player ..."}
        </Typography>
        {slot.playerName && !slot.isPlan && (
          <ChevronRightIcon sx={{ fontSize: 16, color: "#8c7672", flexShrink: 0 }} />
        )}
        {slot.isPlan && slot.playerName && (
          <Typography
            component="span"
            sx={{
              fontSize: "0.7rem",
              color: "#a07858",
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            Planned
          </Typography>
        )}
      </Box>

      <Typography
        sx={{
          fontSize: "0.88rem",
          fontWeight: 600,
          color: slot.isPlan ? "#a07858" : "#555",
          width: 40,
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {slot.price != null && slot.price !== 0
          ? `${slot.isPlan ? "~" : ""}$${slot.price}`
          : (slot.playerName ? "$0" : "")}
      </Typography>

      <Typography
        sx={{ fontSize: "0.82rem", color: "#8c7672", width: 24, textAlign: "right", flexShrink: 0 }}
      >
        {slot.isPlan ? "" : (slot.stat ?? "...")}
      </Typography>
    </Box>
  );
}

/**
 * Two-panel view shared by Teams, Plan, Draft, and View tabs.
 *
 * Left panel  – selectable owner list
 * Right panel – position/player roster for the selected owner
 *
 * Props:
 *   owners       – array of { id, letter, name }
 *   getRoster    – fn(ownerId) => array of slot objects
 *   rightSlot    – optional element rendered at the bottom-right of the right panel
 *   canDrop      – optional fn(fromSlot, toSlot) => boolean; enables drag/drop when provided
 *   onDropSlot   – optional fn(fromSlot, toSlot); called on successful drop
 */
export default function OwnerRosterPanel({
  owners,
  getRoster,
  rightSlot,
  editableOwnerId,
  onSlotClick,
  canDrop,
  onDropSlot,
  getMinorLeague,
  onAddMinorLeaguePlayer,
  onRemoveMinorLeaguePlayer,
}) {
  const [selectedId, setSelectedId] = useState(owners[0]?.id ?? null);
  const [rightTab, setRightTab] = useState("roster");

  // draggedRef is a ref so event handlers always see the current value without stale closures.
  // draggedIndex state drives the visual highlight.
  const draggedRef = useRef(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    if (!owners.length) {
      setSelectedId(null);
      return;
    }
    const hasSelectedOwner = owners.some((owner) => owner.id === selectedId);
    if (!hasSelectedOwner) {
      setSelectedId(owners[0].id);
    }
  }, [owners, selectedId]);

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
              {owner.detail ? (
                <Typography sx={{ fontSize: "0.8rem", color: "#8c7672", flexShrink: 0 }}>
                  {owner.detail}
                </Typography>
              ) : null}
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

      {/* Right – roster or minor league */}
      <Box sx={{ bgcolor: "#fef0e8", position: "relative", display: "flex", flexDirection: "column" }}>
        {getMinorLeague && (
          <Box sx={{ display: "flex", borderBottom: "1px solid #e5d5c8", bgcolor: "#fff8f4" }}>
            {["roster", "minorLeague"].map((tab) => (
              <Box
                key={tab}
                onClick={() => setRightTab(tab)}
                sx={{
                  flex: 1,
                  py: 0.75,
                  textAlign: "center",
                  cursor: "pointer",
                  borderBottom: rightTab === tab ? "2px solid #8c7672" : "2px solid transparent",
                  "&:hover": { bgcolor: "rgba(140, 118, 114, 0.06)" },
                }}
              >
                <Typography sx={{ fontSize: "0.8rem", fontWeight: rightTab === tab ? 600 : 400, color: rightTab === tab ? "#6d5a57" : "#9a8a84" }}>
                  {tab === "roster" ? "Roster" : "Minor League"}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {(!getMinorLeague || rightTab === "roster") && (
          <Box sx={{ p: 1.5, position: "relative", flexGrow: 1 }}>
            {roster.map((slot, i) => {
              const isEditable = !!(onSlotClick && (
                editableOwnerId == null || selectedId === String(editableOwnerId)
              ) && !slot.isActual);
              const isDraggable = !!(onDropSlot && slot.isPlan && !slot.isActual && slot.playerName);

              return (
                <SlotRow
                  key={i}
                  slot={slot}
                  index={i}
                  rosterLength={roster.length}
                  isEditable={isEditable}
                  draggable={isDraggable}
                  isDragging={draggedIndex === i}
                  isDragTarget={dragOverIndex === i && draggedIndex !== i}
                  onClick={() => onSlotClick(slot, i)}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    draggedRef.current = i;
                    setDraggedIndex(i);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    const from = draggedRef.current;
                    if (from === null || from === i) return;
                    const fromSlot = roster[from];
                    if (!canDrop || canDrop(fromSlot, slot)) {
                      e.dataTransfer.dropEffect = "move";
                      setDragOverIndex(i);
                    } else {
                      e.dataTransfer.dropEffect = "none";
                      setDragOverIndex((prev) => (prev === i ? null : prev));
                    }
                  }}
                  onDragLeave={() => {
                    setDragOverIndex((prev) => (prev === i ? null : prev));
                  }}
                  onDragEnd={() => {
                    draggedRef.current = null;
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = draggedRef.current;
                    draggedRef.current = null;
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                    if (from === null || from === i) return;
                    const fromSlot = roster[from];
                    if (!canDrop || canDrop(fromSlot, slot)) {
                      onDropSlot?.(fromSlot, slot);
                    }
                  }}
                />
              );
            })}
            {rightSlot && (
              <Box sx={{ position: "absolute", bottom: 12, right: 12 }}>{rightSlot}</Box>
            )}
          </Box>
        )}

        {getMinorLeague && rightTab === "minorLeague" && (() => {
          const players = getMinorLeague(selectedId) ?? [];
          return (
            <Box sx={{ p: 1.5, flexGrow: 1 }}>
              {players.length === 0 && (
                <Typography sx={{ fontSize: "0.88rem", color: "#aaa", fontStyle: "italic", py: 1 }}>
                  No minor league players added yet.
                </Typography>
              )}
              {players.map((player, i) => (
                <Box
                  key={player.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    py: 0.75,
                    borderBottom: i < players.length - 1 ? "1px solid #e8d8cc" : "none",
                    gap: 1,
                  }}
                >
                  <Typography sx={{ flexGrow: 1, fontSize: "0.9rem" }}>{player.playerName}</Typography>
                  {onRemoveMinorLeaguePlayer && (
                    <IconButton size="small" sx={{ color: "#b0a0a0" }} onClick={() => onRemoveMinorLeaguePlayer(player)}>
                      <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                </Box>
              ))}
              {onAddMinorLeaguePlayer && (
                <Box
                  onClick={() => onAddMinorLeaguePlayer(selectedId)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mt: 1,
                    py: 0.5,
                    px: 0.5,
                    cursor: "pointer",
                    borderRadius: "6px",
                    color: "#8c7672",
                    "&:hover": { bgcolor: "rgba(140, 118, 114, 0.08)" },
                  }}
                >
                  <AddIcon sx={{ fontSize: 18 }} />
                  <Typography sx={{ fontSize: "0.88rem" }}>Add player</Typography>
                </Box>
              )}
            </Box>
          );
        })()}
      </Box>
    </Box>
  );
}
