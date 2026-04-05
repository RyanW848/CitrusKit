import { Box, Typography } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

/**
 * Tappable section title row (e.g. “Saved Leagues” → navigate to full list).
 */
export default function SectionLinkHeader({ title, onClick, showChevron = true }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        mb: 1.5,
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {showChevron && <ChevronRightIcon sx={{ color: "#555" }} />}
    </Box>
  );
}
