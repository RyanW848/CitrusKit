import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import CitrusFab from "../components/CitrusFab";
import { AuthContext } from "../context/AuthContext";
import { createLeague, fetchLeagueById, updateLeague } from "../api/leaguesApi";
import { getApiErrorMessage } from "../utils/apiErrors";

const DEFAULT_SCORING = [
  "Runs (R)",
  "Home Runs (HR)",
  "RBI",
  "Stolen Bases (SB)",
  "Batting Average (AVG)",
  "Wins (W)",
  "Strikeouts (K)",
  "ERA",
  "WHIP",
  "Saves (SV)",
];

const DEFAULT_POSITIONS = [
  { abbr: "C", name: "Catcher", count: 2 },
  { abbr: "1B", name: "1st Baseman", count: 1 },
  { abbr: "2B", name: "2nd Baseman", count: 1 },
  { abbr: "3B", name: "3rd Baseman", count: 1 },
  { abbr: "SS", name: "Shortstop", count: 1 },
  { abbr: "CI", name: "Corner Infielder", count: 1 },
  { abbr: "MI", name: "Middle Infielder", count: 1 },
  { abbr: "OF", name: "Outfielder", count: 5 },
  { abbr: "U", name: "Utility", count: 1 },
  { abbr: "SP", name: "Starting Pitcher", count: 6 },
  { abbr: "RP", name: "Relief Pitcher", count: 3 },
];

function ownerLetter(index) {
  return String.fromCharCode(65 + index);
}

function createDraftRulesForm(league) {
  return {
    name: league?.name || "",
    budget: league?.budget ?? 260,
    owners: Array.isArray(league?.owners)
      ? league.owners.map((owner) => ({
          id: owner.id,
          name: owner.name || "",
        }))
      : [],
    scoringTypes: Array.isArray(league?.scoringTypes) ? league.scoringTypes : [...DEFAULT_SCORING],
    rosterPositions: Array.isArray(league?.rosterPositions) && league.rosterPositions.length > 0
      ? league.rosterPositions.map((position) => ({
          abbr: position.abbr || "",
          name: position.name || "",
          count: position.count ?? 1,
          sortOrder: position.sortOrder,
        }))
      : DEFAULT_POSITIONS.map((position, index) => ({
          ...position,
          sortOrder: index + 1,
        })),
  };
}

function NameBudgetPanel({ form, onNameChange, onBudgetChange }) {
  return (
    <Box sx={{ p: 1.5, display: "grid", gap: 2 }}>
      <TextField
        label="League name"
        value={form.name}
        onChange={(event) => onNameChange(event.target.value)}
        fullWidth
      />
      <TextField
        label="Budget"
        type="number"
        value={form.budget}
        onChange={(event) => onBudgetChange(event.target.value)}
        fullWidth
      />
    </Box>
  );
}

