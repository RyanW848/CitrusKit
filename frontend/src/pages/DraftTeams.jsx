import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import OwnerRosterPanel from "../components/OwnerRosterPanel";
import { MOCK_OWNERS, getMockRoster } from "./draftMockData";

export default function DraftTeams() {
  const { id } = useParams();
  return (
    <PageLayout title="Teams" subtitle="Pre-input team data" showBell>
      <OwnerRosterPanel owners={MOCK_OWNERS} getRoster={getMockRoster} />
      <DraftTabBar activeTab="teams" draftId={id} />
    </PageLayout>
  );
}
