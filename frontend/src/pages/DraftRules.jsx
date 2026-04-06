import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  CircularProgress,
  Typography,
  TextField,
  IconButton,
  Autocomplete,
} from "@mui/material";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CheckIcon from "@mui/icons-material/Check";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import CitrusFab from "../components/CitrusFab";
import useLeague, { formatLeagueOwners } from "../hooks/useLeague";

const MOCK_STATS = ["Runs", "Stat #2", "Stat #3"];

const MOCK_POSITIONS = [
  { abbr: "C", name: "Catcher", count: 2 },
  { abbr: "1B", name: "1st Baseman", count: 1 },
  { abbr: "3B", name: "3rd Baseman", count: 1 },
  { abbr: "CI", name: "Center Infielder", count: 1 },
  { abbr: "2B", name: "2nd Baseman", count: 1 },
  { abbr: "SS", name: "Short Stop", count: 1 },
  { abbr: "MI", name: "Middle Infielder", count: 1 },
  { abbr: "OF", name: "Outfielder", count: 5 },
];

const ALL_STATS_POOL = ["Stat #4", "Stat #5", "Stat #6", "Stat #7", "Stat #8"];

// ── section definitions ───────────────────────────────────────────────────────

function NamePanel({ league }) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography sx={{ fontSize: "0.85rem", color: "#8c7672", mb: 1 }}>
        League Name
      </Typography>
      <Typography sx={{ fontSize: "1.6rem", fontWeight: 700, color: "#1a1a1a", mb: 1 }}>
        {league.name}
      </Typography>
      <Typography sx={{ color: "#666", maxWidth: 420 }}>
        This is the primary draft workspace for the league. Use the tabs below to move into teams,
        planning, and draft tracking.
      </Typography>
    </Box>
  );
}

function BudgetPanel({ league }) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography sx={{ fontSize: "0.85rem", color: "#8c7672", mb: 1 }}>
        Auction Budget
      </Typography>
      <Typography sx={{ fontSize: "1.6rem", fontWeight: 700, color: "#1a1a1a", mb: 1 }}>
        ${league.budget}
      </Typography>
      <Typography sx={{ color: "#666" }}>
        {league.teamCount} teams are configured for this league.
      </Typography>
    </Box>
  );
}

// ── sub-panels ────────────────────────────────────────────────────────────────

function OwnersPanel({ owners }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  return (
    <Box sx={{ p: 1.5 }}>
      {owners.map((owner) => (
        <Box
          key={owner.id}
          sx={{
            display: "flex",
            alignItems: "center",
            py: 1,
            gap: 1,
            borderBottom: "1px solid #e8d8cc",
          }}
        >
          <Typography sx={{ width: 20, fontWeight: 700, color: "#8c7672", fontSize: "0.88rem" }}>
            {owner.letter}
          </Typography>
          {editingId === owner.id ? (
            <TextField
              size="small"
              variant="standard"
              label="Name"
              defaultValue={owner.name}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => setEditingId(null)}
              autoFocus
              sx={{ flexGrow: 1 }}
            />
          ) : (
            <Typography sx={{ flexGrow: 1, fontSize: "0.95rem" }}>{owner.name}</Typography>
          )}
          <IconButton
            size="small"
            sx={{ color: "#b0a0a0" }}
            onClick={() => { setEditingId(owner.id); setEditValue(owner.name); }}
          >
            <EditOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      ))}
    </Box>
  );
}

function ScoringPanel({ stats }) {
  const [items, setItems] = useState(stats);
  const [addingValue, setAddingValue] = useState(null);

  return (
    <Box sx={{ p: 1.5, position: "relative" }}>
      {items.map((stat, i) => (
        <Box
          key={i}
          sx={{
            display: "flex",
            alignItems: "center",
            py: 1,
            gap: 1,
            borderBottom: "1px solid #e8d8cc",
          }}
        >
          <StarBorderIcon sx={{ fontSize: 16, color: "#8c7672" }} />
          <Typography sx={{ flexGrow: 1, fontSize: "0.95rem" }}>{stat}</Typography>
          <IconButton size="small" sx={{ color: "#b0a0a0" }}>
            <EditOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      ))}

      {addingValue !== null && (
        <Box sx={{ display: "flex", alignItems: "center", py: 1, gap: 1 }}>
          <StarBorderIcon sx={{ fontSize: 16, color: "#8c7672" }} />
          <Autocomplete
            options={ALL_STATS_POOL}
            size="small"
            sx={{ flexGrow: 1 }}
            renderInput={(params) => (
              <TextField {...params} label="Label" variant="standard" autoFocus />
            )}
            onChange={(_, val) => {
              if (val) { setItems([...items, val]); setAddingValue(null); }
            }}
            onBlur={() => setAddingValue(null)}
          />
        </Box>
      )}

      <CitrusFab
        icon={<AddIcon />}
        size={44}
        onClick={() => setAddingValue("")}
        sx={{ position: "absolute", bottom: 12, right: 12 }}
      />
    </Box>
  );
}

