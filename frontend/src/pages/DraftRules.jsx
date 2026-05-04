import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
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
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import CitrusFab from "../components/CitrusFab";
import { AuthContext } from "../context/AuthContext";
import {
  createLeague,
  fetchLeagueById,
  updateLeague,
} from "../api/leaguesApi";
import { getApiErrorMessage } from "../utils/apiErrors";
import { btnSx } from "../styles/formStyles";

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

function createDefaultForm(user) {
  return {
    name: "",
    budget: 260,
    owners: user?.name ? [{ name: user.name }] : [],
    scoringTypes: [...DEFAULT_SCORING],
    positions: DEFAULT_POSITIONS.map((position) => ({ ...position })),
  };
}

function createFormFromLeague(league) {
  return {
    name: league.name || "",
    budget: league.budget ?? 200,
    owners: (league.owners || []).map((owner) => ({
      id: owner.id,
      name: owner.name || "",
    })),
    scoringTypes: Array.isArray(league.scoringTypes) ? league.scoringTypes : [],
    positions: (league.rosterPositions || []).map((position) => ({
      abbr: position.abbr || "",
      name: position.name || "",
      count: Number(position.count) || 0,
    })),
  };
}

function SectionNav({ sections, activeId, onSelect, invalidIds = [] }) {
  return (
    <Box sx={{ bgcolor: "#fff", borderRight: "1px solid #e5d5c8", p: 1 }}>
      {sections.map((section) => {
        const isActive = activeId === section.id;
        const isInvalid = invalidIds.includes(section.id);
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
              border: isInvalid
                ? "1.5px solid #d32f2f"
                : isActive
                  ? "1.5px solid #8c7672"
                  : "1.5px solid transparent",
              borderRadius: "8px",
              bgcolor: isInvalid && !isActive ? "#fff5f5" : isActive ? "#f5f0ed" : "transparent",
              "&:hover": { bgcolor: isInvalid && !isActive ? "#ffebeb" : isActive ? "#f5f0ed" : "#faf4f0" },
            }}
          >
            <Box sx={{ color: isInvalid ? "#d32f2f" : "#6d5a57" }}>{section.icon}</Box>
            <Typography sx={{ flexGrow: 1, fontSize: "0.95rem", fontWeight: isActive ? 600 : 400, color: isInvalid ? "#d32f2f" : "inherit" }}>
              {section.label}
            </Typography>
            <Typography sx={{ fontSize: "0.85rem", color: isInvalid ? "#d32f2f" : "#888" }}>
              {section.value}
            </Typography>
            <ChevronRightIcon sx={{ fontSize: 18, color: isInvalid ? "#d32f2f" : "#b0a0a0" }} />
          </Box>
        );
      })}
    </Box>
  );
}

