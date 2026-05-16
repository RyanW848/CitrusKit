import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, CircularProgress, Alert,
    InputAdornment, TextField,
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { getDepthChart } from '../api/playerClient';
import { abbreviateDepthPosition } from '../utils/playerStats';

const accent  = '#f97316';
const dim     = '#fde0c8';
const dark    = '#1a1008';
const muted   = '#a3681e';

// ─── Static MLB team list (MLB Stats API IDs) ────────────────────────────────
const MLB_TEAMS = [
    // AL East
    { id: '111', abbr: 'BAL', name: 'Baltimore Orioles',      division: 'AL East' },
    { id: '111', abbr: 'BOS', name: 'Boston Red Sox',         division: 'AL East' },
    { id: '147', abbr: 'NYY', name: 'New York Yankees',       division: 'AL East' },
    { id: '139', abbr: 'TB',  name: 'Tampa Bay Rays',         division: 'AL East' },
    { id: '141', abbr: 'TOR', name: 'Toronto Blue Jays',      division: 'AL East' },
    // AL Central
    { id: '145', abbr: 'CWS', name: 'Chicago White Sox',      division: 'AL Central' },
    { id: '114', abbr: 'CLE', name: 'Cleveland Guardians',    division: 'AL Central' },
    { id: '116', abbr: 'DET', name: 'Detroit Tigers',         division: 'AL Central' },
    { id: '118', abbr: 'KC',  name: 'Kansas City Royals',     division: 'AL Central' },
    { id: '142', abbr: 'MIN', name: 'Minnesota Twins',        division: 'AL Central' },
    // AL West
    { id: '117', abbr: 'HOU', name: 'Houston Astros',         division: 'AL West' },
    { id: '108', abbr: 'LAA', name: 'Los Angeles Angels',     division: 'AL West' },
    { id: '133', abbr: 'OAK', name: 'Oakland Athletics',      division: 'AL West' },
    { id: '136', abbr: 'SEA', name: 'Seattle Mariners',       division: 'AL West' },
    { id: '140', abbr: 'TEX', name: 'Texas Rangers',          division: 'AL West' },
    // NL East
    { id: '144', abbr: 'ATL', name: 'Atlanta Braves',         division: 'NL East' },
    { id: '146', abbr: 'MIA', name: 'Miami Marlins',          division: 'NL East' },
    { id: '121', abbr: 'NYM', name: 'New York Mets',          division: 'NL East' },
    { id: '143', abbr: 'PHI', name: 'Philadelphia Phillies',  division: 'NL East' },
    { id: '120', abbr: 'WSH', name: 'Washington Nationals',   division: 'NL East' },
    // NL Central
    { id: '112', abbr: 'CHC', name: 'Chicago Cubs',           division: 'NL Central' },
    { id: '113', abbr: 'CIN', name: 'Cincinnati Reds',        division: 'NL Central' },
    { id: '158', abbr: 'MIL', name: 'Milwaukee Brewers',      division: 'NL Central' },
    { id: '134', abbr: 'PIT', name: 'Pittsburgh Pirates',     division: 'NL Central' },
    { id: '138', abbr: 'STL', name: 'St. Louis Cardinals',    division: 'NL Central' },
    // NL West
    { id: '109', abbr: 'ARI', name: 'Arizona Diamondbacks',   division: 'NL West' },
    { id: '115', abbr: 'COL', name: 'Colorado Rockies',       division: 'NL West' },
    { id: '119', abbr: 'LAD', name: 'Los Angeles Dodgers',    division: 'NL West' },
    { id: '135', abbr: 'SD',  name: 'San Diego Padres',       division: 'NL West' },
    { id: '137', abbr: 'SF',  name: 'San Francisco Giants',   division: 'NL West' },
];

const DIVISIONS = [
    'AL East', 'AL Central', 'AL West',
    'NL East', 'NL Central', 'NL West',
];

// ─── Position ordering for display ───────────────────────────────────────────
const POSITION_ORDER = [
    'Starting Pitcher', 'Relief Pitcher', 'Closer', 'Pitcher',
    'Catcher',
    'First Base', 'Second Base', 'Third Base', 'Shortstop',
    'Outfielder', 'Left Field', 'Center Field', 'Right Field',
    'Designated Hitter', 'Utility',
];

