import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../context/AuthContext";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Card,
  Fab,
  Container,
  Menu,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const leagues = [
    { id: 1, name: "Super Cool Baseball Draft", date: "January 1, 1970", initial: "S" },
    { id: 2, name: "Other Baseball Draft", date: "December 31, 1969", initial: "A" },
  ];

  return (
    <Box sx={{ 
      height: "100vh", // Force exactly one screen height
      width: "100vw",
      backgroundColor: "#fdf6f0", 
      display: "flex",
      flexDirection: "column",
      overflow: "hidden", // No scrollbars on the main body
      position: "relative" 
    }}>
      <Container 
        maxWidth="md" 
        sx={{ 
          height: "100%", 
          display: "flex", 
          flexDirection: "column", 
          py: 3 
        }}
      >
        {/* 1. TOP NAV (Fixed) */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <AccountCircleOutlinedIcon sx={{ color: "#1a1a1a", fontSize: 32 }} />
          <Box>
            <IconButton size="small" sx={{ mr: 1 }}><NotificationsNoneOutlinedIcon /></IconButton>
            <IconButton size="small" onClick={(e) => setSettingsAnchor(e.currentTarget)}>
              <SettingsOutlinedIcon />
            </IconButton>
          </Box>
        </Box>

        <Menu
          anchorEl={settingsAnchor}
          open={Boolean(settingsAnchor)}
          onClose={() => setSettingsAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={() => { setSettingsAnchor(null); navigate("/edit-user"); }}>
            <ListItemIcon><EditOutlinedIcon fontSize="small" /></ListItemIcon>
            Edit User
          </MenuItem>
          <MenuItem onClick={() => { setSettingsAnchor(null); logout(); navigate("/"); }}>
            <ListItemIcon><LogoutOutlinedIcon fontSize="small" /></ListItemIcon>
            Logout
          </MenuItem>
        </Menu>

        {/* 2. HEADER (Fixed) */}
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Home</Typography>
        <Typography variant="body2" sx={{ color: "#666", mb: 3 }}>Welcome Back, {user?.name}!</Typography>

        {/* 3. SCROLLABLE AREA (The middle that fits) */}
        <Box sx={{ flexGrow: 1, overflowY: "auto", pr: 1 }}>
          
          {/* Leagues Section */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Saved Leagues</Typography>
                <ChevronRightIcon />
            </Box>
            {leagues.map((league) => (
              <Box key={league.id} sx={{
                display: "flex", alignItems: "center", bgcolor: "#fef0e8",
                border: "1px solid #e5d5c8", borderRadius: "12px", p: 1.5, mb: 1
              }}>
                <Avatar sx={{ bgcolor: "#f4c9b3", mr: 2 }}>{league.initial}</Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{league.name}</Typography>
                  <Typography variant="caption" sx={{ color: "#888" }}>Last Edited: {league.date}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Players Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Saved Players</Typography>
                <ChevronRightIcon />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
                <Card sx={{ width: 240, height: 140, bgcolor: "#fef0e8", borderRadius: "20px", boxShadow: 0, border: "1px solid #e5d5c8" }} />
                <Card sx={{ width: 60, height: 140, bgcolor: "#fef0e8", borderRadius: "20px", boxShadow: 0, border: "1px solid #e5d5c8" }} />
            </Box>
          </Box>
        </Box>

        {/* 4. FAB (Fixed) */}
        <Fab 
          sx={{ position: "absolute", bottom: 24, right: 24, bgcolor: "#f4c9b3" }}
        >
          <AddIcon />
        </Fab>
      </Container>
    </Box>
  );
};

export default Home;