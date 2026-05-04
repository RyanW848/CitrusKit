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

export async function updateLeague(leagueId, payload) {
  const { data } = await client.patch(`/leagues/${leagueId}`, payload);
  return data;
}

export async function fetchDraftState(leagueId) {
  const { data } = await client.get(`/leagues/${leagueId}/draft`);
  return data;
}

export async function createDraftPick(leagueId, payload) {
  const { data } = await client.post(`/leagues/${leagueId}/draft/picks`, payload);
  return data;
}

export async function deleteDraftPick(leagueId, pickId) {
  const { data } = await client.delete(`/leagues/${leagueId}/draft/picks/${pickId}`);
  return data;
}

export async function createPlanPick(leagueId, payload) {
  const { data } = await client.post(`/leagues/${leagueId}/plan/picks`, payload);
  return data;
}

export async function deletePlanPick(leagueId, pickId) {
  const { data } = await client.delete(`/leagues/${leagueId}/plan/picks/${pickId}`);
  return data;
}

export async function updatePlanPick(leagueId, pickId, payload) {
  const { data } = await client.patch(`/leagues/${leagueId}/plan/picks/${pickId}`, payload);
  return data;
}

export async function createMinorLeaguePick(leagueId, payload) {
  const { data } = await client.post(`/leagues/${leagueId}/minor-league/picks`, payload);
  return data;
}

export async function deleteMinorLeaguePick(leagueId, pickId) {
  const { data } = await client.delete(`/leagues/${leagueId}/minor-league/picks/${pickId}`);
  return data;
}
