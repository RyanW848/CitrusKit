import axios from 'axios';

const PLAYER_API_KEY = "admin_api_key"

const playerClient = axios.create({
  baseURL: process.env.REACT_APP_DO_YOU_KNOW_BALL ||
    'https://do-you-know-ball-api.onrender.com',
  headers: {
    'X-API-Key': PLAYER_API_KEY
  }
});

export const getAllPlayerNames = async () => {
  const response = await playerClient.get('/players');
  return response.data;
};

export const getPlayerInfo = async (playerName) => {
  const response = await playerClient.get('/players', {
    params: { name: playerName },
  });
  return response.data
}

export default playerClient;
