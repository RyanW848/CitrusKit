import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PageLayout from "../components/PageLayout";
import CitrusFab from "../components/CitrusFab";
import { AuthContext } from "../context/AuthContext";
import client from "../api/citrusClient";

export default function Leagues() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState([]);
  const [error, setError] = useState("");

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
          setError("");
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.error || "Unable to load leagues");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <PageLayout
      title="Leagues"
      subtitle="View all of your saved leagues"
      showBell
    >
      <Box sx={{ position: "relative" }}>
        {error && (
          <Typography variant="body2" sx={{ color: "#c0392b", mb: 1.5 }}>
            {error}
          </Typography>
        )}

        {!error && leagues.length === 0 && (
          <Typography variant="body2" sx={{ color: "#666", mb: 1.5 }}>
            {user ? "No saved leagues yet." : "Sign in to view your saved leagues."}
          </Typography>
        )}

        {leagues.map((league) => (
          <LeagueRow
            key={league.id}
            league={league}
            onClick={() => navigate(`/draft/${league.id}/rules`)}
          />
        ))}

        <CitrusFab
          icon={<AddIcon />}
          onClick={() => navigate("/create-league")}
          sx={{ position: "fixed", bottom: 24, right: 24 }}
        />
      </Box>
    </PageLayout>
  );
}
