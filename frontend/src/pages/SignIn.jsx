import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Box, Typography, TextField, Button } from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DesktopAccessDisabledOutlinedIcon from "@mui/icons-material/DesktopAccessDisabledOutlined";
import ClearAdornment from "../components/ClearAdornment";
import { inputSx, btnSx } from "../styles/formStyles";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/home");
  }, [user]);

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
          Login to Citrus Kit using your username and password
        </Typography>

        {/* Two-panel card */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            border: "1px solid #e5d5c8",
            borderRadius: "14px",
            overflow: "hidden",
            backgroundColor: "#fef0e8",
          }}
        >
          {/* Left — Have an Account */}
          <Box sx={{ p: "40px", borderRight: "1px solid #e5d5c8" }}>
            <Typography sx={{ fontWeight: 600, textAlign: "center", mb: 4, color: "#1a1a1a" }}>
              Have an Account?
            </Typography>

            <TextField
              fullWidth
              label="Username"
              variant="outlined"
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={inputSx}
              InputProps={{
                endAdornment: <ClearAdornment value={password} onClear={() => setPassword("")} />,
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

            {error && (
              <Typography sx={{ color: "#c0392b", fontSize: "0.85rem", mt: 1, textAlign: "center" }}>
                {error}
              </Typography>
            )}
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
              onClick={() => navigate("/create-account")}
            >
              Create Account
            </Button>

            <Button
              fullWidth
              variant="contained"
              startIcon={<DesktopAccessDisabledOutlinedIcon />}
              sx={btnSx}
              onClick={() => navigate("/home")}
            >
              Continue As Guest
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
