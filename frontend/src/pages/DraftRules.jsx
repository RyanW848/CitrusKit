import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CheckIcon from "@mui/icons-material/Check";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import CitrusFab from "../components/CitrusFab";
import client from "../api/citrusClient";
import { btnSx } from "../styles/formStyles";

// ── default / mock data ───────────────────────────────────────────────────────

const DEFAULT_SCORING = [
  "Runs (R)", "Home Runs (HR)", "RBI", "Stolen Bases (SB)", "Batting Average (AVG)",
  "Wins (W)", "Strikeouts (K)", "ERA", "WHIP", "Saves (SV)",
];

const DEFAULT_POSITIONS = [
  { abbr: "C",  name: "Catcher",          count: 2 },
  { abbr: "1B", name: "1st Baseman",       count: 1 },
  { abbr: "2B", name: "2nd Baseman",       count: 1 },
  { abbr: "3B", name: "3rd Baseman",       count: 1 },
  { abbr: "SS", name: "Shortstop",         count: 1 },
  { abbr: "CI", name: "Corner Infielder",  count: 1 },
  { abbr: "MI", name: "Middle Infielder",  count: 1 },
  { abbr: "OF", name: "Outfielder",        count: 5 },
  { abbr: "U",  name: "Utility",           count: 1 },
  { abbr: "SP", name: "Starting Pitcher",  count: 6 },
  { abbr: "RP", name: "Relief Pitcher",    count: 3 },
];

const MOCK_OWNERS = [
  { id: "a", name: "Alice" },
  { id: "b", name: "Bob" },
  { id: "c", name: "Carol" },
  { id: "d", name: "David" },
  { id: "e", name: "Eve" },
  { id: "f", name: "Frank" },
];

const MOCK_STATS = ["Runs", "Stat #2", "Stat #3"];

const MOCK_POSITIONS = [
  { abbr: "C",  name: "Catcher",          count: 2 },
  { abbr: "1B", name: "1st Baseman",       count: 1 },
  { abbr: "3B", name: "3rd Baseman",       count: 1 },
  { abbr: "CI", name: "Corner Infielder",  count: 1 },
  { abbr: "2B", name: "2nd Baseman",       count: 1 },
  { abbr: "SS", name: "Shortstop",         count: 1 },
  { abbr: "MI", name: "Middle Infielder",  count: 1 },
  { abbr: "OF", name: "Outfielder",        count: 5 },
];

// ── section nav ───────────────────────────────────────────────────────────────

