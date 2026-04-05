import { useParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import OwnerRosterPanel from "../components/OwnerRosterPanel";
import { MOCK_OWNERS, getMockRoster } from "./draftMockData";

const COMPLETE_ROSTER = (ownerId) => {
  const slots = getMockRoster(ownerId);
  return slots.map((slot) =>
    slot.playerName ? slot : { ...slot, playerName: "Baseball Guy 3", price: 15, stat: "S1" }
  );
};

export default function DraftView() {
  const { id } = useParams();
  return (
    <PageLayout title="View" subtitle="View your finished league" showBell>
      <OwnerRosterPanel owners={MOCK_OWNERS} getRoster={COMPLETE_ROSTER} />
      <DraftTabBar activeTab="view" draftId={id} />
    </PageLayout>
  );
}
