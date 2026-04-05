import { useParams } from "react-router-dom";
import { Alert, Box, CircularProgress } from "@mui/material";
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import OwnerRosterPanel from "../components/OwnerRosterPanel";
import CitrusFab from "../components/CitrusFab";
import { getMockRoster } from "./draftMockData";
import useLeague, { formatLeagueOwners } from "../hooks/useLeague";

export default function DraftDraft() {
  const { id } = useParams();
  const { league, isLoading, error } = useLeague(id);
  const owners = formatLeagueOwners(league);

  return (
    <PageLayout title="Draft" subtitle={league ? `${league.name} live draft` : "Follow along with your league's draft"} showBell>
      {isLoading ? (
        <Box sx={{ minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress size={28} sx={{ color: "#8c7672" }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: "10px" }}>{error}</Alert>
      ) : (
        <OwnerRosterPanel owners={owners} getRoster={getMockRoster} />
      )}
      <DraftTabBar activeTab="draft" draftId={id} />

      {/* Dollar-sign FAB for bid/draft action */}
      <CitrusFab
        icon={<span style={{ fontWeight: 700, fontSize: "1.1rem" }}>$</span>}
        sx={{ position: "fixed", bottom: 24, right: 24 }}
      />
    </PageLayout>
  );
}
