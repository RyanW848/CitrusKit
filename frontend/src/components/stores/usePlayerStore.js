import { create } from 'zustand';
import { getAllPlayers, getPlayerStats, getAllPlayerStats } from '../../api/playerClient';

const hasValidEntry = (p) =>
    p.id != null && p.name?.trim().length > 0;

const hasValidStats = (result) => {
    if (!result) return false;
    const s = result.stats ?? {};
    const meaningfulKeys = [
        'avg', 'homeRuns', 'rbi', 'stolenBases', 'obp', 'slg', 'ops',
        'era', 'wins', 'saves', 'inningsPitched', 'strikeOutsPitching', 'whip',
        'gamesPlayed', 'hits',
    ];
    return meaningfulKeys.some(k => s[k] != null && s[k] !== 0 && s[k] !== '');
};

const usePlayerStore = create((set, get) => ({
    allPlayers: [],
    playersLoaded: false,

    fetchAllPlayers: async () => {
        if (get().playersLoaded) return;
        try {
            const players = await getAllPlayers();
            set({ allPlayers: players.filter(hasValidEntry), playersLoaded: true });
        } catch (err) {
            console.error("Could not load player list", err);
        }
    },

    allPlayersStats: [],
    allStatsLoaded: false,

    fetchAllPlayersStats: async () => {
        if (get().allStatsLoaded) return;

        try {
            const data = await getAllPlayerStats();
            console.log("raw getAllPlayerStats response:", JSON.stringify(data).slice(0, 500));
            const stats = (data?.results ?? [])
                .map(r => r.stats)
                .filter(Boolean);
            console.log("allPlayersStats length:", stats.length, "sample:", stats[0]);
            set({
                allPlayersStats: stats,
                allStatsLoaded: true,
            });
        } catch (err) {
            console.error("Could not load all player stats", err);
        }
    },

    query: "",
    suggestions: [],

    setQuery: (query) => {
        const allPlayers = get().allPlayers;
        const suggestions = query.length > 1
            ? allPlayers
                .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 6)
            : [];
        set({ query, suggestions });
    },

    clearSearch: () => set({ query: "", suggestions: [] }),

    playerResult: null,
    selectedPlayerEntry: null,
    statsLoading: false,

    selectPlayer: async (player) => {
        set({ query: player.name, suggestions: [], statsLoading: true });
        try {
            const data = await getPlayerStats(player.id);
            const firstResult = data?.results?.[0];

            // Player Exists but No Stats
            if (!firstResult || !hasValidStats(firstResult)) {
                set({ statsLoading: false });
                alert(`No stats available for ${player.name} this season.`);
                return;
            }

            set({ playerResult: data, selectedPlayerEntry: player, modalOpen: true });
        } catch (err) {
            console.error("Error fetching player stats", err);
            alert("Error fetching player stats");
        } finally {
            set({ statsLoading: false });
        }
    },

    modalOpen: false,
    setModalOpen: (open) => set({ modalOpen: open }),
}));

export default usePlayerStore;