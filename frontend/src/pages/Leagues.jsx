import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PageLayout from "../components/PageLayout";
import CitrusFab from "../components/CitrusFab";
import SearchBar from "../components/SearchBar";
import LeagueRowList from "../components/LeagueRowList";
import { useMyLeagues } from "../hooks/useMyLeagues";
import { filterLeaguesByName, leagueToRowShape } from "../utils/leagueDisplay";

export default function Leagues() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { leagues, loading, error } = useMyLeagues();

  const rowLeagues = useMemo(
    () => leagues.map(leagueToRowShape),
    [leagues]
  );

  const filtered = useMemo(
    () => filterLeaguesByName(rowLeagues, query),
    [rowLeagues, query]
  );

  return (
    <PageLayout
      title="Leagues"
      subtitle="View all of your saved leagues"
      showBell
    >
      <Box sx={{ position: "relative" }}>
        <SearchBar
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery("")}
          placeholder="Search leagues"
          disabled={loading}
        />
        {error && (
          <Typography variant="body2" sx={{ color: "#a94442", mb: 1 }}>
            {error}
          </Typography>
        )}
        <LeagueRowList
          leagues={filtered}
          onLeagueClick={(id) => navigate(`/draft/${id}/rules`)}
          loading={loading}
          emptyMessage={
            query.trim() ? "No leagues match your search." : "No leagues yet."
          }
        />

        <CitrusFab
          icon={<AddIcon />}
          onClick={() => navigate("/create-league")}
          sx={{ position: "fixed", bottom: 24, right: 24 }}
        />
      </Box>
    </PageLayout>
  );
}
