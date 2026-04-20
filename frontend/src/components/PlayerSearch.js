import React, { useState, useEffect } from 'react';
import { getAllPlayers, getPlayerStats } from '../api/playerClient';
import SearchBar from './SearchBar';
import { IconButton, CircularProgress } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

const PlayerSearch = ({ onPlayerSelect }) => {
    const [allPlayers, setAllPlayers] = useState([]);
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getAllPlayers()
            .then(players => {
                console.log("Players loaded:", players);
                setAllPlayers(players)
            })
            .catch(err => console.error("Could not load player list", err));
    }, []);

    const handleChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        console.log("allPlayers sample:", allPlayers.slice(0, 3));
        console.log("query:", value);

        if (value.length > 1) {
            const filtered = allPlayers
                .filter(p => p.name.toLowerCase().includes(value.toLowerCase()))
                .slice(0, 6);
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    };

    const handleClear = () => {
        setQuery("");
        setSuggestions([]);
    };

    const handleSelect = async (player) => {
        setQuery(player.name);
        setSuggestions([]);
        setLoading(true);
        try {
            const data = await getPlayerStats(player.id);
            if (onPlayerSelect) onPlayerSelect(data);
        } catch (err) {
            console.error("Error fetching player stats", err);
            alert("Error fetching player stats");
        } finally {
            setLoading(false);
        }
    };

    const triggerSearch = () => {
        if (!query.trim() || loading) return;

        const exactMatch = allPlayers.find(
            p => p.name.toLowerCase() === query.trim().toLowerCase()
        );
        const target = exactMatch || suggestions[0];

        if (target) {
            handleSelect(target);
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
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', position: 'relative', width: '420px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
                <SearchBar
                    value={query}
                    onChange={handleChange}
                    onClear={handleClear}
                    onKeyDown={handleKeyDown}
                    placeholder="Search for a player..."
                    disabled={loading}
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
                                onClick={() => handleSelect(player)}
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
                                    {player.positions?.length > 0 && (
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
                disabled={loading || !query.trim()}
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
                {loading
                    ? <CircularProgress size={18} sx={{ color: 'white' }} />
                    : <SearchOutlinedIcon fontSize="small" />
                }
            </IconButton>
        </div>
    );
};

export default PlayerSearch;