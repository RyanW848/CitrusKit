import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Typography, Button, CircularProgress, Alert,
} from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { btnSx } from "../styles/formStyles";
import { seedTestLeague } from "../api/leaguesApi";

const CHECKPOINTS = [
    { value: 0,   label: "Before Draft",    description: "Empty league, no picks" },
    { value: 10,  label: "After 10 Picks",  description: "Early draft" },
    { value: 50,  label: "After 50 Picks",  description: "Mid draft" },
    { value: 100, label: "After 100 Picks", description: "Late draft" },
    { value: 130, label: "After 130 Picks", description: "Near-complete draft" },
];

export default function Test() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    async function handleSeed(checkpoint) {
        setLoading(checkpoint);
        setResult(null);
        setError(null);
        try {
            const data = await seedTestLeague(checkpoint);
            setResult(data);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to seed test league");
        } finally {
            setLoading(null);
        }
    }

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
                    Test Page
                </Typography>
                <Typography sx={{ fontSize: "0.88rem", color: "#666", mb: 4 }}>
                    Page for me to test buttons and other UI elements
                </Typography>

                {/* Test Button */}
                <Button
                    variant="contained" sx={{ ...btnSx, mb: 5 }}
                    onClick={async () => {
                        // See if player view pop up works
                    }}>
                    Test Button
                </Button>

                {/* Draft Seed Section */}
                <Typography sx={{ fontSize: "1.2rem", fontWeight: 700, color: "#1a1a1a", mb: 0.5 }}>
                    2026 Test Draft
                </Typography>
                <Typography sx={{ fontSize: "0.88rem", color: "#666", mb: 2.5 }}>
                    Load the 2026 draft fixture at a snapshot point. Replaces any existing "2026 Test Draft" league for your account.
                </Typography>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
                    {CHECKPOINTS.map(({ value, label, description }) => (
                        <Box
                            key={value}
                            sx={{
                                border: "1px solid #e0d8d0",
                                borderRadius: 2,
                                p: 2,
                                minWidth: 160,
                                backgroundColor: "#fff",
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                            }}
                        >
                            <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", color: "#1a1a1a" }}>
                                {label}
                            </Typography>
                            <Typography sx={{ fontSize: "0.8rem", color: "#888" }}>
                                {description}
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                disabled={loading !== null}
                                onClick={() => handleSeed(value)}
                                sx={{ mt: 0.5, textTransform: "none", borderColor: "#c8b8a2", color: "#5a3e2b" }}
                            >
                                {loading === value
                                    ? <CircularProgress size={16} sx={{ color: "#5a3e2b" }} />
                                    : "Load"}
                            </Button>
                        </Box>
                    ))}
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                )}

                {result && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                        <Alert severity="success" sx={{ flex: 1 }}>
                            Loaded {result.picksLoaded} picks into league <code>{result.leagueId}</code>
                        </Alert>
                        <Button
                            variant="contained"
                            sx={btnSx}
                            onClick={() => navigate(`/leagues/${result.leagueId}/draft`)}
                        >
                            Open Draft
                        </Button>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
