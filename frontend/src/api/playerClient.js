import axios from 'axios';

const PLAYER_API_KEY = process.env.REACT_APP_DYKB_API_KEY || "admin_api_key"

const playerClient = axios.create({
  baseURL: process.env.REACT_APP_DO_YOU_KNOW_BALL ||
    'https://do-u-know-ball.com',
  headers: {
    'X-API-Key': PLAYER_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

playerClient.interceptors.request.use((config) => {
  const key = localStorage.getItem('DYKB_PLAYER_API_KEY');
  if (key) {
    config.headers['X-API-Key'] = key;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export const generateNewApiKey = async (jwtToken) => {
  try {
    const response = await axios.post(
      'https://do-u-know-ball.com/api-keys/generate',
      {}, // Empty body as per the spec
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const { api_key } = response.data;

    localStorage.setItem('DYKB_PLAYER_API_KEY', api_key);

    return api_key;
  } catch (error) {
    console.error("Failed to generate API Key:", error.response?.data || error.message);
    throw error;
  }
}

export const getAllPlayers = async () => {
  const response = await playerClient.get('/players');
  return response.data.players;
};

export const getPlayerId = async (playerName, dateOfBirth = null) => {
  const params = { playerName };

  if (dateOfBirth) params.dob = dateOfBirth;

  const response = await playerClient.get('/get-player-id', { params });
  return response.data;
}

export const getPlayerStats = async (ids, year = null) => {
  const params = { ids: Array.isArray(ids) ? ids.join(',') : ids };

  if (year) params.year = year;

  const response = await playerClient.get('/player-stats', { params });
  return response.data;
}

export const getAllTeams = async () => {
  const response = await playerClient.get('/teams');
  return response.data.teams;
}

export const getDepthChart = async (teamId) => {
  const response = await playerClient.get('/depth-chart', { params: { teamId } });
  return response.data; // { teamId, positions: { ... } }
};

export const getTransactions = async () => {
  const response = await playerClient.get('/transactions');
  return response.data; // { date, count, transactions: [...] }
};

export const getPlayerValues = async ({ budget, relevantStats, playersLeftToDraft, unavailablePlayerIds, playerIds }) => {
  const body = {
    budget,
    relevant_stats: Array.isArray(relevantStats) ? relevantStats.join(',') : relevantStats,
  };
  if (playersLeftToDraft != null) body.players_left_to_draft = playersLeftToDraft;
  if (unavailablePlayerIds) body.unavailable_player_ids = unavailablePlayerIds;
  if (playerIds) body.player_ids = playerIds;

  const response = await playerClient.post('/value', body);
  return response.data;
};

export default playerClient;
