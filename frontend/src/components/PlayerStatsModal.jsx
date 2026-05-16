import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogTitle,
    Tabs, Tab, Box, IconButton, Typography, CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import {
    computeRadarData, computePercentile, computeRank,
    getStatsForPosition, getHeadshotUrl, resolveProfileName,
} from '../utils/playerStats';
import { getDepthChartRankings, abbreviateDepthPosition } from '../utils/playerStats'; // added
import { getDepthChart } from '../api/playerClient'; // added

const accentColor = '#f97316';
const dimColor    = '#fde0c8';

// ─── Sub-components ──────────────────────────────────────────────────────────

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
                width: 14, height: 14,
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

const PositionChip = ({ label, active, onClick }) => (
    <Box
        onClick={onClick}
        sx={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            px: 1, py: 0.35,
            borderRadius: '4px',
            cursor: 'pointer',
            userSelect: 'none',
            border: `1px solid ${active ? accentColor : 'rgba(255,255,255,0.2)'}`,
            background: active ? accentColor : 'transparent',
            color: active ? '#1a1008' : 'rgba(255,255,255,0.55)',
            transition: 'all 0.15s ease',
            '&:hover': { borderColor: accentColor, color: active ? '#1a1008' : accentColor },
        }}
    >
        {label}
    </Box>
);

