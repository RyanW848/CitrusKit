import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
} from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ErrorIcon from "@mui/icons-material/Error";

export default function CreateAccount({ onBack }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [touched, setTouched] = useState(false);

  const passwordMismatch = touched && passwordAgain !== "" && password !== passwordAgain;

  // Consistent with the Sign In styling
  const inputSx = {
    mb: 3,
    "& .MuiOutlinedInput-root": {
      backgroundColor: "transparent",
      borderRadius: "8px",
      "& fieldset": { 
        borderColor: "#A08985", 
        borderWidth: "1px" 
      },
      "&:hover fieldset": { borderColor: "#8c7672" },
      "&.Mui-focused fieldset": { borderColor: "#8c7672" },
    },
    "& .MuiInputLabel-root": {
      color: "#6d5a57",
      backgroundColor: "#fef0e8", // Matches the card background
      padding: "0 4px",
      "&.Mui-focused": { color: "#8c7672" },
    },
    "& .MuiOutlinedInput-input": {
      padding: "16px", // Keeps the tall look from the image
    }
  };

  const errorInputSx = {
    ...inputSx,
    "& .MuiOutlinedInput-root": {
      ...inputSx["& .MuiOutlinedInput-root"],
      "& fieldset": { borderColor: "#c0392b" },
      "&:hover fieldset": { borderColor: "#c0392b" },
      "&.Mui-focused fieldset": { borderColor: "#c0392b" },
    },
    "& .MuiInputLabel-root": {
      ...inputSx["& .MuiInputLabel-root"],
      color: "#c0392b",
      "&.Mui-focused": { color: "#c0392b" },
    },
    "& .MuiFormHelperText-root": {
      color: "#c0392b",
      fontWeight: 500,
    },
  };

  const ClearAdornment = ({ value, onClear }) =>
    value ? (
      <InputAdornment position="end">
        <IconButton size="small" onClick={onClear} edge="end">
          <CancelOutlinedIcon sx={{ fontSize: 22, color: "#6d5a57" }} />
        </IconButton>
      </InputAdornment>
    ) : null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#fdf6f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Outfit', sans-serif",
        px: 3,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 860 }}>
        {/* Top bar */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
          <AccountCircleOutlinedIcon sx={{ color: "#555", fontSize: 28 }} />
          <SettingsOutlinedIcon sx={{ color: "#555", fontSize: 24 }} />
        </Box>

        {/* Title */}
        <Typography sx={{ fontSize: "2rem", fontWeight: 700, color: "#1a1a1a", mb: 0.5 }}>
          Create Account
        </Typography>
        <Typography sx={{ fontSize: "0.88rem", color: "#666", mb: 4 }}>
          Create an account for Citrus Kit
        </Typography>

        {/* Centered card */}
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Box
            sx={{
              backgroundColor: "#fef0e8",
              border: "1px solid #e5d5c8",
              borderRadius: "14px",
              p: "40px 48px",
              width: "100%",
              maxWidth: 460,
            }}
          >
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={inputSx}
              InputProps={{
                endAdornment: <ClearAdornment value={username} onClear={() => setUsername("")} />,
              }}
            />

            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={inputSx}
              InputProps={{
                endAdornment: <ClearAdornment value={email} onClear={() => setEmail("")} />,
              }}
            />

            <TextField
              fullWidth
              label="Password"
              variant="outlined"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={inputSx}
              InputProps={{
                endAdornment: <ClearAdornment value={password} onClear={() => setPassword("")} />,
              }}
            />

            <TextField
              fullWidth
              label="Password, Again"
              variant="outlined"
              placeholder="Password, Again"
              type="password"
              value={passwordAgain}
              onChange={(e) => {
                setPasswordAgain(e.target.value);
                setTouched(true);
              }}
              error={passwordMismatch}
              helperText={passwordMismatch ? "Passwords must match" : ""}
              sx={passwordMismatch ? errorInputSx : inputSx}
              InputProps={{
                endAdornment: passwordMismatch ? (
                  <InputAdornment position="end">
                    <ErrorIcon sx={{ fontSize: 22, color: "#c0392b" }} />
                  </InputAdornment>
                ) : (
                  <ClearAdornment value={passwordAgain} onClear={() => setPasswordAgain("")} />
                ),
              }}
            />

            <Button
              fullWidth
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              sx={{
                backgroundColor: "#f4c9b3",
                color: "#1a1a1a",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
                borderRadius: "10px",
                padding: "12px 20px",
                boxShadow: "none",
                mt: 1,
                "&:hover": { backgroundColor: "#eeb89e", boxShadow: "none" },
              }}
            >
              Create Account
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}