import React, { useState } from 'react';
import {
    Dialog, DialogContent, DialogTitle,
    Tabs, Tab, Box, IconButton, Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { computeFiveTools, computePercentile, computeRank, RANKING_STATS } from '../utils/playerStats.utils';

const accentColor = '#f97316';
const dimColor    = '#fde0c8';

// Made with Claude Assistance
const CustomAngleLabel = ({ x, y, cx, cy, payload }) => {
    const dx = x - cx, dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ox = (dx / dist) * 18, oy = (dy / dist) * 18;
    return (
        <text
            x={x + ox} y={y + oy}
            textAnchor="middle" dominantBaseline="central"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fill: '#7c3a0a', fontWeight: 500 }}
        >
            {payload.value}
        </text>
    );
};

// Changed to add dots on the bar, showing ranking amongst players
const PercentileBar = ({ pct }) => {
    const barColor = pct >= 75 ? '#16a34a' : pct >= 50 ? accentColor : '#dc2626';
    return (
        <div style={{ position: 'relative', padding: '5px 0' }}>
            <div style={{ position: 'relative', height: 6, background: dimColor, borderRadius: 3 }}>
                <div style={{
                    position: 'absolute', left: 0, top: 0, height: '100%',
                    width: `${pct}%`,
                    background: barColor,
                    borderRadius: 3,
                    transition: 'width 0.6s ease',
                }} />
            </div>
            <div style={{
                position: 'absolute',
                left: `${pct}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: barColor,
                border: '2px solid #fff9f5',
                boxShadow: `0 0 0 1.5px ${barColor}`,
                transition: 'left 0.6s ease',
                zIndex: 1,
            }} />
        </div>
    );
};

// Claude Assistance
export default function PlayerStatsModal({ open, onClose, playerResult, allPlayersStats }) {
    const [tab, setTab] = useState(0);

    if (!playerResult) return null;

    const { player, team, stats = {}, year } = playerResult?.results?.[0] ?? {};
    if (!player) return null;

    const fiveTools = computeFiveTools(stats);
    const radarData = Object.entries(fiveTools).map(([tool, value]) => ({ tool, value }));

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    background: '#fff9f5',
                    overflow: 'hidden',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                }
            }}
        >
            {/* Header */}
            <DialogTitle sx={{ p: 0 }}>
                <Box sx={{
                    background: `linear-gradient(135deg, #1a1008 0%, #3a1f08 100%)`,
                    px: 3, py: 2.5,
                    display: 'flex', alignItems: 'center', gap: 2,
                }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '1.2rem', fontWeight: 500,
                            color: '#fff9f5', letterSpacing: '-0.01em',
                        }}>
                            {player.name}
                        </Typography>
                        <Typography sx={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '0.72rem', color: accentColor,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                            mt: 0.25,
                        }}>
                            {player.position} · {team?.abbreviation ?? '—'} · {year}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small" sx={{ color: '#fff9f5', opacity: 0.6, '&:hover': { opacity: 1 } }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Tabs */}
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{
                        background: '#fff1e6',
                        borderBottom: `2px solid ${dimColor}`,
                        minHeight: 40,
                        '& .MuiTab-root': {
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '0.7rem', textTransform: 'uppercase',
                            letterSpacing: '0.1em', minHeight: 40,
                            color: '#a3681e',
                        },
                        '& .Mui-selected': { color: `${accentColor} !important` },
                        '& .MuiTabs-indicator': { background: accentColor, height: 2 },
                    }}
                >
                    <Tab label="5-Tool Radar" />
                    <Tab label="Rankings" />
                </Tabs>
            </DialogTitle>

            <DialogContent sx={{ p: 0, background: '#fff9f5' }}>
                {/* ── Tab 0: Radar ── */}
                {tab === 0 && (
                    <Box sx={{ p: 3 }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <RadarChart data={radarData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                                <PolarGrid stroke={dimColor} />
                                <PolarAngleAxis dataKey="tool" tick={<CustomAngleLabel />} />
                                <Radar
                                    dataKey="value"
                                    stroke={accentColor}
                                    fill={accentColor}
                                    fillOpacity={0.25}
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: accentColor, strokeWidth: 0 }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>

                        {/* Score pills */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap', mt: 1 }}>
                            {Object.entries(fiveTools).map(([tool, score]) => (
                                <Box key={tool} sx={{
                                    textAlign: 'center',
                                    background: '#fff1e6',
                                    border: `1px solid ${dimColor}`,
                                    borderRadius: '8px',
                                    px: 1.5, py: 0.75,
                                    minWidth: 64,
                                }}>
                                    <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.1rem', fontWeight: 500, color: accentColor }}>
                                        {score}
                                    </Typography>
                                    <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#a3681e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        {tool}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}

                {/* ── Tab 1: Rankings ── */}
                {tab === 1 && (
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {RANKING_STATS.map(({ key, label, isFloat }) => {
                            const raw = stats[key];
                            if (raw == null) return null;
                            const val = isFloat ? parseFloat(raw) : parseInt(raw, 10);

                            // Compute rank and percentile from allPlayersStats if available
                            const allVals = allPlayersStats
                                ?.map(s => isFloat ? parseFloat(s[key]) : parseInt(s[key], 10))
                                .filter(v => !isNaN(v));

                            const pct  = allVals?.length ? computePercentile(val, allVals) : null;
                            const rank = allVals?.length ? computeRank(val, allVals) : null;
                            const total = allVals?.length ?? null;

                            return (
                                <Box key={key}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.78rem', color: '#4a3520' }}>
                                            {label}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.78rem', fontWeight: 500, color: '#1a1008' }}>
                                                {isFloat ? parseFloat(raw).toFixed(3) : raw}
                                            </Typography>
                                            {rank != null && (
                                                <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: accentColor }}>
                                                    #{rank} of {total}
                                                </Typography>
                                            )}
                                            {pct != null && (
                                                <Typography sx={{
                                                    fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem',
                                                    px: 0.75, py: 0.1, borderRadius: '4px',
                                                    background: pct >= 75 ? '#dcfce7' : pct >= 50 ? '#fff1e6' : '#fee2e2',
                                                    color: pct >= 75 ? '#16a34a' : pct >= 50 ? '#92400e' : '#b91c1c',
                                                }}>
                                                    {pct}th pct
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                    {pct != null
                                        ? <PercentileBar pct={pct} />
                                        : <Box sx={{ height: 6, background: dimColor, borderRadius: 3, opacity: 0.4 }} />
                                    }
                                </Box>
                            );
                        })}
                        {!allPlayersStats?.length && (
                            <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: '#a3681e', textAlign: 'center', mt: 1 }}>
                                Pass allPlayersStats prop to enable percentile rankings
                            </Typography>
                        )}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
