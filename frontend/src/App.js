import React, { useState, useEffect } from 'react';
import citrusClient from './api/citrusClient';
import playerClient from './api/playerClient'
import logo from './logo.svg';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [allNames, setAllNames] = useState([]); 
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedData, setSelectedData] = useState(null);

  useEffect(() => {
    playerClient.get('/players')
      .then(res => setAllNames(res.data))
      .catch(err => console.error("Could not fetch master player list", err));
  }, []);

  const handleRegister = async (e) => {

    e.preventDefault();
    setLoading(true);
    setError("");

    try {

      const { data } = await citrusClient.post('/auth/register', {
        name: "Test User",
        email: `test${Math.floor(Math.random() * 1000)}@test.com`,
        password: "password123"
      });

      localStorage.setItem('token', data.token);
      setUser(data.user);

    } catch (err) {

      setError("Registration failed: " + (err.response?.data?.error || err.message));
    
    } finally {

      setLoading(false);

    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;

    setQuery(val);

    if (val.length > 1) {
      const filtered = allNames.filter(n => n.toLowerCase().includes(val.toLowerCase())).slice(0, 10);

    } else {
      // Back
    }
  };

  const handleSelectPlayer = async (name) => {
    setQuery(name);

    try {
      const res = await playerClient.get(`/player?name=${name}`);
      setSelectedPlayer(res.data);
    } catch (err) {
      alert("Error fetching player stats from API");
    }
  };

  const handleCreateLeague = async () => {
    setLoading(true);
    try {
      const res = await citrusClient.post('/leagues', {
        name: "My MVP League",
        teamCount: 12,
        budget: 260,
        scoringTypes: ["5x5", "Roto"]
      });
      setLeague(res.data);
    } catch (err) {
      setError("League creation failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Draft Kit MVP Test</h1>
      
      {error && <p className="error">{error}</p>}

      {/* Register User */}
      <div className="box">

        <h3>Identity</h3>

        {!user ? (
          <button onClick={handleRegister} disabled={loading}>

            {loading ? "Registering..." : "Quick Register (Test User)"}

          </button>
        ) : (

          <p>Logged in as: <strong>{user.name}</strong></p>
        
        )}

      </div>

      {/* Search Player */}
      <div className="box">
        <h3>Player Search</h3>
          <div>
            <input>
              type="text"
              placeholder="Type player name..." 
              value={query} 
              onChange={handleSearchChange}
            </input>
          </div>

          {selectedPlayer && (
            <div className="player-card">
              <h4>{selectedPlayer.name}</h4>
              <p>Position: {selectedPlayer.position}</p>
              <p>Value: <strong>${selectedPlayer.value}</strong></p>
            </div>
          )}
      </div>

      {/* League Making (Hidden, unless logged in) */}
      {user && (
        <div className="box">

          <h3>League Data</h3>

          {!league ? (
            <button onClick={handleCreateLeague} disabled={loading}>

              {loading ? "Creating..." : "Create Test League"}

            </button>
          ) : (
            <div>
              <p>League Created in MongoDB!</p>

              <pre style={{ background: '#eee', padding: '10px' }}>

                {JSON.stringify(league, null, 2)}

              </pre>

            </div>
          )}

        </div>
      )}

      {/* Check Token */}
      <div className="box">

        <h3>Token Status</h3>

        <p>Token in LocalStorage: {localStorage.getItem('token') ? "Present ✅" : "Missing ❌"}</p>
      
      </div>
    </div>
  );
}

export default App;