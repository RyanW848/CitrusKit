import { useMemo, useState } from "react";
import {
  Box,
  Chip,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";

const COLUMNS = [
  { id: "spendRank", label: "Spend Rank", align: "right" },
  { id: "ownerName", label: "Team", align: "left" },
  { id: "draftedCount", label: "Players", align: "right" },
  { id: "openSlots", label: "Open", align: "right" },
  { id: "spent", label: "Money Spent", align: "right", money: true },
  { id: "remainingBudget", label: "Remaining", align: "right", money: true },
  { id: "avgRemainingPerSlot", label: "$ / Open", align: "right", money: true },
  { id: "budgetUsed", label: "Budget Used", align: "right", percent: true },
];

function money(value) {
  if (!Number.isFinite(value)) return "-";
  return `$${Math.round(value)}`;
}

function percent(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value * 100)}%`;
}

function compareValues(a, b, key) {
  const aValue = a[key];
  const bValue = b[key];

  if (typeof aValue === "string" || typeof bValue === "string") {
    return String(aValue ?? "").localeCompare(String(bValue ?? ""));
  }

  return (aValue ?? 0) - (bValue ?? 0);
}

function buildRows(draftState) {
  const rows = (draftState?.owners ?? []).map((owner) => {
    const rosterSlots = owner.rosterSlots ?? [];
    const filledSlots = rosterSlots.filter((slot) => slot.pick).length;
    const openSlots = Math.max(rosterSlots.length - filledSlots, 0);
    const spent = Number(owner.spent ?? 0);
    const remainingBudget = Number(owner.remainingBudget ?? owner.budget - spent);

    return {
      ownerId: owner.id,
      ownerName: owner.name,
      draftedCount: filledSlots,
      totalSlots: rosterSlots.length,
      openSlots,
      spent,
      remainingBudget,
      avgRemainingPerSlot: openSlots > 0 ? remainingBudget / openSlots : 0,
      budgetUsed: owner.budget > 0 ? spent / owner.budget : 0,
      completionRate: rosterSlots.length > 0 ? filledSlots / rosterSlots.length : 0,
    };
  });

  const rankBySpend = [...rows].sort((a, b) => b.spent - a.spent);
  const ranks = new Map(rankBySpend.map((row, index) => [row.ownerId, index + 1]));

  return rows.map((row) => ({
    ...row,
    spendRank: ranks.get(row.ownerId) ?? rows.length,
  }));
}

export default function TeamComparisonTable({ draftState }) {
  const [sortBy, setSortBy] = useState("spendRank");
  const [sortDirection, setSortDirection] = useState("asc");

  const rows = useMemo(() => buildRows(draftState), [draftState]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const comparison = compareValues(a, b, sortBy);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [rows, sortBy, sortDirection]);

  const summary = useMemo(() => {
    const topSpender = [...rows].sort((a, b) => b.spent - a.spent)[0];
    const totalSpent = rows.reduce((sum, row) => sum + row.spent, 0);
    const totalRemaining = rows.reduce((sum, row) => sum + row.remainingBudget, 0);
    const totalSlots = rows.reduce((sum, row) => sum + row.totalSlots, 0);
    const draftedSlots = rows.reduce((sum, row) => sum + row.draftedCount, 0);

    return {
      topSpender,
      totalSpent,
      totalRemaining,
      completionRate: totalSlots > 0 ? draftedSlots / totalSlots : 0,
    };
  }, [rows]);

  const handleSort = (columnId) => {
    if (sortBy === columnId) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(columnId);
    setSortDirection(columnId === "ownerName" ? "asc" : "desc");
  };

  if (!rows.length) {
    return (
      <Typography sx={{ color: "#8c7672", fontSize: "0.9rem", py: 4, textAlign: "center" }}>
        No fantasy teams are available to compare.
      </Typography>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: "1.05rem", fontWeight: 700, color: "#1a1a1a" }}>
          Fantasy Team Comparison
        </Typography>
        <Typography sx={{ color: "#6d5a57", fontSize: "0.85rem" }}>
          Compare draft progress and budget position across every team.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          gap: 1.25,
          mb: 2,
        }}
      >
        {[
          {
            label: "Top Spender",
            value: summary.topSpender?.ownerName ?? "-",
            helper: summary.topSpender ? `${money(summary.topSpender.spent)} spent` : "No teams",
            icon: <EmojiEventsOutlinedIcon sx={{ fontSize: 18 }} />,
          },
          {
            label: "Draft Completion",
            value: percent(summary.completionRate),
            helper: "filled roster slots",
            icon: <GroupsOutlinedIcon sx={{ fontSize: 18 }} />,
          },
          {
            label: "Total Spent",
            value: money(summary.totalSpent),
            helper: "across all teams",
            icon: <PaidOutlinedIcon sx={{ fontSize: 18 }} />,
          },
          {
            label: "Money Remaining",
            value: money(summary.totalRemaining),
            helper: "available budget",
            icon: <TrendingUpOutlinedIcon sx={{ fontSize: 18 }} />,
          },
        ].map((item) => (
          <Paper
            key={item.label}
            elevation={0}
            sx={{
              border: "1px solid #ead8ce",
              borderRadius: "8px",
              p: 1.5,
              bgcolor: "#fff9f5",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75, color: "#8c7672" }}>
              {item.icon}
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
                {item.label}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: "1.15rem", fontWeight: 800, color: "#2f241f", lineHeight: 1.15 }}>
              {item.value}
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "#8c7672", mt: 0.35 }}>
              {item.helper}
            </Typography>
          </Paper>
        ))}
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: "1px solid #e5d5c8",
          borderRadius: "10px",
          overflowX: "auto",
          bgcolor: "#fffaf7",
        }}
      >
        <Table size="small" sx={{ minWidth: 860 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f4e4dc" }}>
              {COLUMNS.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sortDirection={sortBy === column.id ? sortDirection : false}
                  sx={{
                    fontWeight: 700,
                    color: "#4a3520",
                    borderBottom: "1px solid #d8c4ba",
                    whiteSpace: "nowrap",
                    py: 1.1,
                  }}
                >
                  <TableSortLabel
                    active={sortBy === column.id}
                    direction={sortBy === column.id ? sortDirection : "asc"}
                    onClick={() => handleSort(column.id)}
                    sx={{
                      color: "#4a3520",
                      "&.Mui-active": { color: "#4a3520" },
                      "& .MuiTableSortLabel-icon": { color: "#8c7672 !important" },
                    }}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((row, index) => (
              <TableRow
                key={row.ownerId}
                sx={{
                  bgcolor: index % 2 === 0 ? "#fff" : "#fff8f3",
                  "&:hover": { bgcolor: "#fdf0e8" },
                  "&:last-child td": { borderBottom: 0 },
                }}
              >
                {COLUMNS.map((column) => {
                  const rawValue = row[column.id];
                  const displayValue = column.id === "draftedCount"
                    ? `${row.draftedCount}/${row.totalSlots}`
                    : column.percent
                      ? percent(rawValue)
                    : column.money
                      ? money(rawValue)
                      : rawValue;

                  return (
                    <TableCell
                      key={column.id}
                      align={column.align}
                      sx={{
                        color: "#3f332f",
                        fontWeight: column.id === "ownerName" ? 600 : 400,
                        borderBottom: "1px solid #f0e1d8",
                        whiteSpace: "nowrap",
                        py: 1.05,
                      }}
                    >
                      {column.id === "spendRank" ? (
                        <Chip
                          label={`#${displayValue}`}
                          size="small"
                          sx={{
                            height: 22,
                            minWidth: 44,
                            bgcolor: rawValue === 1 ? "#fef3c7" : "#f5f0ed",
                            color: rawValue === 1 ? "#92400e" : "#6d5a57",
                            fontWeight: 800,
                            borderRadius: "6px",
                          }}
                        />
                      ) : column.id === "draftedCount" ? (
                        <Box sx={{ minWidth: 92 }}>
                          <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#3f332f", textAlign: "right" }}>
                            {displayValue}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.round(row.completionRate * 100)}
                            sx={{
                              mt: 0.5,
                              height: 5,
                              borderRadius: 3,
                              bgcolor: "#f0e1d8",
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 3,
                                bgcolor: row.completionRate === 1 ? "#16a34a" : "#f97316",
                              },
                            }}
                          />
                        </Box>
                      ) : (
                        displayValue
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
