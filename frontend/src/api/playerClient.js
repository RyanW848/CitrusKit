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

export const getAllPlayers = async () => {
  const response = await playerClient.get('/players');
  return response.data.players;
};

export const getPlayerId = async (playerName, dateOfBirth = null) => {
  const params = { name: playerName };

  if (dateOfBirth) params.dob = dateOfBirth;

  const response = await playerClient.get('/get-player-id', { params });
  return response.data;
}

export const getPlayerStats = async (ids, year = null) => {
  const params = { players: Array.isArray(ids) ? ids.join(',') : ids };

  if (year) params.year = year;

  const response = await playerClient.get('/stats', { params });
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
