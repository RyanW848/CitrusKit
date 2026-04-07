import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import OwnerRosterPanel from "../components/OwnerRosterPanel";
import { MOCK_OWNERS, getMockRoster } from "./draftMockData";

export default function DraftPlan() {
  const { id } = useParams();
  return (
    <PageLayout title="Plan" subtitle="Plan your team" showBell>
      <OwnerRosterPanel owners={MOCK_OWNERS} getRoster={getMockRoster} />
      <DraftTabBar activeTab="plan" draftId={id} />
    </PageLayout>
  );
}
