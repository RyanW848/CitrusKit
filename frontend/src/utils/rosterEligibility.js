export function isEligibleForSlot(playerPositions, slotAbbr) {
  if (!playerPositions) return true; // custom player: allow anywhere
  const expanded =
    (slotAbbr === "SP" || slotAbbr === "RP") ? ["P"] :
      slotAbbr === "CI" ? ["1B", "3B"] :
        slotAbbr === "MI" ? ["2B", "SS"] :
          slotAbbr === "U" ? null :
            [slotAbbr];
  if (expanded === null) return true; // U slot accepts anything
  return playerPositions.some((pos) => expanded.includes(pos));
}

export function resolvePlayerPositions(allPlayers, playerId) {
  if (!playerId) return null;
  const found = allPlayers.find((p) => String(p.id) === String(playerId));
  if (!found) return null;
  return Array.isArray(found.positions)
    ? found.positions
    : (found.positions ? found.positions.split(",").map((s) => s.trim()) : []);
}