function sortedPositionEntries(positions) {
    return Object.entries(positions).sort(([a], [b]) => {
        const ai = POSITION_ORDER.indexOf(a);
        const bi = POSITION_ORDER.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
    });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TeamChip({ team, active, onClick }) {
    return (
        <Box
            onClick={onClick}
            sx={{
                px: 1.5, py: 0.6,
                borderRadius: '8px',
                cursor: 'pointer',
                userSelect: 'none',
                border: `1.5px solid ${active ? accent : dim}`,
                bgcolor: active ? '#fff1e6' : '#fff9f5',
                transition: 'all 0.12s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.1,
                minWidth: 52,
                '&:hover': {
                    borderColor: accent,
                    bgcolor: '#fff8f3',
                },
            }}
        >
            <Typography sx={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.72rem',
                fontWeight: active ? 700 : 500,
                color: active ? accent : '#4a3520',
                lineHeight: 1.2,
                letterSpacing: '0.04em',
            }}>
                {team.abbr}
            </Typography>
        </Box>
    );
}

function DepthPositionBlock({ posLabel, players }) {
    const abbr = abbreviateDepthPosition(posLabel);

    // Dedupe
    const seen = new Set();
    const unique = players.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
    });

    return (
        <Box sx={{
            border: `1.5px solid ${dim}`,
            borderRadius: '10px',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.75, py: 0.85,
                background: '#fff1e6',
                borderBottom: `1px solid ${dim}`,
            }}>
                <Typography sx={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: accent,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    minWidth: 28,
                }}>
                    {abbr}
                </Typography>
                <Typography sx={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.62rem',
                    color: muted,
                    letterSpacing: '0.04em',
                }}>
                    {posLabel !== abbr ? posLabel : ''}
                </Typography>
                <Typography sx={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.6rem',
                    color: '#c4a896',
                    ml: 'auto',
                }}>
                    {unique.length} player{unique.length !== 1 ? 's' : ''}
                </Typography>
            </Box>

            {/* Player rows */}
            {unique.map((p, i) => {
                const injured = p.status?.startsWith('Injured');
                const ilDays  = injured ? p.status.match(/\d+/)?.[0] : null;
                return (
                    <Box
                        key={p.id}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                            px: 1.75,
                            py: 0.7,
                            borderBottom: i < unique.length - 1 ? `1px solid #fef0e6` : 'none',
                            bgcolor: i === 0 ? '#fffaf7' : 'transparent',
                        }}
                    >
                        {/* Rank */}
                        <Typography sx={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '0.65rem',
                            fontWeight: i === 0 ? 700 : 400,
                            color: i === 0 ? accent : '#c4a896',
                            width: 16,
                            textAlign: 'right',
                            flexShrink: 0,
                        }}>
                            {i + 1}
                        </Typography>

                        {/* Name */}
                        <Typography sx={{
                            fontFamily: "'IBM Plex Sans', sans-serif",
                            fontSize: '0.82rem',
                            fontWeight: i === 0 ? 600 : 400,
                            color: injured ? '#9a8a84' : dark,
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textDecoration: injured ? 'line-through' : 'none',
                        }}>
                            {p.name}
                        </Typography>

                        {/* IL tag */}
                        {injured && ilDays && (
                            <Typography sx={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: '0.58rem',
                                px: 0.6, py: 0.1,
                                borderRadius: '3px',
                                background: '#fee2e2',
                                color: '#b91c1c',
                                flexShrink: 0,
                                letterSpacing: '0.03em',
                            }}>
                                IL-{ilDays}
                            </Typography>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DepthChartView() {
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [depthChart, setDepthChart]     = useState(null);
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState(null);
    const [search, setSearch]             = useState('');

    const loadDepthChart = useCallback(async (team) => {
        setSelectedTeam(team);
        setDepthChart(null);
        setError(null);
        setLoading(true);
        try {
            const data = await getDepthChart(team.id);
            setDepthChart(data);
        } catch {
            setError(`Failed to load depth chart for ${team.name}.`);
        } finally {
            setLoading(false);
        }
    }, []);

    // Filter teams by search
    const filteredTeams = search.trim()
        ? MLB_TEAMS.filter(t =>
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.abbr.toLowerCase().includes(search.toLowerCase())
          )
        : MLB_TEAMS;

    const groupedTeams = DIVISIONS.reduce((acc, div) => {
        const teams = filteredTeams.filter(t => t.division === div);
        if (teams.length) acc[div] = teams;
        return acc;
    }, {});

    const positionEntries = depthChart?.positions
        ? sortedPositionEntries(depthChart.positions)
        : [];

    return (
        <Box>
            {/* ── Team selector ── */}
            <Box sx={{
                mb: 2.5,
                border: `1.5px solid ${dim}`,
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#fff9f5',
            }}>
                {/* Search */}
                <Box sx={{ px: 2, pt: 1.75, pb: 1.25, borderBottom: `1px solid ${dim}` }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search teams..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchOutlinedIcon sx={{ color: '#c4a896', fontSize: 18 }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                background: '#fff',
                                fontSize: '0.83rem',
                                fontFamily: "'IBM Plex Sans', sans-serif",
                                '& fieldset': { borderColor: dim },
                                '&:hover fieldset': { borderColor: '#d4c4b8' },
                                '&.Mui-focused fieldset': { borderColor: accent },
                            },
                        }}
                    />
                </Box>

                {/* Division groups */}
                <Box sx={{ px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {Object.entries(groupedTeams).map(([div, teams]) => (
                        <Box key={div}>
                            <Typography sx={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: '0.6rem',
                                fontWeight: 600,
                                color: muted,
                                textTransform: 'uppercase',
                                letterSpacing: '0.12em',
                                mb: 0.75,
                            }}>
                                {div}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                {teams.map(team => (
                                    <TeamChip
                                        key={team.abbr}
                                        team={team}
                                        active={selectedTeam?.abbr === team.abbr}
                                        onClick={() => loadDepthChart(team)}
                                    />
                                ))}
                            </Box>
                        </Box>
                    ))}
                    {Object.keys(groupedTeams).length === 0 && (
                        <Typography sx={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '0.75rem',
                            color: muted,
                            textAlign: 'center',
                            py: 1,
                        }}>
                            No teams match "{search}"
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* ── Depth chart content ── */}
            {!selectedTeam && !loading && (
                <Box sx={{
                    textAlign: 'center',
                    py: 6,
                    border: `1.5px dashed ${dim}`,
                    borderRadius: '12px',
                }}>
                    <Typography sx={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.8rem',
                        color: '#c4a896',
                        letterSpacing: '0.04em',
                    }}>
                        Select a team above to view their depth chart
                    </Typography>
                </Box>
            )}

            {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 4, justifyContent: 'center' }}>
                    <CircularProgress size={18} sx={{ color: accent }} />
                    <Typography sx={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.78rem',
                        color: muted,
                    }}>
                        Loading {selectedTeam?.name} depth chart…
                    </Typography>
                </Box>
            )}

            {error && !loading && (
                <Alert severity="error" sx={{ borderRadius: '10px', mb: 2 }}>{error}</Alert>
            )}

            {!loading && !error && depthChart && (
                <>
                    {/* Team header */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 1.75,
                        pb: 1.25,
                        borderBottom: `1.5px solid ${dim}`,
                    }}>
                        <Box>
                            <Typography sx={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: dark,
                                letterSpacing: '-0.01em',
                            }}>
                                {selectedTeam?.name}
                            </Typography>
                            <Typography sx={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: '0.65rem',
                                color: muted,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                            }}>
                                {selectedTeam?.division} · {positionEntries.length} positions
                            </Typography>
                        </Box>
                        <Box sx={{
                            px: 1.25, py: 0.35,
                            borderRadius: '6px',
                            bgcolor: '#fff1e6',
                            border: `1px solid ${dim}`,
                        }}>
                            <Typography sx={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: accent,
                            }}>
                                {selectedTeam?.abbr}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Position grid — 2 columns on wider screens, 1 on narrow */}
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                        gap: 1.5,
                    }}>
                        {positionEntries.map(([posLabel, players]) => (
                            <DepthPositionBlock
                                key={posLabel}
                                posLabel={posLabel}
                                players={players}
                            />
                        ))}
                    </Box>
                </>
            )}
        </Box>
    );
}