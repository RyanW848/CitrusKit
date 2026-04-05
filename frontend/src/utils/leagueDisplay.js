/** Shape expected by {@link LeagueRow}: id, name, lastEdited */
export function leagueToRowShape(league) {
  const updated = league.updatedAt ? new Date(league.updatedAt) : null;
  return {
    id: String(league.id),
    name: league.name,
    lastEdited: updated
      ? updated.toLocaleDateString(undefined, { dateStyle: "medium" })
      : "—",
  };
}

export function filterLeaguesByName(leagues, query) {
  const q = query.trim().toLowerCase();
  if (!q) return leagues;
  return leagues.filter((l) => l.name.toLowerCase().includes(q));
}

/** Placeholder rows for {@link ActivityFeed} until a real activity API or event stream exists */
export function leaguesToActivityFeedItems(leagues, { limit = 6 } = {}) {
  return leagues.slice(0, limit).map((l) => ({
    id: `league-${l.id}`,
    title: l.name,
    subtitle: "League saved",
    time: leagueToRowShape(l).lastEdited,
  }));
}