/** Rank badge: "1st", "2nd", "3rd", "4th"… */
function ordinal(n) {
    const s = ['th','st','nd','rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/** Single depth-chart position block */
function DepthPositionCard({ entry, playerId }) {
    const abbr       = abbreviateDepthPosition(entry.position);
    const isSelf     = (p) => Number(p.id) === Number(playerId);
    const rankColor  = entry.rank === 1 ? '#16a34a' : entry.rank === 2 ? accentColor : '#64748b';

    return (
        <Box sx={{
            border: `1.5px solid ${dimColor}`,
            borderRadius: '10px',
            overflow: 'hidden',
            mb: 2,
        }}>
            {/* Position header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2, py: 1,
                background: '#fff1e6',
                borderBottom: `1px solid ${dimColor}`,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: accentColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                    }}>
                        {abbr}
                    </Typography>
                    <Typography sx={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.65rem',
                        color: '#a3681e',
                        letterSpacing: '0.05em',
                    }}>
                        · {entry.position}
                    </Typography>
                </Box>

                {/* Rank badge */}
                <Box sx={{
                    px: 1.25, py: 0.25,
                    borderRadius: '6px',
                    background: rankColor,
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 0.4,
                }}>
                    <Typography sx={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#fff',
                        lineHeight: 1,
                    }}>
                        {ordinal(entry.rank)}
                    </Typography>
                    <Typography sx={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.6rem',
                        color: 'rgba(255,255,255,0.75)',
                        lineHeight: 1,
                    }}>
                        / {entry.total}
                    </Typography>
                </Box>
            </Box>

            {/* Ranked player list */}
            {entry.players.map((p, i) => {
                const self    = isSelf(p);
                const injured = p.status?.startsWith('Injured');
                return (
                    <Box
                        key={p.id}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 2, py: 0.85,
                            background: self ? '#fff8f3' : 'transparent',
                            borderLeft: self ? `3px solid ${accentColor}` : '3px solid transparent',
                            borderBottom: i < entry.players.length - 1 ? `1px solid #fef0e6` : 'none',
                        }}
                    >
                        {/* Rank number */}
                        <Typography sx={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '0.68rem',
                            fontWeight: self ? 700 : 400,
                            color: self ? accentColor : '#c4a896',
                            width: 18,
                            flexShrink: 0,
                            textAlign: 'right',
                        }}>
                            {i + 1}
                        </Typography>

                        {/* Player name */}
                        <Typography sx={{
                            fontFamily: "'IBM Plex Sans', sans-serif",
                            fontSize: '0.83rem',
                            fontWeight: self ? 600 : 400,
                            color: self ? '#1a1008' : '#4a3520',
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {p.name}
                        </Typography>

                        {/* Injury / status tag */}
                        {injured && (
                            <Typography sx={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: '0.6rem',
                                px: 0.75, py: 0.1,
                                borderRadius: '4px',
                                background: '#fee2e2',
                                color: '#b91c1c',
                                flexShrink: 0,
                                letterSpacing: '0.04em',
                            }}>
                                {/* e.g. "Injured 60-Day" → "IL-60" */}
                                IL-{p.status.match(/\d+/)?.[0] ?? '?'}
                            </Typography>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const normalizePosition = (pos = '') => {
    const p = pos.trim().toUpperCase();
    if (p.includes('STARTING') || p.includes('STARTER')) return 'SP';
    if (p.includes('CLOSER')) return 'CL';
    if (p.includes('RELIEF') || p === 'RP') return 'RP';
    if (p === 'P' || p.includes('PITCHER')) return 'SP';
    if (p.includes('DESIGNATED') || p === 'DH') return 'DH';
    if (p === 'UT' || p.includes('UTIL')) return 'UT';
    if (p.includes('TWO-WAY') || p.includes('TWO WAY')) return null;
    if (p.includes('CENTER')) return 'CF';
    if (p.includes('LEFT')) return 'LF';
    if (p.includes('RIGHT')) return 'RF';
    if (p.includes('OUTFIELD') || p === 'OF') return 'OF';
    if (p.includes('SHORT') || p === 'SS') return 'SS';
    if (p.includes('THIRD') || p === '3B') return '3B';
    if (p.includes('SECOND') || p === '2B') return '2B';
    if (p.includes('FIRST') || p === '1B') return '1B';
    if (p.includes('CATCH') || p === 'C') return 'C';
    return p || null;
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function PlayerStatsModal({ open, onClose, playerResult, playerEntry, allPlayersStats }) {
    const [tab, setTab]                       = useState(0);
    const [selectedPosition, setSelectedPosition] = useState(null);

    // Depth chart state
    const [depthChart, setDepthChart]         = useState(null);
    const [depthLoading, setDepthLoading]     = useState(false);
    const [depthError, setDepthError]         = useState(null);

    const result = playerResult?.results?.[0];
    const player = result?.player;
    const team   = result?.team;
    const stats  = result?.stats ?? {};
    const year   = result?.year;

    const positions = (() => {
        const arr = playerEntry?.positions;
        let raw = [];
        if (Array.isArray(arr) && arr.length > 0) {
            raw = arr.map(normalizePosition).filter(Boolean);
        } else if (typeof arr === 'string' && arr.trim()) {
            raw = arr.split(',').map(s => normalizePosition(s.trim())).filter(Boolean);
        } else {
            const fallback = normalizePosition(player?.position ?? '');
            raw = fallback ? [fallback] : [];
        }
        const seenProfiles = new Set();
        return raw.filter(pos => {
            const profile = resolveProfileName(pos);
            if (seenProfiles.has(profile)) return false;
            seenProfiles.add(profile);
            return true;
        });
    })();

    useEffect(() => { setSelectedPosition(null); }, [player?.id]);

    // Fetch depth chart when the Depth tab (index 2) is first opened
    useEffect(() => {
        if (tab !== 2 || !open) return;
        if (depthChart || depthLoading) return; // already loaded / loading

        const teamId = team?.id;
        if (!teamId) { setDepthError('Team ID unavailable'); return; }

        setDepthLoading(true);
        setDepthError(null);

        getDepthChart(teamId)
            .then(data => setDepthChart(data))
            .catch(() => setDepthError('Failed to load depth chart'))
            .finally(() => setDepthLoading(false));
    }, [tab, open, team?.id]);

    // Reset depth chart when player changes
    useEffect(() => {
        setDepthChart(null);
        setDepthError(null);
        setDepthLoading(false);
        setTab(0);
    }, [player?.id]);

    if (!playerResult || !player) return null;

    const activePosition = selectedPosition ?? positions[0] ?? '';
    const headshotUrl    = getHeadshotUrl(player.id);
    const radarData      = computeRadarData(stats, activePosition);
    const positionStats  = getStatsForPosition(activePosition);

    const age         = stats.age + 'Y' || '—';
    const injuryStatus = player.injuryStatus;
    const statusText  = (injuryStatus && injuryStatus.startsWith('D'))
        ? `Injured ${injuryStatus.slice(1)}-Day`
        : 'Active';

    // Depth chart rankings for this player
    const depthRankings = depthChart
        ? getDepthChartRankings(depthChart, player.id)
        : [];

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
            <DialogTitle sx={{ p: 0 }}>
                <Box sx={{
                    background: 'linear-gradient(135deg, #1a1008 0%, #3a1f08 100%)',
                    px: 3, py: 2.5,
                    display: 'flex', alignItems: 'flex-start', gap: 2,
                }}>
                    {headshotUrl && (
                        <Box
                            component="img"
                            src={headshotUrl}
                            alt={player.name}
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                            sx={{
                                width: 64, height: 64,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: `2px solid ${accentColor}`,
                                flexShrink: 0,
                                mt: 0.25,
                            }}
                        />
                    )}

                    <Box sx={{ flex: 1, minWidth: 0 }}>
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
                            mt: 0.25, mb: positions.length > 1 ? 1 : 0,
                        }}>
                            {team?.abbreviation ?? '—'} · {year} · {player.position} · {age} · {statusText}
                        </Typography>

                        {positions.length > 1 && (
                            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                                {positions.map(pos => (
                                    <PositionChip
                                        key={pos}
                                        label={pos}
                                        active={activePosition === pos}
                                        onClick={() => setSelectedPosition(pos)}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>

                    <IconButton onClick={onClose} size="small" sx={{ color: '#fff9f5', opacity: 0.6, '&:hover': { opacity: 1 }, flexShrink: 0 }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

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
                    <Tab label="Radar" />
                    <Tab label="Rankings" />
                    <Tab label="Depth" />
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

                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap', mt: 1 }}>
                            {radarData.map(({ tool, value }) => (
                                <Box key={tool} sx={{
                                    textAlign: 'center',
                                    background: '#fff1e6',
                                    border: `1px solid ${dimColor}`,
                                    borderRadius: '8px',
                                    px: 1.5, py: 0.75,
                                    minWidth: 64,
                                }}>
                                    <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.1rem', fontWeight: 500, color: accentColor }}>
                                        {value}
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
                        {positionStats.map(({ key, label, isFloat }) => {
                            const raw = stats[key];
                            if (raw == null) return null;
                            const val = isFloat ? parseFloat(raw) : parseInt(raw, 10);
                            if (isNaN(val)) return null;

                            const allVals = allPlayersStats
                                ?.map(s => isFloat ? parseFloat(s[key]) : parseInt(s[key], 10))
                                .filter(v => !isNaN(v));

                            const pct   = allVals?.length ? computePercentile(val, allVals) : null;
                            const rank  = allVals?.length ? computeRank(val, allVals)       : null;
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

                {/* ── Tab 2: Depth Chart ── */}
                {tab === 2 && (
                    <Box sx={{ p: 3 }}>
                        {depthLoading && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 5 }}>
                                <CircularProgress size={18} sx={{ color: accentColor }} />
                                <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: '#a3681e' }}>
                                    Loading depth chart…
                                </Typography>
                            </Box>
                        )}

                        {depthError && !depthLoading && (
                            <Typography sx={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: '0.75rem', color: '#b91c1c',
                                textAlign: 'center', py: 4,
                            }}>
                                {depthError}
                            </Typography>
                        )}

                        {!depthLoading && !depthError && depthRankings.length === 0 && depthChart && (
                            <Typography sx={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: '0.75rem', color: '#a3681e',
                                textAlign: 'center', py: 4,
                            }}>
                                {player.name} does not appear on this team's depth chart.
                            </Typography>
                        )}

                        {!depthLoading && !depthError && depthRankings.map(entry => (
                            <DepthPositionCard
                                key={entry.position}
                                entry={entry}
                                playerId={player.id}
                            />
                        ))}
                    </Box>
                )}

            </DialogContent>
        </Dialog>
    );
}