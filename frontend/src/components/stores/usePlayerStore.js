import { create } from 'zustand';
import { getAllPlayers, getPlayerStats } from '../../api/playerClient'

const usePlayerStore = create((set, get) => ({
    allPlayers: [],
    playersLoaded: false,

    fetchAllPlayers: async () => {
        if (get().playersLoaded) return; 
        try {
            const players = await getAllPlayers();
            set({ allPlayers: players, playersLoaded: true });
        } catch (err) {
            console.error("Could not load player list", err);
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
    statsLoading: false,

    selectPlayer: async (player) => {
        set({ query: player.name, suggestions: [], statsLoading: true });
        try {
            const data = await getPlayerStats(player.id);
            set({ playerResult: data, modalOpen: true });
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