import { Box, Typography, CircularProgress } from "@mui/material";
import LeagueRow from "./LeagueRow";

/**
 * Renders {@link LeagueRow} items from API-shaped or row-shaped leagues.
 *
 * @param {Array<{ id: string, name: string, lastEdited: string }>} props.leagues
 * @param {(id: string) => void} props.onLeagueClick
 * @param {string} [props.emptyMessage]
 * @param {boolean} [props.loading]
 */
export default function LeagueRowList({ leagues, onLeagueClick, emptyMessage, loading }) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        <CircularProgress size={28} sx={{ color: "#f4c9b3" }} />
      </Box>
    );
  }

  if (!leagues.length && emptyMessage) {
    return (
      <Typography variant="body2" sx={{ color: "#888" }}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <>
      {leagues.map((league) => (
        <LeagueRow
          key={league.id}
          league={league}
          onClick={onLeagueClick ? () => onLeagueClick(league.id) : undefined}
        />
      ))}
    </>
  );
}
