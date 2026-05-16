import { Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const TABS = [
  { label: "Rules", path: "rules" },
  { label: "Teams", path: "teams" },
  { label: "Plan", path: "plan" },
  { label: "Draft", path: "draft" },
  { label: "View", path: "view" },
];

const VIEW_SUB_TABS = [
  { label: "Rosters", value: "rosters" },
  { label: "Log", value: "log" },
];

/**
 * Bottom tab bar shared by all draft sub-pages.
 *
 * Props:
 *   activeTab      – one of "rules" | "teams" | "plan" | "draft" | "view"
 *   draftId        – the draft UUID used to build navigation paths
 *   subTab         – active sub-tab when activeTab === "view" ("rosters" | "log")
 *   onSubTabChange – callback(value) when a sub-tab is selected
 */
export default function DraftTabBar({ activeTab, draftId, subTab, onSubTabChange }) {
  const navigate = useNavigate();
  const isLocked = !draftId;

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 1 }}>
      <Box
        sx={{
          display: "flex",
          border: "1px solid #e5d5c8",
          borderRadius: "24px",
          p: "4px",
          gap: 0,
          bgcolor: "#fdf6f0",
          alignItems: "center",
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.path;
          const isDisabled = isLocked && !isActive;

          if (tab.path === "view" && isActive && onSubTabChange) {
            return (
              <Box
                key="view"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  bgcolor: "#f4c9b3",
                  borderRadius: "20px",
                  p: "2px",
                  gap: 0,
                }}
              >
                {VIEW_SUB_TABS.map((sub) => {
                  const isSubActive = (subTab ?? "rosters") === sub.value;
                  return (
                    <Button
                      key={sub.value}
                      onClick={() => onSubTabChange(sub.value)}
                      disableRipple={isSubActive}
                      sx={{
                        textTransform: "none",
                        fontWeight: isSubActive ? 600 : 400,
                        color: isSubActive ? "#3f332f" : "#6d5a57",
                        bgcolor: isSubActive ? "#fff" : "transparent",
                        borderRadius: "18px",
                        px: 1.75,
                        py: 0.4,
                        minWidth: 0,
                        fontSize: "0.85rem",
                        boxShadow: isSubActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                        "&:hover": {
                          bgcolor: isSubActive ? "#fff" : "rgba(255,255,255,0.4)",
                          boxShadow: isSubActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                        },
                      }}
                    >
                      {sub.label}
                    </Button>
                  );
                })}
              </Box>
            );
          }

          return (
            <Button
              key={tab.label}
              onClick={isDisabled ? undefined : () => navigate(`/draft/${draftId}/${tab.path}`)}
              disableRipple={isActive || isDisabled}
              sx={{
                textTransform: "none",
                fontWeight: isActive ? 600 : 400,
                color: isDisabled ? "#c5b5b0" : "#1a1a1a",
                borderRadius: "20px",
                px: 2.5,
                py: 0.6,
                minWidth: 0,
                fontSize: "0.9rem",
                cursor: isDisabled ? "default" : "pointer",
                pointerEvents: isDisabled ? "none" : "auto",
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
