import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Box, Typography, Menu, MenuItem, ListItemIcon, Card } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PageLayout from "../components/PageLayout";
import LeagueRow from "../components/LeagueRow";
import CitrusFab from "../components/CitrusFab";

const MOCK_LEAGUES = [
  { id: "1", name: "Super Cool Baseball Draft", lastEdited: "January 1, 1970" },
  { id: "2", name: "Other Baseball Draft", lastEdited: "December 31, 1969" },
];

export default function Home() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [settingsAnchor, setSettingsAnchor] = useState(null);

  return (
    <PageLayout
      title="Home"
      subtitle={`Welcome Back, ${user?.name ?? "Guest"}!`}
      showBell
      onSettingsClick={(e) => setSettingsAnchor(e.currentTarget)}
      settingsMenu={
        <Menu
          anchorEl={settingsAnchor}
          open={Boolean(settingsAnchor)}
          onClose={() => setSettingsAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem
            onClick={() => {
              setSettingsAnchor(null);
              navigate("/edit-account");
            }}
          >
            <ListItemIcon><EditOutlinedIcon fontSize="small" /></ListItemIcon>
            Edit Account
          </MenuItem>
          <MenuItem
            onClick={() => {
              setSettingsAnchor(null);
              logout();
              navigate("/");
            }}
          >
            <ListItemIcon><LogoutOutlinedIcon fontSize="small" /></ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      }
    >
      {/* Saved Leagues */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{ display: "flex", alignItems: "center", mb: 1.5, cursor: "pointer" }}
          onClick={() => navigate("/leagues")}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Saved Leagues
          </Typography>
          <ChevronRightIcon sx={{ color: "#555" }} />
        </Box>

        {MOCK_LEAGUES.map((league) => (
          <LeagueRow
            key={league.id}
            league={league}
            onClick={() => navigate(`/draft/${league.id}/rules`)}
          />
        ))}
      </Box>

      {/* Saved Players */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Saved Players
          </Typography>
          <ChevronRightIcon sx={{ color: "#555" }} />
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Card
            sx={{
              width: 240,
              height: 140,
              bgcolor: "#fef0e8",
              borderRadius: "20px",
              boxShadow: 0,
              border: "1px solid #e5d5c8",
            }}
          />
          <Card
            sx={{
              width: 60,
              height: 140,
              bgcolor: "#fef0e8",
              borderRadius: "20px",
              boxShadow: 0,
              border: "1px solid #e5d5c8",
            }}
          />
        </Box>
      </Box>

      <CitrusFab
        icon={<AddIcon />}
        onClick={() => navigate("/create-league")}
        sx={{ position: "fixed", bottom: 24, right: 24 }}
      />
    </PageLayout>
  );
}
