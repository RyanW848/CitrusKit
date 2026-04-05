import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  IconButton,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import PageLayout from "../components/PageLayout";
import ClearAdornment from "../components/ClearAdornment";
import { inputSx, btnSx } from "../styles/formStyles";
import { createLeague } from "../api/leaguesApi";
import { getApiErrorMessage } from "../utils/apiErrors";

const SCORING_OPTIONS = [
  { value: "5x5", label: "Rotisserie 5×5" },
  { value: "points", label: "Head-to-head points" },
];

export default function CreateLeague() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [teamCount, setTeamCount] = useState("12");
  const [budget, setBudget] = useState("260");
  const [scoringTypes, setScoringTypes] = useState("5x5");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const tc = Number(teamCount);
    const b = Number(budget);
    if (!name.trim()) {
      setError("League name is required.");
      return;
    }
    if (!Number.isInteger(tc) || tc < 2) {
      setError("Team count must be a whole number of at least 2.");
      return;
    }
    if (!Number.isFinite(b) || b < 1) {
      setError("Budget must be at least 1.");
      return;
    }

    setSubmitting(true);
    try {
      await createLeague({
        name: name.trim(),
        teamCount: tc,
        budget: Math.round(b),
        scoringTypes: [scoringTypes],
      });
      navigate("/home");
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Could not create league. Try again.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout
      title="Create League"
      subtitle="Name your league and set draft basics. You can refine rules in the draft flow."
      showBell
    >
      <Box sx={{ mb: 1 }}>
        <IconButton
          size="small"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          sx={{ color: "#555", ml: -1 }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            bgcolor: "#fef0e8",
            border: "1px solid #e5d5c8",
            borderRadius: "14px",
            p: "32px 48px 40px",
            width: "100%",
            maxWidth: 460,
          }}
        >
          <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>
            All fields are required for your MVP draft setup.
          </Typography>

          <TextField
            fullWidth
            label="League name"
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={inputSx}
            disabled={submitting}
            InputProps={{
              endAdornment: (
                <ClearAdornment value={name} onClear={() => setName("")} />
              ),
            }}
          />

          <TextField
            fullWidth
            label="Number of teams"
            type="number"
            variant="outlined"
            inputProps={{ min: 2, step: 1 }}
            value={teamCount}
            onChange={(e) => setTeamCount(e.target.value)}
            sx={inputSx}
            disabled={submitting}
          />

          <TextField
            fullWidth
            label="Draft budget"
            type="number"
            variant="outlined"
            inputProps={{ min: 1, step: 1 }}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            sx={inputSx}
            disabled={submitting}
            helperText="Total auction dollars (or unit budget) for the draft."
          />

          <TextField
            select
            fullWidth
            label="Scoring format"
            variant="outlined"
            value={scoringTypes}
            onChange={(e) => setScoringTypes(e.target.value)}
            sx={inputSx}
            disabled={submitting}
          >
            {SCORING_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={submitting}
            startIcon={<GroupAddOutlinedIcon />}
            sx={{ ...btnSx, mt: 1 }}
          >
            {submitting ? "Creating…" : "Create league"}
          </Button>
        </Box>
      </Box>
    </PageLayout>
  );
}
