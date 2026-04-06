import { Box, Typography, CircularProgress } from "@mui/material";

/**
 * Presentational list of activity rows (timestamps, titles). Parent supplies data;
 * this does not subscribe or listen for app/domain events.
 *
 * @param {object} props
 * @param {string} [props.title]
 * @param {Array<{ id: string, title: string, subtitle?: string, time?: string }>} props.items
 * @param {string} [props.emptyMessage]
 * @param {boolean} [props.loading]
 * @param {string} [props.error]
 * @param {import('@mui/system').SxProps} [props.sx]
 */
export default function ActivityFeed({
  title,
  items = [],
  emptyMessage = "Nothing to show yet.",
  loading = false,
  error,
  sx,
}) {
  return (
    <Box sx={sx}>
      {title && (
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          {title}
        </Typography>
      )}

      {error && (
        <Typography variant="body2" sx={{ color: "#a94442", mb: 1 }}>
          {error}
        </Typography>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={28} sx={{ color: "#f4c9b3" }} />
        </Box>
      )}

      {!loading && !error && items.length === 0 && (
        <Typography variant="body2" sx={{ color: "#888" }}>
          {emptyMessage}
        </Typography>
      )}

      {!loading &&
        !error &&
        items.map((row) => (
          <Box
            key={row.id}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              py: 1.25,
              px: 1.5,
              mb: 1,
              bgcolor: "#fef0e8",
              border: "1px solid #e5d5c8",
              borderRadius: "12px",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3 }}
              >
                {row.title}
              </Typography>
              {row.subtitle && (
                <Typography variant="caption" sx={{ color: "#666", display: "block", mt: 0.25 }}>
                  {row.subtitle}
                </Typography>
              )}
            </Box>
            {row.time && (
              <Typography
                variant="caption"
                sx={{ color: "#888", whiteSpace: "nowrap", pt: 0.15 }}
              >
                {row.time}
              </Typography>
            )}
          </Box>
        ))}
    </Box>
  );
}
