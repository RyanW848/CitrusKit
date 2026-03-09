import React, { useState, useEffect } from 'react';
import playerClient, { getAllPlayerNames } from '../api/playerClient';

const PlayerSearch = () => {
    const [allNames, setAllNames] = useState([]); 
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [selectedData, setSelectedData] = useState(null);

    useEffect(() => {
        getAllPlayerNames()
            .then(data => setAllNames(data))
            .catch(err => console.error("Could not load player list"));
    }, []);

    const handleSearch = (e) => {
        const value = e.target.value;
        setQuery(value);

        if (value.length > 1) {
            const filtered = allNames.filter(name => 
                name.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 6); 

            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    };

    const handleSelect = async (name) => {
        setQuery(name);
        setSuggestions([]);
        try {
            const res = await playerClient.get(`/player?name=${name}`);
            setSelectedData(res.data);
        } catch (err) {
            alert("Error fetching player stats");
        }
    };

    return (
        <div style={{ position: 'relative', width: '350px' }}>
            <input 
                type="text"
                placeholder="Search for..."
                value={query}
                onChange={handleSearch}
                style={{ width: '100%', padding: '10px', borderRadius: '4px' }}
            />

            {suggestions.length > 0 && (
                <ul style={{
                    position: 'absolute', width: '100%', background: 'white',
                    border: '1px solid #ccc', zIndex: 100, listStyle: 'none', padding: 0
                }}>
                    {suggestions.map(name => (
                        <li 
                            key={name}
                            onClick={() => handleSelect(name)}
                            style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
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