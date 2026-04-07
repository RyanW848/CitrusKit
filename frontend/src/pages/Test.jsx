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
                    Test Page
                </Typography>
                <Typography sx={{ fontSize: "0.88rem", color: "#666", mb: 4 }}>
                    Page for me to test buttons and other UI elements
                </Typography>

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
                    <Box sx={{ p: "40px", borderRight: "1px solid #e5d5c8" }}>
                        <Typography sx={{ fontWeight: 600, textAlign: "center", mb: 4, color: "#1a1a1a" }}>
                            Test Button
                        </Typography>
                        <Button
                            variant="contained" sx={btnSx}
                            onClick={async () => {
                                // See if player view pop up works
                            }}>
                            Test Button
                        </Button>
                    </Box>

                </Box>
            </Box>
        </Box>
    );
}
