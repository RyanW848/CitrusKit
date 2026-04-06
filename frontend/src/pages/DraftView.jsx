import { useParams } from "react-router-dom";
import { Alert, Box, CircularProgress } from "@mui/material";
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import OwnerRosterPanel from "../components/OwnerRosterPanel";
import { getMockRoster } from "./draftMockData";
import useLeague, { formatLeagueOwners } from "../hooks/useLeague";

const COMPLETE_ROSTER = (ownerId) => {
  const slots = getMockRoster(ownerId);
  return slots.map((slot) =>
    slot.playerName ? slot : { ...slot, playerName: "Baseball Guy 3", price: 15, stat: "S1" }
  );
};

export default function DraftView() {
  const { id } = useParams();
  const { league, isLoading, error } = useLeague(id);
  const owners = formatLeagueOwners(league);

  return (
    <PageLayout title="View" subtitle={league ? `${league.name} final view` : "View your finished league"} showBell>
      {isLoading ? (
        <Box sx={{ minHeight: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress size={28} sx={{ color: "#8c7672" }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: "10px" }}>{error}</Alert>
      ) : (
        <OwnerRosterPanel owners={owners} getRoster={COMPLETE_ROSTER} />
      )}
      <DraftTabBar activeTab="view" draftId={id} />
    </PageLayout>
  );
}
