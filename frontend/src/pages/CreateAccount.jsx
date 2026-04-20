import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Box, TextField, Button, InputAdornment, Alert } from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ErrorIcon from "@mui/icons-material/Error";
import ClearAdornment from "../components/ClearAdornment";
import PageLayout from "../components/PageLayout";
import { inputSx, errorInputSx, btnSx } from "../styles/formStyles";

export default function CreateAccount() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");

  const passwordMismatch = touched && passwordAgain !== "" && password !== passwordAgain;

  return (
    <PageLayout
      title="Create Account"
      subtitle="Create an account for Citrus Kit"
      showHome={false}
    >
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
            label="Name"
            variant="outlined"
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
            type="email"
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
            type="password"
            variant="outlined"
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
            type="password"
            variant="outlined"
            value={passwordAgain}
            onChange={(e) => { setPasswordAgain(e.target.value); setTouched(true); }}
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

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            sx={{ ...btnSx, mt: 1 }}
            onClick={async () => {
              setError("");
              try {
                await register(username, email, password);
                navigate("/home");
              } catch (err) {
                setError(err.message);
              }
            }}
            disabled={!username || !email || !password || passwordMismatch}
          >
            Create Account
          </Button>
        </Box>
      </Box>
    </PageLayout>
  );
}