export default function DraftRules() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreating = !id;
  const { user } = useContext(AuthContext);

  const [activeSection, setActiveSection] = useState("name");
  const [formData, setFormData] = useState(() => createDefaultForm(user));
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [isLoadingLeague, setIsLoadingLeague] = useState(false);

  useEffect(() => {
    if (isCreating) {
      setFormData((current) => {
        if (current.owners.length > 0 || !user?.name) {
          return current;
        }
        return {
          ...current,
          owners: [{ name: user.name }],
        };
      });
      return;
    }

    let isMounted = true;
    setIsLoadingLeague(true);
    setError("");
    setSuccessMessage("");

    fetchLeagueById(id)
      .then((league) => {
        if (isMounted) {
          setFormData(createFormFromLeague(league));
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(getApiErrorMessage(err, "Unable to load league rules."));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingLeague(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, isCreating, user]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: field === "budget" ? Number(value) : value,
    }));
  };

  const setOwners = (owners) => {
    setFormData((prev) => ({ ...prev, owners }));
  };

  const setScoringTypes = (scoringTypes) => {
    setFormData((prev) => ({ ...prev, scoringTypes }));
  };

  const setPositions = (positions) => {
    setFormData((prev) => ({ ...prev, positions }));
  };

  const totalSlots = useMemo(
    () => formData.positions.reduce((sum, position) => sum + (Number(position.count) || 0), 0),
    [formData.positions]
  );

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
      value: `${formData.scoringTypes.length} stats`,
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
      value: `${formData.owners.length}`,
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
    const fabPb = 8;

    switch (activeSection) {
      case "name":
        return (
          <Box sx={{ p: 2.5 }}>
            {sectionLabel("League Name")}
            <TextField
              fullWidth
              variant="standard"
              placeholder="e.g. Fantasy Baseball 2025"
              value={formData.name}
              onChange={handleChange("name")}
              autoFocus
              sx={fieldSx}
            />
          </Box>
        );

      case "budget":
        return (
          <Box sx={{ p: 2.5 }}>
            {sectionLabel("Auction Budget")}
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
          </Box>
        );

      case "scoring":
        return (
          <Box sx={{ p: 2.5 }}>
            {sectionLabel("Scoring Criteria")}
            {DEFAULT_SCORING.map((stat) => {
              const checked = formData.scoringTypes.includes(stat);
              return (
                <Box
                  key={stat}
                  onClick={() =>
                    setScoringTypes(
                      checked
                        ? formData.scoringTypes.filter((s) => s !== stat)
                        : [...formData.scoringTypes, stat]
                    )
                  }
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    py: 0.5,
                    gap: 0.5,
                    borderBottom: "1px solid #e8d8cc",
                    cursor: "pointer",
                    "&:hover": { bgcolor: "rgba(140, 118, 114, 0.05)", borderRadius: "4px" },
                  }}
                >
                  <Checkbox
                    checked={checked}
                    size="small"
                    disableRipple
                    sx={{
                      color: "#c4aba6",
                      "&.Mui-checked": { color: "#8c7672" },
                      p: 0.5,
                    }}
                  />
                  <Typography sx={{ fontSize: "0.95rem" }}>{stat}</Typography>
                </Box>
              );
            })}
          </Box>
        );

      case "positions":
        return (
          <Box sx={{ p: 2.5, pb: fabPb }}>
            {sectionLabel(`Roster Positions — ${totalSlots} slots`)}
            {formData.positions.map((position, index) => (
              <Box
                key={`${position.abbr}-${index}`}
                sx={{ display: "flex", alignItems: "center", py: 0.75, gap: 1, borderBottom: "1px solid #e8d8cc" }}
              >
                <Typography sx={{ width: 28, fontWeight: 700, color: "#8c7672", fontSize: "0.82rem", flexShrink: 0 }}>
                  {position.abbr}
                </Typography>
                <Typography sx={{ flexGrow: 1, fontSize: "0.95rem" }}>{position.name}</Typography>
                <TextField
                  variant="standard"
                  type="number"
                  value={position.count}
                  size="small"
                  slotProps={{ htmlInput: { min: 0, style: { textAlign: "right", width: 28, fontSize: "0.9rem" } } }}
                  sx={{ width: 44, ...fieldSx }}
                  onChange={(event) =>
                    setPositions(formData.positions.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, count: Math.max(0, Number(event.target.value)) } : item
                    ))
                  }
                />
              </Box>
            ))}
          </Box>
        );

      case "owners":
        return (
          <Box sx={{ p: 2.5, pb: fabPb }}>
            {sectionLabel(`League Owners — ${formData.owners.length}`)}
            {formData.owners.map((owner, index) => (
              <Box
                key={owner.id || `owner-${index}`}
                sx={{ display: "flex", alignItems: "center", py: 0.75, gap: 1, borderBottom: "1px solid #e8d8cc" }}
              >
                <Typography sx={{ width: 22, fontWeight: 700, color: "#8c7672", fontSize: "0.85rem", flexShrink: 0 }}>
                  {index + 1}
                </Typography>
                {isCreating && index === 0 ? (
                  <>
                    <Typography sx={{ flexGrow: 1, fontSize: "0.95rem" }}>{owner.name}</Typography>
                    <Typography sx={{ fontSize: "0.78rem", color: "#8c7672", fontStyle: "italic", flexShrink: 0 }}>
                      (You)
                    </Typography>
                  </>
                ) : (
                  <>
                    <TextField
                      variant="standard"
                      value={owner.name}
                      placeholder="Owner name"
                      size="small"
                      sx={{ flexGrow: 1, ...fieldSx }}
                      onChange={(event) =>
                        setOwners(formData.owners.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, name: event.target.value } : item
                        ))
                      }
                    />
                    <IconButton
                      size="small"
                      sx={{ color: "#b0a0a0" }}
                      onClick={() => setOwners(formData.owners.filter((_, itemIndex) => itemIndex !== index))}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </>
                )}
              </Box>
            ))}
            <CitrusFab
              icon={<AddIcon />}
              size={44}
              onClick={() => setOwners([...formData.owners, { name: "" }])}
              sx={{ position: "absolute", bottom: 12, right: 12 }}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  const invalidSections = validationAttempted ? [
    !formData.name.trim() && "name",
    formData.budget < 1 && "budget",
    (formData.owners.length < 2 || !formData.owners.every((owner) => owner.name.trim())) && "owners",
  ].filter(Boolean) : [];

  const canSubmit =
    !isSubmitting &&
    formData.name.trim() &&
    formData.budget >= 1 &&
    formData.owners.length >= 2 &&
    formData.owners.every((owner) => owner.name.trim());

  const handleSubmit = async () => {
    if (!canSubmit) {
      setValidationAttempted(true);
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      teamCount: formData.owners.length,
      budget: formData.budget,
      scoringTypes: formData.scoringTypes,
      rosterPositions: formData.positions.map(({ abbr, name, count }, index) => ({
        abbr,
        name,
        count,
        sortOrder: index + 1,
      })),
      owners: formData.owners.map((owner) => ({
        ...(owner.id ? { id: owner.id } : {}),
        name: owner.name.trim(),
      })),
    };

    try {
      if (isCreating) {
        const response = await createLeague(payload);
        navigate(`/draft/${response.id}/teams`);
      } else {
        const response = await updateLeague(id, payload);
        setFormData(createFormFromLeague(response));
        setSuccessMessage("League rules saved.");
      }
    } catch (err) {
      setError(getApiErrorMessage(err, isCreating ? "Creation failed" : "Unable to save league rules."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout
      title={isCreating ? "Create League" : "Rules"}
      subtitle={isCreating ? "Set up your league before configuring rules." : "Configure the rules for your league"}
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

      {isLoadingLeague ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 4 }}>
          <CircularProgress size={22} />
          <Typography sx={{ color: "#6d5a57", fontSize: "0.95rem" }}>Loading league rules...</Typography>
        </Box>
      ) : (
        <>
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
            <SectionNav sections={sections} activeId={activeSection} onSelect={setActiveSection} invalidIds={invalidSections} />
            <Box sx={{ bgcolor: "#fef0e8", position: "relative" }}>
              {renderRightPanel()}
            </Box>
          </Box>

          <Box
            sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}
            onClick={!canSubmit ? () => setValidationAttempted(true) : undefined}
          >
            <Button
              variant="contained"
              startIcon={isCreating ? <AddCircleOutlineIcon /> : null}
              onClick={handleSubmit}
              disabled={!canSubmit}
              sx={{ ...btnSx, minWidth: 200 }}
            >
              {isSubmitting ? (isCreating ? "Creating…" : "Saving…") : (isCreating ? "Create League" : "Save Rules")}
            </Button>
          </Box>
        </>
      )}

      <DraftTabBar activeTab="rules" draftId={id} />
    </PageLayout>
  );
}
