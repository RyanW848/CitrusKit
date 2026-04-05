import { Box, Container, Typography, IconButton } from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";

/**
 * Common page shell used by all pages.
 * Provides: cream background, top nav (account icon + optional bell + settings), title, subtitle.
 *
 * Props:
 *   title        – bold page title
 *   subtitle     – small grey subtitle line
 *   showBell     – render the bell/notifications icon (default false)
 *   onBellClick  – bell click handler
 *   onSettingsClick – settings icon click handler
 *   settingsMenu – optional JSX rendered after the settings icon (e.g. a MUI <Menu>)
 *   children     – page body
 *   maxWidth     – Container maxWidth (default "md")
 *   noPad        – skip bottom padding on the Container (default false)
 */
export default function PageLayout({
  title,
  subtitle,
  showBell = false,
  onBellClick,
  onSettingsClick,
  settingsMenu,
  children,
  maxWidth = "md",
  noPad = false,
}) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#fdf6f0",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <Container maxWidth={maxWidth} sx={{ py: 3, pb: noPad ? 0 : 3 }}>
        {/* Top nav */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <AccountCircleOutlinedIcon sx={{ color: "#1a1a1a", fontSize: 28 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {showBell && (
              <IconButton size="small" onClick={onBellClick}>
                <NotificationsNoneOutlinedIcon sx={{ color: "#555" }} />
              </IconButton>
            )}
            <IconButton size="small" onClick={onSettingsClick}>
              <SettingsOutlinedIcon sx={{ color: "#555" }} />
            </IconButton>
            {settingsMenu}
          </Box>
        </Box>

        {/* Title */}
        {title && (
          <Typography
            sx={{ fontSize: "2rem", fontWeight: 700, color: "#1a1a1a", mb: 0.5 }}
          >
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography sx={{ fontSize: "0.88rem", color: "#666", mb: 4 }}>
            {subtitle}
          </Typography>
        )}

        {children}
      </Container>
    </Box>
  );
}
