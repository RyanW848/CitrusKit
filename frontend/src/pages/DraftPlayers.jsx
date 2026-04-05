import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Avatar,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SportsCricketIcon from "@mui/icons-material/SportsCricket";
import PageLayout from "../components/PageLayout";
import CitrusFab from "../components/CitrusFab";

const MOCK_PLAYERS = [
  { id: 1, name: "Baseball Player 1", positions: "C, 1B", price: 10, stats: [1, 2, 3, 4] },
  { id: 2, name: "Baseball Player 2", positions: "OF",    price: 20, stats: [1, 2, 3, 4] },
  { id: 3, name: "Baseball Player 3", positions: "SS, MI", price: 30, stats: [1, 2, 3, 4] },
  { id: 4, name: "Baseball Player 4", positions: "3B",    price: 40, stats: [1, 2, 3, 4] },
  { id: 5, name: "Baseball Player 5", positions: "2B",    price: 25, stats: [1, 2, 3, 4] },
];

const STAT_LABELS = ["Stat 1", "Stat 2", "Stat 3", "Stat 4"];

function PlayerRow({ player }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        bgcolor: "#fef0e8",
        border: "1px solid #e5d5c8",
        borderRadius: "12px",
        mb: 1,
        px: 1.5,
        py: 1,
        gap: 1.5,
      }}
    >
      {/* Avatar */}
      <Avatar
        sx={{
          bgcolor: "#f4c9b3",
          color: "#5a3e35",
          width: 40,
          height: 40,
          flexShrink: 0,
        }}
      >
        <SportsCricketIcon sx={{ fontSize: 20 }} />
      </Avatar>

      {/* Name + positions */}
      <Box sx={{ width: 150, flexShrink: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: "#1a1a1a" }}>
          {player.name}
        </Typography>
        <Typography variant="caption" sx={{ color: "#888" }}>
          Position(s): {player.positions}
        </Typography>
      </Box>

      {/* Price */}
      <Typography
        sx={{
          fontSize: "1.4rem",
          fontWeight: 700,
          color: "#4caf50",
          width: 60,
          flexShrink: 0,
        }}
      >
        ${player.price}
      </Typography>

      {/* Stats */}
      <Box sx={{ display: "flex", gap: 2, flexGrow: 1 }}>
        {player.stats.map((val, i) => (
          <Box key={i} sx={{ textAlign: "center" }}>
            <Typography sx={{ fontSize: "0.72rem", color: "#8c7672", fontWeight: 600 }}>
              {STAT_LABELS[i]}
            </Typography>
            <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>{val}</Typography>
          </Box>
        ))}
      </Box>

      {/* Edit */}
      <IconButton size="small" sx={{ color: "#555" }}>
        <EditOutlinedIcon sx={{ fontSize: 20 }} />
      </IconButton>
    </Box>
  );
}

export default function DraftPlayers() {
  const { id } = useParams();
  const [query, setQuery] = useState("");

  const filtered = MOCK_PLAYERS.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <PageLayout title="Players" subtitle="See all players" showBell>
      {/* Search bar */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
        <TextField
          variant="outlined"
          placeholder="Search for a player"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{
            width: "100%",
            maxWidth: 480,
            "& .MuiOutlinedInput-root": {
              borderRadius: "24px",
              bgcolor: "#fef0e8",
              "& fieldset": { borderColor: "#e5d5c8" },
              "&:hover fieldset": { borderColor: "#c0aeaa" },
              "&.Mui-focused fieldset": { borderColor: "#8c7672" },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MenuIcon sx={{ color: "#8c7672", fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon sx={{ color: "#8c7672", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Player list */}
      <Box sx={{ pb: 10 }}>
        {filtered.map((player) => (
          <PlayerRow key={player.id} player={player} />
        ))}
      </Box>

      {/* FABs */}
      <CitrusFab
        icon={<FilterAltOutlinedIcon />}
        sx={{ position: "fixed", bottom: 24, left: 24 }}
      />
      <CitrusFab
        icon={<AddIcon />}
        sx={{ position: "fixed", bottom: 24, right: 24 }}
      />
    </PageLayout>
  );
}
