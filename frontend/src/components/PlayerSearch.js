import React, { useEffect } from 'react';
import { IconButton, CircularProgress } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SearchBarImport from './SearchBar.jsx';
import PlayerStatsModalImport from './PlayerStatsModal.jsx';
import usePlayerStore from './stores/usePlayerStore';

const SearchBar = SearchBarImport?.default ?? SearchBarImport;
const PlayerStatsModal = PlayerStatsModalImport?.default ?? PlayerStatsModalImport;

const PlayerSearch = () => {
    const {
        query, suggestions, statsLoading,
        allPlayers, playerResult, modalOpen,
        fetchAllPlayers, setQuery, clearSearch,
        selectPlayer, setModalOpen,
    } = usePlayerStore();

    useEffect(() => { fetchAllPlayers(); }, [fetchAllPlayers]);

    const triggerSearch = () => {
        if (!query.trim() || statsLoading) return;

        const exactMatch = allPlayers.find(
            p => p.name.toLowerCase() === query.trim().toLowerCase()
        );
        const target = exactMatch || suggestions[0];

        if (target) {
            selectPlayer(target);
        } else {
            alert(`No player found matching "${query}"`);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            triggerSearch();
        }
    };

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', position: 'relative', width: '420px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <SearchBar
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onClear={clearSearch}
                        onKeyDown={handleKeyDown}
                        placeholder="Search for a player..."
                        disabled={statsLoading}
                        showIcon={true}
                    />
                    {suggestions.length > 0 && (
                        <ul style={{
                            position: 'absolute',
                            width: '100%',
                            background: 'white',
                            border: '1px solid #e5d5c8',
                            borderRadius: '8px',
                            zIndex: 100,
                            listStyle: 'none',
                            padding: 0,
                            margin: 0,
                            marginTop: '-12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }}>
                            {suggestions.map((player, i) => (
                                <li
                                    key={player.id}
                                    onClick={() => selectPlayer(player)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '8px 14px',
                                        cursor: 'pointer',
                                        borderBottom: i < suggestions.length - 1 ? '1px solid #f0e8e4' : 'none',
                                        fontSize: '14px',
                                        color: '#3a2e2a',
                                        borderRadius: i === suggestions.length - 1 ? '0 0 8px 8px' : undefined,
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#fdf6f2'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                >
                                    {player.headshotUrl && (
                                        <img
                                            src={player.headshotUrl}
                                            alt={player.name}
                                            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                                        />
                                    )}
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{player.name}</div>
                                        {player.positions && (
                                            <div style={{ fontSize: '11px', color: '#9a8a84' }}>
                                                {Array.isArray(player.positions) ? player.positions.join(' · ') : player.positions}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <IconButton
                    onClick={triggerSearch}
                    disabled={statsLoading || !query.trim()}
                    sx={{
                        bgcolor: '#c4a896',
                        color: 'white',
                        borderRadius: '10px',
                        width: '40px',
                        height: '40px',
                        flexShrink: 0,
                        '&:hover': { bgcolor: '#b39080' },
                        '&:disabled': { bgcolor: '#e5d5c8', color: '#b0a09a' },
                    }}
                >
                    {statsLoading
                        ? <CircularProgress size={18} sx={{ color: 'white' }} />
                        : <SearchOutlinedIcon fontSize="small" />
                    }
                </IconButton>
            </div>

            <PlayerStatsModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                playerResult={playerResult}
                allPlayersStats={null}
            />
        </>
    );
};

export default PlayerSearch;