function OwnersPanel({ owners, onOwnerChange, onAddOwner, onRemoveOwner }) {
  const canRemoveOwner = owners.length > 1;

  return (
    <Box sx={{ p: 1.5, position: "relative", minHeight: 280 }}>
      {owners.map((owner, index) => (
        <Box
          key={owner.id || `owner-${index}`}
          sx={{
            display: "flex",
            alignItems: "center",
            py: 1,
            gap: 1,
            borderBottom: "1px solid #e8d8cc",
          }}
        >
          <Typography sx={{ width: 20, fontWeight: 700, color: "#8c7672", fontSize: "0.88rem" }}>
            {ownerLetter(index)}
          </Typography>
          <TextField
            size="small"
            variant="standard"
            label="Owner name"
            value={owner.name}
            onChange={(event) => onOwnerChange(index, event.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <IconButton
            size="small"
            sx={{ color: "#b0a0a0" }}
            onClick={() => onRemoveOwner(index)}
            disabled={!canRemoveOwner}
          >
            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      ))}

      <CitrusFab
        icon={<AddIcon />}
        size={44}
        onClick={onAddOwner}
        sx={{ position: "absolute", bottom: 12, right: 12 }}
      />
    </Box>
  );
}

function ScoringPanel({ stats, onStatChange, onAddStat, onRemoveStat }) {
  return (
    <Box sx={{ p: 1.5, position: "relative", minHeight: 280 }}>
      {stats.map((stat, index) => (
        <Box
          key={`stat-${index}`}
          sx={{
            display: "flex",
            alignItems: "center",
            py: 1,
            gap: 1,
            borderBottom: "1px solid #e8d8cc",
          }}
        >
          <StarBorderIcon sx={{ fontSize: 16, color: "#8c7672" }} />
          <TextField
            size="small"
            variant="standard"
            label="Scoring type"
            value={stat}
            onChange={(event) => onStatChange(index, event.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <IconButton size="small" sx={{ color: "#b0a0a0" }} onClick={() => onRemoveStat(index)}>
            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      ))}

      <CitrusFab
        icon={<AddIcon />}
        size={44}
        onClick={onAddStat}
        sx={{ position: "absolute", bottom: 12, right: 12 }}
      />
    </Box>
  );
}

function PositionsPanel({ positions, onPositionChange, onAddPosition, onRemovePosition }) {
  return (
    <Box sx={{ p: 1.5, position: "relative", minHeight: 280 }}>
      {positions.map((position, index) => (
        <Box
          key={`${position.abbr || "position"}-${index}`}
          sx={{
            display: "flex",
            alignItems: "center",
            py: 1,
            gap: 1,
            borderBottom: "1px solid #e8d8cc",
          }}
        >
          <TextField
            label="Abbr"
            variant="standard"
            value={position.abbr}
            onChange={(event) => onPositionChange(index, "abbr", event.target.value.toUpperCase())}
            sx={{ width: 64 }}
            size="small"
          />
          <TextField
            label="Name"
            variant="standard"
            value={position.name}
            onChange={(event) => onPositionChange(index, "name", event.target.value)}
            sx={{ flexGrow: 1 }}
            size="small"
          />
          <TextField
            label="Count"
            variant="standard"
            type="number"
            value={position.count}
            onChange={(event) => onPositionChange(index, "count", event.target.value)}
            inputProps={{ min: 1, style: { textAlign: "right", width: 36, fontSize: "0.9rem" } }}
            size="small"
          />
          <IconButton size="small" sx={{ color: "#b0a0a0" }} onClick={() => onRemovePosition(index)}>
            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      ))}

      <CitrusFab
        icon={<AddIcon />}
        size={44}
        onClick={onAddPosition}
        sx={{ position: "absolute", bottom: 12, right: 12 }}
      />
    </Box>
  );
}

export default function DraftRules() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isCreating = !id;

  const [activeSection, setActiveSection] = useState("owners");
  const [form, setForm] = useState(() => createDraftRulesForm(null));
  const [isLoading, setIsLoading] = useState(!isCreating);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isCreating) {
      return undefined;
    }

    setForm((current) => {
      if (current.owners.length > 0 || !user?.name) {
        return current;
      }

      return {
        ...current,
        owners: [{ name: user.name }],
      };
    });

    return undefined;
  }, [isCreating, user]);

  useEffect(() => {
    if (isCreating) {
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadLeague() {
      setIsLoading(true);
      setError("");

      try {
        const league = await fetchLeagueById(id);
        if (isMounted) {
          setForm(createDraftRulesForm(league));
        }
      } catch (err) {
        if (isMounted) {
          setError(getApiErrorMessage(err, "Unable to load league rules."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadLeague();

    return () => {
      isMounted = false;
    };
  }, [id, isCreating]);

  const sectionValues = useMemo(() => {
    return [
      { id: "name", label: "League Name", icon: <TextFieldsIcon sx={{ fontSize: 18 }} />, value: form.name || "..." },
      { id: "budget", label: "Budget", icon: <StarBorderIcon sx={{ fontSize: 18 }} />, value: form.budget ? `$${form.budget}` : "..." },
      { id: "owners", label: "League Owners", icon: <PersonOutlineIcon sx={{ fontSize: 18 }} />, value: String(form.owners.length) },
      { id: "scoring", label: "Scoring Criteria", icon: <CheckIcon sx={{ fontSize: 18 }} />, value: String(form.scoringTypes.length) },
      {
        id: "positions",
        label: "Positions",
        icon: <SyncAltIcon sx={{ fontSize: 18 }} />,
        value: String(form.rosterPositions.reduce((sum, position) => sum + (Number(position.count) || 0), 0)),
      },
    ];
  }, [form]);

  const updateForm = (updater) => {
    setForm((current) => updater(current));
  };

  const payload = {
    name: form.name.trim(),
    budget: Number(form.budget),
    teamCount: form.owners.length,
    owners: form.owners.map((owner) => ({
      ...(owner.id ? { id: owner.id } : {}),
      name: owner.name.trim(),
    })),
    scoringTypes: form.scoringTypes.map((type) => type.trim()).filter(Boolean),
    rosterPositions: form.rosterPositions.map((position, index) => ({
      abbr: position.abbr.trim().toUpperCase(),
      name: position.name.trim(),
      count: Number(position.count),
      sortOrder: index + 1,
    })),
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      if (isCreating) {
        const createdLeague = await createLeague(payload);
        navigate(`/draft/${createdLeague.id}/teams`);
        return;
      }

      const updatedLeague = await updateLeague(id, payload);
      setForm(createDraftRulesForm(updatedLeague));
      setSuccessMessage("League rules saved.");
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          isCreating ? "Unable to create league." : "Unable to save league rules."
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderRightPanel = () => {
    switch (activeSection) {
      case "name":
      case "budget":
        return (
          <NameBudgetPanel
            form={form}
            onNameChange={(value) => updateForm((current) => ({ ...current, name: value }))}
            onBudgetChange={(value) => updateForm((current) => ({ ...current, budget: value }))}
          />
        );
      case "owners":
        return (
          <OwnersPanel
            owners={form.owners}
            onOwnerChange={(index, value) => updateForm((current) => ({
              ...current,
              owners: current.owners.map((owner, ownerIndex) => (
                ownerIndex === index ? { ...owner, name: value } : owner
              )),
            }))}
            onAddOwner={() => updateForm((current) => ({
              ...current,
              owners: [...current.owners, { name: "" }],
            }))}
            onRemoveOwner={(index) => updateForm((current) => ({
              ...current,
              owners: current.owners.filter((_, ownerIndex) => ownerIndex !== index),
            }))}
          />
        );
      case "scoring":
        return (
          <ScoringPanel
            stats={form.scoringTypes}
            onStatChange={(index, value) => updateForm((current) => ({
              ...current,
              scoringTypes: current.scoringTypes.map((stat, statIndex) => (
                statIndex === index ? value : stat
              )),
            }))}
            onAddStat={() => updateForm((current) => ({
              ...current,
              scoringTypes: [...current.scoringTypes, ""],
            }))}
            onRemoveStat={(index) => updateForm((current) => ({
              ...current,
              scoringTypes: current.scoringTypes.filter((_, statIndex) => statIndex !== index),
            }))}
          />
        );
      case "positions":
        return (
          <PositionsPanel
            positions={form.rosterPositions}
            onPositionChange={(index, field, value) => updateForm((current) => ({
              ...current,
              rosterPositions: current.rosterPositions.map((position, positionIndex) => (
                positionIndex === index ? { ...position, [field]: value } : position
              )),
            }))}
            onAddPosition={() => updateForm((current) => ({
              ...current,
              rosterPositions: [
                ...current.rosterPositions,
                { abbr: "", name: "", count: 1, sortOrder: current.rosterPositions.length + 1 },
              ],
            }))}
            onRemovePosition={(index) => updateForm((current) => ({
              ...current,
              rosterPositions: current.rosterPositions.filter((_, positionIndex) => positionIndex !== index),
            }))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <PageLayout
      title="Rules"
      subtitle={isCreating ? "Set up the core settings for your league" : "Configure the rules for your league"}
      showBell
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: "10px" }}>
          {successMessage}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 4 }}>
          <CircularProgress size={22} />
          <Typography sx={{ color: "#6d5a57", fontSize: "0.95rem" }}>
            Loading league rules...
          </Typography>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1.6fr" },
              border: "1px solid #e5d5c8",
              borderRadius: "14px",
              overflow: "hidden",
              minHeight: 360,
            }}
          >
            <Box sx={{ bgcolor: "#fff", borderRight: { xs: "none", md: "1px solid #e5d5c8" }, p: 1 }}>
              {sectionValues.map((section) => {
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

            <Box sx={{ bgcolor: "#fef0e8", position: "relative" }}>
              {renderRightPanel()}
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isSaving}
              sx={{
                bgcolor: "#f0956a",
                borderRadius: "999px",
                px: 3,
                py: 1,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": { bgcolor: "#e8834f", boxShadow: "none" },
              }}
            >
              {isSaving ? "Saving..." : isCreating ? "Create league" : "Save league rules"}
            </Button>
          </Box>
        </>
      )}

      <DraftTabBar activeTab="rules" draftId={id} />
    </PageLayout>
  );
}
