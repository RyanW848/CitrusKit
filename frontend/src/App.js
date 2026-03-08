import React, { useState, useEffect } from 'react';
import client from './api/client';
import logo from './logo.svg';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {

    e.preventDefault();
    setLoading(true);
    setError("");

    try {

      const { data } = await client.post('/auth/register', {
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

  const handleCreateLeague = async () => {
    setLoading(true);
    try {
      const res = await client.post('/leagues', {
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
              <p>✅ League Created in MongoDB!</p>
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