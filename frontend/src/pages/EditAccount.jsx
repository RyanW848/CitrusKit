import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  Box,
  TextField,
  Button,
  InputAdornment,
  Avatar,
  Alert,
} from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PageLayout from "../components/PageLayout";
import ClearAdornment from "../components/ClearAdornment";
import { inputSx, errorInputSx, btnSx } from "../styles/formStyles";

export default function EditAccount() {
  const { user, updateAccount } = useContext(AuthContext);
  const [username, setUsername] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [touched, setTouched] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUsername(user?.name ?? "");
    setEmail(user?.email ?? "");
  }, [user]);

  const passwordStarted = password !== "" || passwordAgain !== "";
  const passwordMismatch = passwordStarted && password !== passwordAgain;
  const showPasswordMismatch = touched && passwordMismatch;

  const usernameInputSx = usernameError
    ? {
        ...errorInputSx,
        "& .MuiInputLabel-root": {
          ...errorInputSx["& .MuiInputLabel-root"],
          backgroundColor: "#fef0e8",
        },
      }
    : inputSx;

  const handleSave = async () => {
    setUsernameError("");
    setError("");
    setSuccess("");

    if (!username.trim()) {
      setUsernameError("Username is required");
      return;
    }

    if (passwordMismatch) {
      setTouched(true);
      return;
    }

    setSaving(true);

    try {
      await updateAccount({
        name: username.trim(),
        email: email.trim(),
        password: password || undefined,
      });
      setPassword("");
      setPasswordAgain("");
      setTouched(false);
      setSuccess("Account updated");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout title="Edit Account" subtitle="Change your account information">
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Box
          sx={{
            bgcolor: "#fef0e8",
            border: "1px solid #e5d5c8",
            borderRadius: "14px",
            p: "32px 48px 40px",
            width: "100%",
            maxWidth: 460,
          }}
        >
          {/* Avatar with edit indicator */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <Box sx={{ position: "relative" }}>
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: "#f4c9b3",
                  color: "#5a3e35",
                }}
              />
              <EditOutlinedIcon
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: -4,
                  fontSize: 18,
                  color: "#6d5a57",
                  bgcolor: "#fef0e8",
                  borderRadius: "50%",
                  p: "2px",
                }}
              />
            </Box>
          </Box>

          {/* Username */}
          <TextField
            fullWidth
            label="Username"
            variant="outlined"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setUsernameError(""); }}
            error={Boolean(usernameError)}
            helperText={usernameError}
            sx={usernameInputSx}
            InputProps={{
              endAdornment: usernameError ? (
                <InputAdornment position="end">
                  <ErrorIcon sx={{ fontSize: 22, color: "#c0392b" }} />
                </InputAdornment>
              ) : (
                <ClearAdornment value={username} onClear={() => setUsername("")} />
              ),
            }}
          />

          {/* Email */}
          <TextField
            fullWidth
            label="Email"
            type="email"
            variant="outlined"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            sx={inputSx}
            InputProps={{
              endAdornment: <ClearAdornment value={email} onClear={() => setEmail("")} />,
            }}
          />

          {/* Password */}
          <TextField
            fullWidth
            label="Password"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setSuccess(""); }}
            sx={inputSx}
            InputProps={{
              endAdornment: <ClearAdornment value={password} onClear={() => setPassword("")} />,
            }}
          />

          {/* Password Again */}
          <TextField
            fullWidth
            label="Password, Again"
            type="password"
            variant="outlined"
            value={passwordAgain}
            onChange={(e) => { setPasswordAgain(e.target.value); setTouched(true); setSuccess(""); }}
            error={showPasswordMismatch}
            helperText={showPasswordMismatch ? "Passwords must match" : ""}
            sx={showPasswordMismatch ? errorInputSx : inputSx}
            InputProps={{
              endAdornment: showPasswordMismatch ? (
                <InputAdornment position="end">
                  <ErrorIcon sx={{ fontSize: 22, color: "#c0392b" }} />
                </InputAdornment>
              ) : (
                <ClearAdornment value={passwordAgain} onClear={() => setPasswordAgain("")} />
              ),
            }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: "8px" }}>
              {success}
            </Alert>
          )}

          <Button
            fullWidth
            variant="contained"
            startIcon={<EditOutlinedIcon />}
            sx={{ ...btnSx, mt: 1 }}
            onClick={handleSave}
            disabled={!username.trim() || !email.trim() || passwordMismatch || saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </Box>
    </PageLayout>
  );
}
