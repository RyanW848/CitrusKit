import React, { useState, useEffect } from 'react';
import playerClient, { getAllPlayerNames, getPlayerInfo } from '../api/playerClient';
import SearchBar from './SearchBar';

const PlayerSearch = () => {
    const [allNames, setAllNames] = useState([]);
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [selectedData, setSelectedData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getAllPlayerNames()
            .then(data => setAllNames(data))
            .catch(err => console.error("Could not load player list", err));
    }, []);

    const handleChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        if (value.length > 1) {
            const filtered = allNames
                .filter(name =>
                    name.toLowerCase().includes(value.toLowerCase())
                ).slice(0, 6);

            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    };

    const handleClear = () => {
        setQuery("");
        setSuggestions([]);
        setLoading(true);
    };

    const handleSelect = async (name) => {
        setQuery(name);
        setSuggestions([]);
        setLoading(true);

        try {
            const data = await getPlayerInfo(name);
            setSelectedData(data);
            // if (onPlayerSelect) onPlayerSelect(data);
        } catch (err) {
            console.error("Error fetching player stats", err);
            alert("Error fetching player stats");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'relative', width: '350px' }}>
            <SearchBar
                value={query}
                onChange={handleChange}
                onClear={handleClear}
                placeholder="Search for a player..."
                disabled={loading}
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
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    // Pull up to sit flush under the SearchBar (which has mb:2 = 16px)
                    marginTop: '-12px',
                }}>
                    {suggestions.map((name, i) => (
                        <li
                            key={name}
                            onClick={() => handleSelect(name)}
                            style={{
                                padding: '10px 14px',
                                cursor: 'pointer',
                                borderBottom: i < suggestions.length - 1 ? '1px solid #f0e8e4' : 'none',
                                fontSize: '14px',
                                color: '#3a2e2a',
                                borderRadius: i === suggestions.length - 1 ? '0 0 8px 8px' : undefined,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fdf6f2'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                        >
                            {name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default PlayerSearch;