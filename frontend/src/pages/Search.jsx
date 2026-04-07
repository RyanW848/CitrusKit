import PageLayout from "../components/PageLayout";
import PlayerSearch from "../components/PlayerSearch";

export default function Search() {
    return (
        <PageLayout title="Search" subtitle="Search for a player">
            <PlayerSearch />
        </PageLayout>
    )
}