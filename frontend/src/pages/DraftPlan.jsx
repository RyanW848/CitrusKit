import { useParams } from "react-router-dom";
import { Alert, Box, CircularProgress } from "@mui/material";
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import OwnerRosterPanel from "../components/OwnerRosterPanel";
import { getMockRoster } from "./draftMockData";
import useLeague, { formatLeagueOwners } from "../hooks/useLeague";

export default function DraftPlan() {
  const { id } = useParams();
  const { league, isLoading, error } = useLeague(id);
  const owners = formatLeagueOwners(league);

  return (
    <PageLayout title="Plan" subtitle={league ? `Plan for ${league.name}` : "Plan your team"} showBell>
      {isLoading ? (
        <Box sx={{ minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress size={28} sx={{ color: "#8c7672" }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: "10px" }}>{error}</Alert>
      ) : (
        <OwnerRosterPanel owners={owners} getRoster={getMockRoster} />
      )}
      <DraftTabBar activeTab="plan" draftId={id} />
    </PageLayout>
  );
}