function PositionsPanel({ positions }) {
  return (
    <Box sx={{ p: 1.5 }}>
      {positions.map((pos) => (
        <Box
          key={pos.abbr}
          sx={{
            display: "flex",
            alignItems: "center",
            py: 1,
            gap: 1,
            borderBottom: "1px solid #e8d8cc",
          }}
        >
          <Typography sx={{ width: 28, fontWeight: 700, color: "#8c7672", fontSize: "0.82rem" }}>
            {pos.abbr}
          </Typography>
          <Typography sx={{ flexGrow: 1, fontSize: "0.95rem" }}>{pos.name}</Typography>
          <TextField
            variant="standard"
            defaultValue={pos.count}
            inputProps={{ style: { textAlign: "right", width: 32, fontSize: "0.9rem" } }}
            size="small"
          />
        </Box>
      ))}
    </Box>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function DraftRules() {
  const { id } = useParams();
  const { league, isLoading, error } = useLeague(id);
  const [activeSection, setActiveSection] = useState("name");

  const owners = useMemo(() => formatLeagueOwners(league), [league]);
  const sections = useMemo(() => ([
    {
      id: "name",
      label: "League Name",
      icon: <TextFieldsIcon sx={{ fontSize: 18 }} />,
      value: league?.name || "...",
    },
    {
      id: "budget",
      label: "Budget",
      icon: <StarBorderIcon sx={{ fontSize: 18 }} />,
      value: league ? `$${league.budget}` : "...",
    },
    {
      id: "owners",
      label: "League Owners",
      icon: <PersonOutlineIcon sx={{ fontSize: 18 }} />,
      value: league ? String(owners.length) : "...",
    },
    {
      id: "scoring",
      label: "Scoring Criteria",
      icon: <CheckIcon sx={{ fontSize: 18 }} />,
      value: league?.scoringTypes?.join(", ") || "...",
    },
    {
      id: "positions",
      label: "Positions",
      icon: <SyncAltIcon sx={{ fontSize: 18 }} />,
      value: String(MOCK_POSITIONS.reduce((sum, position) => sum + position.count, 0)),
    },
  ]), [league, owners.length]);

  const renderRightPanel = () => {
    if (isLoading) {
      return (
        <Box sx={{ minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress size={28} sx={{ color: "#8c7672" }} />
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ borderRadius: "10px" }}>
            {error}
          </Alert>
        </Box>
      );
    }

    if (!league) {
      return null;
    }

    switch (activeSection) {
      case "name": return <NamePanel league={league} />;
      case "budget": return <BudgetPanel league={league} />;
      case "owners": return <OwnersPanel owners={owners} />;
      case "scoring": return <ScoringPanel stats={league.scoringTypes?.length ? league.scoringTypes : MOCK_STATS} />;
      case "positions": return <PositionsPanel positions={MOCK_POSITIONS} />;
      default: return null;
    }
  };

  return (
    <PageLayout
      title="Rules"
      subtitle={league ? `Configure the rules for ${league.name}` : "Configure the rules for your league"}
      showBell
    >
      {/* Two-panel card */}
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
        {/* Left – settings menu */}
        <Box sx={{ bgcolor: "#fff", borderRight: "1px solid #e5d5c8", p: 1 }}>
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <Box
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 1.5,
                  py: 1.25,
                  cursor: "pointer",
                  border: isActive ? "1.5px solid #8c7672" : "1.5px solid transparent",
                  borderRadius: "8px",
                  bgcolor: isActive ? "#f5f0ed" : "transparent",
                  "&:hover": { bgcolor: isActive ? "#f5f0ed" : "#faf4f0" },
                }}
              >
                <Box sx={{ color: "#6d5a57" }}>{section.icon}</Box>
                <Typography sx={{ flexGrow: 1, fontSize: "0.95rem", fontWeight: isActive ? 600 : 400 }}>
                  {section.label}
                </Typography>
                <Typography sx={{ fontSize: "0.85rem", color: "#888" }}>
                  {section.value}
                </Typography>
                <ChevronRightIcon sx={{ fontSize: 18, color: "#b0a0a0" }} />
              </Box>
            );
          })}
        </Box>

        {/* Right – detail panel */}
        <Box sx={{ bgcolor: "#fef0e8", position: "relative" }}>
          {renderRightPanel()}
        </Box>
      </Box>

      <DraftTabBar activeTab="rules" draftId={id} />
    </PageLayout>
  );
}
