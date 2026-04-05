import { Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const TABS = [
  { label: "Rules", path: "rules" },
  { label: "Teams", path: "teams" },
  { label: "Plan", path: "plan" },
  { label: "Draft", path: "draft" },
  { label: "View", path: "view" },
];

/**
 * Bottom tab bar shared by all draft sub-pages.
 *
 * Props:
 *   activeTab – one of "rules" | "teams" | "plan" | "draft" | "view"
 *   draftId   – the draft UUID used to build navigation paths
 */
export default function DraftTabBar({ activeTab, draftId }) {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        mt: 3,
        mb: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          border: "1px solid #e5d5c8",
          borderRadius: "24px",
          p: "4px",
          gap: 0,
          bgcolor: "#fdf6f0",
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.path;
          return (
            <Button
              key={tab.label}
              onClick={() => navigate(`/draft/${draftId}/${tab.path}`)}
              disableRipple={isActive}
              sx={{
                textTransform: "none",
                fontWeight: isActive ? 600 : 400,
                color: "#1a1a1a",
                borderRadius: "20px",
                px: 2.5,
                py: 0.6,
                minWidth: 0,
                fontSize: "0.9rem",
                bgcolor: isActive ? "#f4c9b3" : "transparent",
                "&:hover": {
                  bgcolor: isActive ? "#f4c9b3" : "#f0e8e0",
                  boxShadow: "none",
                },
                boxShadow: "none",
              }}
            >
              {tab.label}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}