function SectionNav({ sections, activeId, onSelect }) {
  return (
    <Box sx={{ bgcolor: "#fff", borderRight: "1px solid #e5d5c8", p: 1 }}>
      {sections.map((section) => {
        const isActive = activeId === section.id;
        return (
          <Box
            key={section.id}
            onClick={() => onSelect(section.id)}
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
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function DraftRules() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreating = !id;

  const [activeSection, setActiveSection] = useState("name");
  const [formData, setFormData] = useState(
    isCreating ? { name: "", budget: 260 } : { name: "Baseball Team", budget: 200 }
  );
  const [owners, setOwners] = useState(isCreating ? [] : MOCK_OWNERS);
  const [scoringStats, setScoringStats] = useState(isCreating ? DEFAULT_SCORING : MOCK_STATS);
  const [positions, setPositions] = useState(isCreating ? DEFAULT_POSITIONS : MOCK_POSITIONS);
  const [addingStat, setAddingStat] = useState(false);
  const [newPosition, setNewPosition] = useState(null);
  const [createError, setCreateError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: field === "budget" ? Number(value) : value,
    }));
  };

  const handleCreateSubmit = async () => {
    setCreateError("");
    setIsSubmitting(true);
    try {
      const response = await client.post("/leagues", {
        name: formData.name.trim(),
        teamCount: owners.length,
        budget: formData.budget,
        scoringTypes: scoringStats,
        positions: positions.map(({ abbr, name, count }) => ({ abbr, name, count })),
        owners: owners.map((o) => ({ name: o.name.trim() })),
      });
      navigate(`/draft/${response.data.id}/teams`);
    } catch (err) {
      setCreateError(err.response?.data?.error || "Creation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSlots = positions.reduce((s, p) => s + p.count, 0);

  const sections = [
    {
      id: "name",
      label: "League Name",
      icon: <TextFieldsIcon sx={{ fontSize: 18 }} />,
      value: formData.name.trim() || "–",
    },
    {
      id: "budget",
      label: "Budget",
      icon: <StarBorderIcon sx={{ fontSize: 18 }} />,
      value: `$${formData.budget}`,
    },
    {
      id: "scoring",
      label: "Scoring Criteria",
      icon: <CheckIcon sx={{ fontSize: 18 }} />,
      value: `${scoringStats.length} stats`,
    },
    {
      id: "positions",
      label: "Positions",
      icon: <SyncAltIcon sx={{ fontSize: 18 }} />,
      value: `${totalSlots} slots`,
    },
    {
      id: "owners",
      label: "League Owners",
      icon: <PersonOutlineIcon sx={{ fontSize: 18 }} />,
      value: `${owners.length}`,
    },
  ];

  const fieldSx = {
    "& .MuiInput-underline:before": { borderColor: "#d0bcb6" },
    "& .MuiInput-underline:hover:before": { borderColor: "#8c7672" },
    "& .MuiInput-underline:after": { borderColor: "#8c7672" },
    "& .MuiInputLabel-root": { color: "#8c7672" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#6d5a57" },
  };

  const sectionLabel = (text) => (
    <Typography
      sx={{
        fontSize: "0.75rem",
        fontWeight: 600,
        color: "#8c7672",
        textTransform: "uppercase",
        letterSpacing: 0.7,
        mb: 2,
      }}
    >
      {text}
    </Typography>
  );

  const renderRightPanel = () => {
    // When creating, reserve bottom space so the FAB (rendered in the outer panel box) doesn't cover list rows.
    // FAB is 44px tall at bottom: 12px, so pb: 8 (64px) gives safe clearance.
    const fabPb = isCreating ? 8 : 0;

    switch (activeSection) {
      case "name":
        return (
          <Box sx={{ p: 2.5 }}>
            {sectionLabel("League Name")}
            {isCreating ? (
              <TextField
                fullWidth
                variant="standard"
                placeholder="e.g. Fantasy Baseball 2025"
                value={formData.name}
                onChange={handleChange("name")}
                autoFocus
                sx={fieldSx}
              />
            ) : (
              <Typography sx={{ fontSize: "1rem", color: "#1a1a1a" }}>
                {formData.name || "—"}
              </Typography>
            )}
          </Box>
        );

      case "budget":
        return (
          <Box sx={{ p: 2.5 }}>
            {sectionLabel("Auction Budget")}
            {isCreating ? (
              <TextField
                fullWidth
                variant="standard"
                type="number"
                value={formData.budget}
                onChange={handleChange("budget")}
                autoFocus
                slotProps={{ htmlInput: { min: 1 } }}
                sx={fieldSx}
              />
            ) : (
              <Typography sx={{ fontSize: "1rem", color: "#1a1a1a" }}>
                ${formData.budget}
              </Typography>
            )}
          </Box>
        );

      case "scoring":
        return (
          <Box sx={{ p: 2.5, pb: fabPb }}>
            {sectionLabel("Scoring Criteria — 5×5 Rotisserie")}
            {scoringStats.map((stat, i) => (
              <Box
                key={i}
                sx={{ display: "flex", alignItems: "center", py: 0.75, gap: 1, borderBottom: "1px solid #e8d8cc" }}
              >
                <StarBorderIcon sx={{ fontSize: 16, color: "#8c7672" }} />
                <Typography sx={{ flexGrow: 1, fontSize: "0.95rem" }}>{stat}</Typography>
                {isCreating && (
                  <IconButton
                    size="small"
                    sx={{ color: "#b0a0a0" }}
                    onClick={() => setScoringStats(scoringStats.filter((_, j) => j !== i))}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                )}
              </Box>
            ))}
            {isCreating && addingStat && (
              <Box sx={{ display: "flex", alignItems: "center", py: 0.75, gap: 1 }}>
                <StarBorderIcon sx={{ fontSize: 16, color: "#8c7672" }} />
                <TextField
                  variant="standard"
                  placeholder="Stat name"
                  size="small"
                  autoFocus
                  sx={{ flexGrow: 1, ...fieldSx }}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val) setScoringStats([...scoringStats, val]);
                    setAddingStat(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.target.blur();
                    if (e.key === "Escape") setAddingStat(false);
                  }}
                />
              </Box>
            )}
            {isCreating && (
              <CitrusFab
                icon={<AddIcon />}
                size={44}
                onClick={() => setAddingStat(true)}
                sx={{ position: "absolute", bottom: 12, right: 12 }}
              />
            )}
          </Box>
        );

      case "positions": {
        const commitNewPosition = () => {
          if (newPosition && newPosition.abbr.trim() && newPosition.name.trim()) {
            setPositions([...positions, { ...newPosition, count: Math.max(1, newPosition.count) }]);
          }
          setNewPosition(null);
        };
        return (
          <Box sx={{ p: 2.5, pb: fabPb }}>
            {sectionLabel(`Roster Positions — ${totalSlots} slots`)}
            {positions.map((pos, i) => (
              <Box
                key={i}
                sx={{ display: "flex", alignItems: "center", py: 0.75, gap: 1, borderBottom: "1px solid #e8d8cc" }}
              >
                <Typography sx={{ width: 28, fontWeight: 700, color: "#8c7672", fontSize: "0.82rem", flexShrink: 0 }}>
                  {pos.abbr}
                </Typography>
                <Typography sx={{ flexGrow: 1, fontSize: "0.95rem" }}>{pos.name}</Typography>
                {isCreating ? (
                  <>
                    <TextField
                      variant="standard"
                      type="number"
                      value={pos.count}
                      size="small"
                      slotProps={{ htmlInput: { min: 0, style: { textAlign: "right", width: 28, fontSize: "0.9rem" } } }}
                      sx={{ width: 44, ...fieldSx }}
                      onChange={(e) =>
                        setPositions(positions.map((p, j) =>
                          j === i ? { ...p, count: Math.max(0, Number(e.target.value)) } : p
                        ))
                      }
                    />
                    <IconButton
                      size="small"
                      sx={{ color: "#b0a0a0" }}
                      onClick={() => setPositions(positions.filter((_, j) => j !== i))}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </>
                ) : (
                  <Typography sx={{ fontSize: "0.9rem", color: "#555", minWidth: 24, textAlign: "right" }}>
                    {pos.count}
                  </Typography>
                )}
              </Box>
            ))}
            {isCreating && newPosition && (
              <Box sx={{ display: "flex", alignItems: "center", py: 0.75, gap: 1, borderBottom: "1px solid #e8d8cc" }}>
                <TextField
                  variant="standard"
                  placeholder="Abbr"
                  value={newPosition.abbr}
                  size="small"
                  autoFocus
                  sx={{ width: 48, ...fieldSx }}
                  onChange={(e) => setNewPosition({ ...newPosition, abbr: e.target.value.toUpperCase() })}
                />
                <TextField
                  variant="standard"
                  placeholder="Position name"
                  value={newPosition.name}
                  size="small"
                  sx={{ flexGrow: 1, ...fieldSx }}
                  onChange={(e) => setNewPosition({ ...newPosition, name: e.target.value })}
                  onBlur={commitNewPosition}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitNewPosition();
                    if (e.key === "Escape") setNewPosition(null);
                  }}
                />
                <TextField
                  variant="standard"
                  type="number"
                  value={newPosition.count}
                  size="small"
                  slotProps={{ htmlInput: { min: 1, style: { textAlign: "right", width: 28, fontSize: "0.9rem" } } }}
                  sx={{ width: 44, ...fieldSx }}
                  onChange={(e) => setNewPosition({ ...newPosition, count: Math.max(1, Number(e.target.value)) })}
                />
              </Box>
            )}
            {isCreating && (
              <CitrusFab
                icon={<AddIcon />}
                size={44}
                onClick={() => setNewPosition({ abbr: "", name: "", count: 1 })}
                sx={{ position: "absolute", bottom: 12, right: 12 }}
              />
            )}
          </Box>
        );
      }

      case "owners":
        return (
          <Box sx={{ p: 2.5, pb: fabPb }}>
            {sectionLabel(`League Owners — ${owners.length}`)}
            {owners.map((owner, i) => (
              <Box
                key={owner.id}
                sx={{ display: "flex", alignItems: "center", py: 0.75, gap: 1, borderBottom: "1px solid #e8d8cc" }}
              >
                <Typography sx={{ width: 22, fontWeight: 700, color: "#8c7672", fontSize: "0.85rem", flexShrink: 0 }}>
                  {i + 1}
                </Typography>
                {isCreating ? (
                  <>
                    <TextField
                      variant="standard"
                      value={owner.name}
                      placeholder="Owner name"
                      size="small"
                      sx={{ flexGrow: 1, ...fieldSx }}
                      onChange={(e) =>
                        setOwners(owners.map((o, j) => j === i ? { ...o, name: e.target.value } : o))
                      }
                    />
                    <IconButton
                      size="small"
                      sx={{ color: "#b0a0a0" }}
                      onClick={() => setOwners(owners.filter((_, j) => j !== i))}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </>
                ) : (
                  <Typography sx={{ flexGrow: 1, fontSize: "0.95rem" }}>{owner.name}</Typography>
                )}
              </Box>
            ))}
            {isCreating && (
              <CitrusFab
                icon={<AddIcon />}
                size={44}
                onClick={() => setOwners([...owners, { id: Date.now(), name: "" }])}
                sx={{ position: "absolute", bottom: 12, right: 12 }}
              />
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const canCreate =
    !isSubmitting &&
    formData.name.trim() &&
    formData.budget >= 1 &&
    owners.length >= 2 &&
    owners.every((o) => o.name.trim());

  return (
    <PageLayout
      title={isCreating ? "Create League" : "Rules"}
      subtitle={isCreating ? "Set up your league before configuring rules." : "Configure the rules for your league"}
      showBell
    >
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
        <SectionNav sections={sections} activeId={activeSection} onSelect={setActiveSection} />
        <Box sx={{ bgcolor: "#fef0e8", position: "relative" }}>
          {renderRightPanel()}
        </Box>
      </Box>

      {isCreating && createError && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: "10px" }}>
          {createError}
        </Alert>
      )}

      {isCreating && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleCreateSubmit}
            disabled={!canCreate}
            sx={{ ...btnSx, minWidth: 200 }}
          >
            {isSubmitting ? "Creating…" : "Create League"}
          </Button>
        </Box>
      )}

      <DraftTabBar activeTab="rules" draftId={id} />
    </PageLayout>
  );
}
