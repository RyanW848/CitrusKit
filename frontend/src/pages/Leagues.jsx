import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PageLayout from "../components/PageLayout";
import LeagueRow from "../components/LeagueRow";
import CitrusFab from "../components/CitrusFab";

const MOCK_LEAGUES = [
  { id: "1", name: "Super Cool Baseball Draft", lastEdited: "January 1, 1970" },
  { id: "2", name: "Other Baseball Draft", lastEdited: "December 31, 1969" },
];

export default function Leagues() {
  const navigate = useNavigate();

  return (
    <PageLayout
      title="Leagues"
      subtitle="View all of your saved leagues"
      showBell
    >
      <Box sx={{ position: "relative" }}>
        {MOCK_LEAGUES.map((league) => (
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
