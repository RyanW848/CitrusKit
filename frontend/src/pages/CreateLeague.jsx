// Deprecated code; Functionality merged into the DraftRules panel

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import PageLayout from "../components/PageLayout";
import client from "../api/citrusClient";
import { btnSx, inputSx } from "../styles/formStyles";

const cardSx = {
  bgcolor: "#fef0e8",
  border: "1px solid #e5d5c8",
  borderRadius: "14px",
};

const helperCardSx = {
  ...cardSx,
  p: 2,
  height: "100%",
};

export default function CreateLeague() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    teamCount: 12,
    budget: 260,
    scoringTypes: "5x5",
    ownersText: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ownerNames = formData.ownersText
    .split("\n")
    .map((owner) => owner.trim())
    .filter(Boolean);

  const ownerCountMatches = ownerNames.length === Number(formData.teamCount);
  const ownerDelta = Number(formData.teamCount) - ownerNames.length;

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((current) => ({
      ...current,
      [field]: field === "teamCount" || field === "budget" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!ownerCountMatches) {
      setError(`Enter exactly ${formData.teamCount} league owners.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        teamCount: formData.teamCount,
        budget: formData.budget,
        scoringTypes: [formData.scoringTypes],
        owners: ownerNames.map((name) => ({ name })),
      };

      const response = await client.post("/leagues", payload);
      navigate(`/draft/${response.data.id}/rules`);
    } catch (err) {
      setError(err.response?.data?.error || "Creation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout
      title="Create League"
      subtitle="Set up the basics for your draft kit before you move into league rules."
      showBell
      maxWidth="lg"
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.5fr 1fr" },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Box sx={{ ...cardSx, p: { xs: 2, sm: 4 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
              mb: 3,
            }}
          >
            <Box sx={{ ...helperCardSx, bgcolor: "#f7e1d4" }}>
              <TextFieldsIcon sx={{ color: "#6d5a57", mb: 1 }} />
              <Typography sx={{ fontWeight: 700, color: "#1a1a1a", mb: 0.5 }}>
                League Basics
              </Typography>
              <Typography sx={{ fontSize: "0.88rem", color: "#666" }}>
                Name the league, choose team count, and set the auction budget.
              </Typography>
            </Box>

            <Box sx={helperCardSx}>
              <GroupsOutlinedIcon sx={{ color: "#6d5a57", mb: 1 }} />
              <Typography sx={{ fontWeight: 700, color: "#1a1a1a", mb: 0.5 }}>
                Owners
              </Typography>
              <Typography sx={{ fontSize: "0.88rem", color: "#666" }}>
                Add one owner per line. The owner total must match the team count.
              </Typography>
            </Box>
          </Box>

          <TextField
            fullWidth
            label="League Name"
            variant="outlined"
            value={formData.name}
            onChange={handleChange("name")}
            sx={inputSx}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              label="Team Count"
              type="number"
              value={formData.teamCount}
              onChange={handleChange("teamCount")}
              sx={inputSx}
              slotProps={{ htmlInput: { min: 2 } }}
            />

            <TextField
              fullWidth
              label="Budget"
              type="number"
              value={formData.budget}
              onChange={handleChange("budget")}
              sx={inputSx}
              slotProps={{ htmlInput: { min: 1 } }}
            />
          </Box>

          <TextField
            fullWidth
            label="Scoring Type"
            variant="outlined"
            value={formData.scoringTypes}
            onChange={handleChange("scoringTypes")}
            sx={inputSx}
            helperText="Keep this simple for now. You can expand league rules later."
          />

          <TextField
            fullWidth
            multiline
            minRows={Math.max(6, Math.min(formData.teamCount, 12))}
            label="League Owners"
            placeholder={"Alice\nBob\nCarol"}
            value={formData.ownersText}
            onChange={handleChange("ownersText")}
            sx={{
              ...inputSx,
              mb: 0,
              "& .MuiOutlinedInput-root": {
                ...inputSx["& .MuiOutlinedInput-root"],
                alignItems: "flex-start",
              },
            }}
            helperText={`${ownerNames.length} of ${formData.teamCount} owners entered`}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 3, borderRadius: "10px" }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              sx={{ ...btnSx, minWidth: 220 }}
              disabled={
                isSubmitting ||
                !formData.name.trim() ||
                formData.teamCount < 2 ||
                formData.budget < 1
              }
            >
              {isSubmitting ? "Creating..." : "Create League"}
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gap: 2 }}>
          <Box sx={helperCardSx}>
            <Typography sx={{ fontWeight: 700, color: "#1a1a1a", mb: 2 }}>
              League Snapshot
            </Typography>

            <Box sx={{ display: "grid", gap: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TextFieldsIcon sx={{ color: "#8c7672", fontSize: 18 }} />
                <Typography sx={{ fontSize: "0.92rem", color: "#444" }}>
                  {formData.name.trim() || "Untitled League"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <GroupsOutlinedIcon sx={{ color: "#8c7672", fontSize: 18 }} />
                <Typography sx={{ fontSize: "0.92rem", color: "#444" }}>
                  {formData.teamCount} teams
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <MonetizationOnOutlinedIcon sx={{ color: "#8c7672", fontSize: 18 }} />
                <Typography sx={{ fontSize: "0.92rem", color: "#444" }}>
                  ${formData.budget} budget
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ChecklistOutlinedIcon sx={{ color: "#8c7672", fontSize: 18 }} />
                <Typography sx={{ fontSize: "0.92rem", color: "#444" }}>
                  {formData.scoringTypes || "No scoring type"}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2, borderColor: "#ead8cd" }} />

            <Typography sx={{ fontWeight: 700, color: "#1a1a1a", mb: 1.5 }}>
              Owners Entered
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {ownerNames.length > 0 ? (
                ownerNames.map((owner, index) => (
                  <Chip
                    key={`${owner}-${index}`}
                    label={owner}
                    sx={{
                      bgcolor: "#f7e1d4",
                      color: "#5a3e35",
                      borderRadius: "8px",
                    }}
                  />
                ))
              ) : (
                <Typography sx={{ fontSize: "0.88rem", color: "#666" }}>
                  Add owner names to preview the league setup.
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ ...helperCardSx, bgcolor: ownerCountMatches ? "#f7e1d4" : "#fff3ee" }}>
            <Typography sx={{ fontWeight: 700, color: "#1a1a1a", mb: 0.75 }}>
              Validation
            </Typography>
            <Typography sx={{ fontSize: "0.88rem", color: "#666" }}>
              {ownerCountMatches
                ? "Owner count matches the number of teams."
                : ownerDelta > 0
                  ? `Add ${ownerDelta} more owner${ownerDelta === 1 ? "" : "s"} to continue.`
                  : `Remove ${Math.abs(ownerDelta)} owner${Math.abs(ownerDelta) === 1 ? "" : "s"} to match the team count.`}
            </Typography>
          </Box>
        </Box>
      </Box>
    </PageLayout>
  );
}
