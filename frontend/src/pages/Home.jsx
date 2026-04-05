import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Box, Typography, Menu, MenuItem, ListItemIcon, Card } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PageLayout from "../components/PageLayout";
import CitrusFab from "../components/CitrusFab";
import SectionLinkHeader from "../components/SectionLinkHeader";
import SearchBar from "../components/SearchBar";
import LeagueRowList from "../components/LeagueRowList";
import ActivityFeed from "../components/ActivityFeed";
import { useMyLeagues } from "../hooks/useMyLeagues";
import {
  filterLeaguesByName,
  leagueToRowShape,
  leaguesToActivityFeedItems,
} from "../utils/leagueDisplay";

export default function Home() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [leagueSearch, setLeagueSearch] = useState("");
  const { leagues, loading, error } = useMyLeagues();

  const rowLeagues = useMemo(
    () => leagues.map(leagueToRowShape),
    [leagues]
  );

  const filteredRows = useMemo(
    () => filterLeaguesByName(rowLeagues, leagueSearch),
    [rowLeagues, leagueSearch]
  );

  const activityFeedItems = useMemo(
    () => leaguesToActivityFeedItems(leagues, { limit: 5 }),
    [leagues]
  );

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

      <Box sx={{ mb: 4 }}>
        <ActivityFeed
          title="Recent activity"
          items={loading || error ? [] : activityFeedItems}
          emptyMessage="Save a league to see it show up here."
        />
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
