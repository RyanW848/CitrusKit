import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
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
import DesktopAccessDisabledOutlinedIcon from "@mui/icons-material/DesktopAccessDisabledOutlined";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);

  const onCreateAccount = () => {
    navigate("/create-account");
  };

  const goHome = () => {
    navigate("/home");
  }

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
      backgroundColor: "#fef0e8",
      padding: "0 4px",
      "&.Mui-focused": { color: "#8c7672" },
    },
    "& .MuiOutlinedInput-input": {
        padding: "16px", 
    }
  };

  const btnSx = {
    backgroundColor: "#f4c9b3",
    color: "#1a1a1a",
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.95rem",
    borderRadius: "10px",
    padding: "12px 20px",
    boxShadow: "none",
    "&:hover": { backgroundColor: "#eeb89e", boxShadow: "none" },
  };

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
          Sign In
        </Typography>
        <Typography sx={{ fontSize: "0.88rem", color: "#666", mb: 4 }}>
          Login to Citrus Kit using your email and password
        </Typography>

        {/* Two-panel card */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            border: "1px solid #e5d5c8",
            borderRadius: "14px",
            overflow: "hidden",
            backgroundColor: "#fef0e8", // Warm panel background from your image
          }}
        >
          {/* Left — Have an Account */}
          <Box sx={{ p: "40px", borderRight: "1px solid #e5d5c8" }}>
            <Typography sx={{ fontWeight: 600, textAlign: "center", mb: 4, color: "#1a1a1a" }}>
              Have an Account?
            </Typography>

            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={inputSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setEmail("")} edge="end">
                      <CancelOutlinedIcon sx={{ fontSize: 22, color: "#6d5a57" }} />
                    </IconButton>
                  </InputAdornment>
                ),
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
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setPassword("")} edge="end">
                      <CancelOutlinedIcon sx={{ fontSize: 22, color: "#6d5a57" }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button 
                fullWidth 
                variant="contained" 
                startIcon={<AccountCircleOutlinedIcon />} 
                sx={btnSx}
                onClick={async () => {
                setError("");
                try {
                  await login(email, password);
                  navigate("/home");
                } catch (err) {
                  setError(err.message);
                }
              }}
              disabled={!email || !password}
            >
              Sign In
            </Button>
          </Box>

          {/* Right — New to Citrus Kit */}
          <Box
            sx={{
              p: "40px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <Typography sx={{ fontWeight: 600, textAlign: "center", mb: 1, color: "#1a1a1a" }}>
              New to Citrus Kit?
            </Typography>

            <Button
              fullWidth
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              sx={btnSx}
              onClick={onCreateAccount}
            >
              Create Account
            </Button>

            <Button
              fullWidth
              variant="contained"
              startIcon={<DesktopAccessDisabledOutlinedIcon />}
              sx={btnSx}
              onClick={goHome}
            >
              Continue As Guest
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}