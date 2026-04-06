import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Box, Typography, Menu, MenuItem, ListItemIcon, Card } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PageLayout from "../components/PageLayout";
import CitrusFab from "../components/CitrusFab";
import client from "../api/citrusClient";

export default function Home() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [leagueError, setLeagueError] = useState("");

  useEffect(() => {
    if (!user) {
      setLeagues([]);
      return;
    }

    let isMounted = true;

    client.get("/leagues")
      .then(({ data }) => {
        if (isMounted) {
          setLeagues(data.leagues);
          setLeagueError("");
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLeagueError(err.response?.data?.error || "Unable to load leagues");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

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
      <Box sx={{ mb: 4 }}>
        <SectionLinkHeader
          title="Saved Leagues"
          onClick={() => navigate("/leagues")}
        />
        <SearchBar
          value={leagueSearch}
          onChange={(e) => setLeagueSearch(e.target.value)}
          onClear={() => setLeagueSearch("")}
          placeholder="Search saved leagues"
          disabled={loading}
        />
        {error && (
          <Typography variant="body2" sx={{ color: "#a94442", mb: 1 }}>
            {error}
          </Typography>
        )}
        <LeagueRowList
          leagues={filteredRows}
          onLeagueClick={(id) => navigate(`/draft/${id}/rules`)}
          loading={loading}
          emptyMessage={
            leagueSearch.trim() ? "No leagues match your search." : "No leagues yet."
          }
        />
      </Box>

        {leagueError && (
          <Typography variant="body2" sx={{ color: "#c0392b", mb: 1.5 }}>
            {leagueError}
          </Typography>
        )}

        {!leagueError && leagues.length === 0 && (
          <Typography variant="body2" sx={{ color: "#666", mb: 1.5 }}>
            {user ? "No leagues yet. Create one to get started." : "Sign in to see your leagues."}
          </Typography>
        )}

        {leagues.slice(0, 3).map((league) => (
          <LeagueRow
            key={league.id}
            league={league}
            onClick={() => navigate(`/draft/${league.id}/rules`)}
          />
        ))}
      </Box>

      <Box>
        <SectionLinkHeader title="Saved Players" showChevron />
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
