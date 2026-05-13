import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Box, Card, CardContent, Menu, MenuItem, ListItemIcon, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PageLayout from "../components/PageLayout";
import LeagueRow from "../components/LeagueRow";
import CitrusFab from "../components/CitrusFab";
import client from "../api/citrusClient";
import { deleteLeague } from "../api/leaguesApi";
import useNotes from "../hooks/useNotes";

export default function Home() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [leagueError, setLeagueError] = useState("");
  const { notes, load: loadNotes } = useNotes();

  useEffect(() => {
    if (user) loadNotes();
  }, [user, loadNotes]);

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
      //showBell
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
            onDelete={async (id) => {
              await deleteLeague(id);
              setLeagues((prev) => prev.filter((l) => l.id !== id));
            }}
          />
        ))}
      </Box>

      {/* Saved Players */}
      <Box>
        <Box
          sx={{ display: "flex", alignItems: "center", mb: 1.5, cursor: "pointer" }}
          onClick={() => navigate("/saved-players")}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Saved Players
          </Typography>
          <ChevronRightIcon sx={{ color: "#555" }} />
        </Box>

        {user && notes.length === 0 && (
          <Typography variant="body2" sx={{ color: "#666" }}>
            No saved players yet. Add notes to players during drafting.
          </Typography>
        )}

        {notes.length > 0 && (
          <Box
            sx={{
              display: "flex",
              gap: 2,
              overflowX: "auto",
              pb: 1,
              "&::-webkit-scrollbar": { height: 6 },
              "&::-webkit-scrollbar-thumb": { bgcolor: "#e5d5c8", borderRadius: 3 },
            }}
          >
            {notes.map((n) => (
              <Card
                key={n.id}
                onClick={() => navigate("/saved-players")}
                sx={{
                  minWidth: 200,
                  maxWidth: 240,
                  flexShrink: 0,
                  bgcolor: "#fef0e8",
                  borderRadius: "16px",
                  boxShadow: 0,
                  border: "1px solid #e5d5c8",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "#fde8d6" },
                }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      color: "#3f332f",
                      mb: 0.75,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {n.playerName}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.82rem",
                      color: "#6d5a57",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {n.note || "No note"}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      <CitrusFab
        icon={<AddIcon />}
        onClick={() => navigate("/create-league")}
        sx={{ position: "fixed", bottom: 24, right: 24 }}
      />
    </PageLayout>
  );
}