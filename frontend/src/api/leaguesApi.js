import client from "./citrusClient";

/**
 * @returns {Promise<Array<{ id: string, name: string, teamCount: number, budget: number, scoringTypes: string[], createdAt: string, updatedAt: string }>>}
 */
export async function fetchMyLeagues() {
  const { data } = await client.get("/leagues");
  return data;
}

export async function createLeague(payload) {
  const { data } = await client.post("/leagues", payload);
  return data;
}

export async function fetchLeagueById(leagueId) {
  const { data } = await client.get(`/leagues/${leagueId}`);
  return data;
}
