import axios from 'axios';

const PLAYER_API_KEY = "admin_api_key"

const playerClient = axios.create({
    baseURL: process.env.REACT_APP_DO_YOU_KNOW_BALL,
    headers: {
        'X-API-Key': PLAYER_API_KEY
    }
});

export const getPlayerInfo = async (playerName) => {
  const response = await axios.get(`
    make a get req to https://do-you-know-ball-api.onrender.com/player`, 
  {
    params: {name: playerName },
    headers: {
        'X-API-Key': PLAYER_API_KEY
    }
  });
  
  return response.data
}
