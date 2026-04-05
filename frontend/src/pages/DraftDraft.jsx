import { useParams } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import PageLayout from "../components/PageLayout";
import DraftTabBar from "../components/DraftTabBar";
import OwnerRosterPanel from "../components/OwnerRosterPanel";
import CitrusFab from "../components/CitrusFab";
import { MOCK_OWNERS, getMockRoster } from "./draftMockData";

export default function DraftDraft() {
  const { id } = useParams();
  return (
    <PageLayout title="Draft" subtitle="Follow along with your league's draft" showBell>
      <OwnerRosterPanel owners={MOCK_OWNERS} getRoster={getMockRoster} />
      <DraftTabBar activeTab="draft" draftId={id} />

      {/* Dollar-sign FAB for bid/draft action */}
      <CitrusFab
        icon={<span style={{ fontWeight: 700, fontSize: "1.1rem" }}>$</span>}
        sx={{ position: "fixed", bottom: 24, right: 24 }}
      />
    </PageLayout>
  );
}
