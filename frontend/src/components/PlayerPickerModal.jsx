import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent,
    Box, Typography, IconButton, CircularProgress,
    InputAdornment, TextField, ToggleButtonGroup, ToggleButton, Button, Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AddIcon from '@mui/icons-material/Add';
import { getPlayerValues, getPlayerStats } from '../api/playerClient';
import { getHeadshotUrl } from '../utils/playerStats';
import { LOWER_BETTER, getKeyStats, fmtStat } from '../utils/draftStatsHelpers';
import PlayerStatsModal from './PlayerStatsModal';
import usePlayerStore from './stores/usePlayerStore';

const accent = '#f97316';
const dim    = '#fde0c8';
const MAX_VISIBLE = 20;

function isEligible(playerPositions, slotAbbr) {
    if (!slotAbbr) return true;

    // Normalize player positions — could be array or CSV string
    const positions = Array.isArray(playerPositions)
        ? playerPositions
        : (playerPositions ? String(playerPositions).split(',').map(s => s.trim()) : []);

    if (positions.length === 0) return true; // unknown — allow

    const required =
        slotAbbr === 'SP' || slotAbbr === 'RP' ? ['P'] :
        slotAbbr === 'CI'  ? ['1B', '3B'] :
        slotAbbr === 'MI'  ? ['2B', 'SS'] :
        slotAbbr === 'U'   ? null :          // utility — anything
        [slotAbbr];

    if (required === null) return true;
    return positions.some(p => required.includes(p));
}

function PlayerCard({ player, valuationMap, statsMap, slotAbbr, onAdd, onViewStats }) {
    const eligible   = isEligible(player.positions, slotAbbr);
    const valuation  = valuationMap?.[player.id];
    const headshotUrl = getHeadshotUrl(player.id);
    const playerStats = statsMap?.[String(player.id)];
    const keyStats = getKeyStats(player.positions);

    const positions = Array.isArray(player.positions)
        ? player.positions.join(' · ')
        : player.positions ?? '';

    return (
        <Box
            onClick={() => onViewStats(player)}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2, py: 1.25,
                cursor: 'pointer',
                borderBottom: '1px solid #fef0e6',
                transition: 'background 0.12s',
                '&:hover': { background: '#fff8f3' },
                opacity: eligible ? 1 : 0.45,
            }}
        >
            {/* Headshot */}
            <Box sx={{
                width: 40, height: 40, borderRadius: '50%',
                overflow: 'hidden', flexShrink: 0,
                background: '#fde0c8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {headshotUrl ? (
                    <Box
                        component="img"
                        src={headshotUrl}
                        alt={player.name}
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <PersonOutlineIcon sx={{ fontSize: 22, color: '#c4a896' }} />
                )}
            </Box>

            {/* Name + position */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '0.88rem', fontWeight: 500,
                    color: '#1a1008',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {player.name}
                </Typography>
                <Typography sx={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.68rem', color: '#a3681e',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                    {positions}
                    {!eligible && slotAbbr && (
                        <Box component="span" sx={{ ml: 1, color: '#dc2626' }}>
                            · ineligible for {slotAbbr}
                        </Box>
                    )}
                </Typography>
                {playerStats && (
                    <Box sx={{ display: 'flex', gap: 1.25, mt: 0.25, flexWrap: 'wrap' }}>
                        {keyStats.map(({ key, label }) => {
                            const formatted = fmtStat(key, playerStats[key]);
                            if (!formatted) return null;
                            return (
                                <Typography key={key} sx={{
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    fontSize: '0.68rem',
                                    color: '#7c4a1e',
                                }}>
                                    {formatted} <Box component="span" sx={{ color: '#c4986a', fontSize: '0.62rem' }}>{label}</Box>
                                </Typography>
                            );
                        })}
                    </Box>
                )}
            </Box>

            {/* Projected value */}
            {valuation != null && (
                <Typography sx={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.78rem', fontWeight: 600,
                    color: accent, flexShrink: 0,
                    mr: 0.5,
                }}>
                    ${valuation}
                </Typography>
            )}

            {/* Add button — only enabled if eligible */}
            <IconButton
                size="small"
                disabled={!eligible}
                onClick={e => { e.stopPropagation(); onAdd(player); }}
                sx={{
                    flexShrink: 0,
                    color: eligible ? accent : '#d0bcb6',
                    '&:hover': { background: eligible ? '#fff1e6' : 'transparent' },
                    p: 0.5,
                }}
            >
                <AddCircleOutlineIcon fontSize="small" />
            </IconButton>
        </Box>
    );
}

export default function PlayerPickerModal({
    open,
    onClose,
    slotAbbr,
    slotName,
    draftContext,
    onSelectPlayer,
}) {
    const { allPlayers, fetchAllPlayers, 
        allPlayersStats, fetchAllPlayersStats 
    } = usePlayerStore();

    const [query, setQuery]               = useState('');
    const [mode, setMode]                 = useState('search'); // 'search' | 'custom'
    const [customName, setCustomName]     = useState('');
    const [filterEligible, setFilterEligible] = useState(false);
    const [valuationMap, setValuationMap] = useState({});
    const [valuationLoading, setValuationLoading] = useState(false);
    const [statsMap, setStatsMap]         = useState({});
    const [sortBy, setSortBy]             = useState('value');
    const fetchedIdsRef                   = useRef(new Set());

    // PlayerStatsModal state
    const [statsOpen, setStatsOpen]         = useState(false);
    const [statsResult, setStatsResult]     = useState(null);
    const [statsEntry, setStatsEntry]       = useState(null);
    const [statsLoading, setStatsLoading]   = useState(false);

    const inputRef = useRef(null);

    useEffect(() => { fetchAllPlayers(); }, [fetchAllPlayers]);

    useEffect(() => { fetchAllPlayersStats(); }, [fetchAllPlayerStats]);

    // Fetch valuations when modal opens
    useEffect(() => {
        if (!open) return;
        setQuery('');
        setMode('search');
        setCustomName('');
        setFilterEligible(false);
        setSortBy('value');
        setStatsMap({});
        fetchedIdsRef.current = new Set();
        setValuationMap({});

        if (!draftContext) return;
        setValuationLoading(true);

        getPlayerValues({
            budget: draftContext.budget,
            relevantStats: draftContext.relevantStats,
            unavailablePlayers: draftContext.unavailablePlayers ?? [],
            playersLeftToDraft: draftContext.playersLeftToDraft ?? undefined,
        })
            .then(data => {
                const map = {};
                (data?.results ?? []).forEach(r => {
                    map[r.mlbId] = r.value;
                });
                setValuationMap(map);
            })
            .catch(() => setValuationMap({}))
            .finally(() => setValuationLoading(false));
    }, [open, draftContext]);

    const isPitcherSlot = slotAbbr === 'SP' || slotAbbr === 'RP' || slotAbbr === 'P';
    const sortOptions = useMemo(() => [
        { key: 'value', label: '$ Val' },
        ...(isPitcherSlot
            ? [
                { key: 'era', label: 'ERA' },
                { key: 'wins', label: 'W' },
                { key: 'saves', label: 'SV' },
                { key: 'strikeOutsPitching', label: 'K' },
                { key: 'whip', label: 'WHIP' },
            ]
            : [
                { key: 'avg', label: 'AVG' },
                { key: 'homeRuns', label: 'HR' },
                { key: 'rbi', label: 'RBI' },
                { key: 'stolenBases', label: 'SB' },
                { key: 'ops', label: 'OPS' },
            ]
        ),
    ], [isPitcherSlot]);

    // Sort: by value or by stat. Cap at MAX_VISIBLE for performance.
    const filtered = allPlayers
        .filter(p => !query || p.name.toLowerCase().includes(query.toLowerCase()))
        .filter(p => !filterEligible || isEligible(p.positions, slotAbbr))
        .sort((a, b) => {
            if (sortBy === 'value') {
                return (valuationMap[b.id] ?? -1) - (valuationMap[a.id] ?? -1);
            }
            const sentinel = LOWER_BETTER.has(sortBy) ? 999 : -1;
            const aVal = parseFloat(statsMap[String(a.id)]?.[sortBy] ?? sentinel) || sentinel;
            const bVal = parseFloat(statsMap[String(b.id)]?.[sortBy] ?? sentinel) || sentinel;
            return LOWER_BETTER.has(sortBy) ? aVal - bVal : bVal - aVal;
        })
        .slice(0, MAX_VISIBLE);

    // Fetch stats for visible players not yet loaded
    const filteredIdStr = filtered.map(p => p.id).filter(Boolean).join(',');
    useEffect(() => {
        if (!filteredIdStr) return;
        const ids = filteredIdStr.split(',').filter(id => !fetchedIdsRef.current.has(id));
        if (!ids.length) return;
        ids.forEach(id => fetchedIdsRef.current.add(id));
        getPlayerStats(ids)
            .then(data => {
                const entries = {};
                (data?.results ?? []).forEach(r => {
                    const id = String(r.player?.id ?? '');
                    if (id) entries[id] = r.stats ?? {};
                });
                if (Object.keys(entries).length) setStatsMap(prev => ({ ...prev, ...entries }));
            })
            .catch(() => {});
    }, [filteredIdStr]);

    const handleViewStats = async (player) => {
        setStatsEntry(player);
        setStatsLoading(true);
        try {
            const data = await getPlayerStats(player.id);
            setStatsResult(data);
            setStatsOpen(true);
        } catch {
            // silently ignore — stats not available
        } finally {
            setStatsLoading(false);
        }
    };

    return (
        <>
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
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                    }
                }}
            >
                {/* Header */}
                <DialogTitle sx={{ p: 0 }}>
                    <Box sx={{
                        background: 'linear-gradient(135deg, #1a1008 0%, #3a1f08 100%)',
                        px: 3, py: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <Box>
                            <Typography sx={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: '0.95rem', fontWeight: 500,
                                color: '#fff9f5',
                            }}>
                                {slotName ? `Select Player — ${slotAbbr} · ${slotName}` : 'Select Player'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5, flexWrap: 'wrap' }}>
                                {slotAbbr && (
                                    <Typography sx={{
                                        fontFamily: "'IBM Plex Mono', monospace",
                                        fontSize: '0.65rem', color: accent,
                                        textTransform: 'uppercase', letterSpacing: '0.1em',
                                    }}>
                                        {slotAbbr} eligible only
                                    </Typography>
                                )}
                                {draftContext?.budget != null && (
                                    <Typography sx={{
                                        fontFamily: "'IBM Plex Mono', monospace",
                                        fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)',
                                        textTransform: 'uppercase', letterSpacing: '0.1em',
                                    }}>
                                        ${draftContext.budget} budget
                                    </Typography>
                                )}
                                {draftContext?.playersLeftToDraft != null && (
                                    <Typography sx={{
                                        fontFamily: "'IBM Plex Mono', monospace",
                                        fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)',
                                        textTransform: 'uppercase', letterSpacing: '0.1em',
                                    }}>
                                        {draftContext.playersLeftToDraft} slots remaining
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                        <IconButton onClick={onClose} size="small" sx={{ color: '#fff9f5', opacity: 0.6, '&:hover': { opacity: 1 } }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    {/* Mode toggle */}
                    <Box sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${dim}`, background: '#fff9f5' }}>
                        <ToggleButtonGroup
                            value={mode}
                            exclusive
                            onChange={(_, v) => { if (v) setMode(v); }}
                            size="small"
                            fullWidth
                            sx={{
                                '& .MuiToggleButton-root': {
                                    textTransform: 'none',
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    fontSize: '0.72rem',
                                    borderColor: dim,
                                    color: '#a3681e',
                                    '&.Mui-selected': {
                                        bgcolor: '#fff1e6',
                                        color: accent,
                                        borderColor: accent,
                                    },
                                },
                            }}
                        >
                            <ToggleButton value="search">Search Player</ToggleButton>
                            <ToggleButton value="custom">Custom Player</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {/* Search bar — only in search mode */}
                    {mode === 'search' && (
                        <Box sx={{ px: 2, pt: 1.5, pb: 1, borderBottom: `1px solid ${dim}`, background: '#fff9f5' }}>
                            <TextField
                                inputRef={inputRef}
                                fullWidth
                                size="small"
                                placeholder="Search players..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                autoFocus
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchOutlinedIcon sx={{ color: '#c4a896', fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '10px',
                                        background: '#fff',
                                        '& fieldset': { borderColor: dim },
                                        '&:hover fieldset': { borderColor: '#d4c4b8' },
                                        '&.Mui-focused fieldset': { borderColor: accent },
                                    },
                                }}
                            />
                            <Box sx={{ mt: 1, display: 'flex', gap: 0.75, alignItems: 'center' }}>
                                <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: '#c4a896', letterSpacing: '0.06em', flexShrink: 0 }}>
                                    sort:
                                </Typography>
                                {sortOptions.map(opt => {
                                    const active = sortBy === opt.key;
                                    return (
                                        <Chip
                                            key={opt.key}
                                            label={opt.label}
                                            size="small"
                                            onClick={() => setSortBy(opt.key)}
                                            sx={{
                                                fontFamily: "'IBM Plex Mono', monospace",
                                                fontSize: '0.68rem',
                                                height: 22,
                                                bgcolor: active ? '#3a1f08' : 'transparent',
                                                color: active ? '#fff9f5' : '#a3681e',
                                                border: `1px solid ${active ? '#3a1f08' : '#e8c9a8'}`,
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: active ? '#2a1505' : '#fff1e6' },
                                                '& .MuiChip-label': { px: 1 },
                                            }}
                                        />
                                    );
                                })}
                                {slotAbbr && (
                                    <Chip
                                        label={`${slotAbbr} eligible`}
                                        size="small"
                                        onClick={() => setFilterEligible(f => !f)}
                                        sx={{
                                            fontFamily: "'IBM Plex Mono', monospace",
                                            fontSize: '0.68rem',
                                            height: 22,
                                            ml: 'auto',
                                            bgcolor: filterEligible ? accent : 'transparent',
                                            color: filterEligible ? '#fff9f5' : '#a3681e',
                                            border: `1px solid ${filterEligible ? accent : '#e8c9a8'}`,
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: filterEligible ? '#e86a0a' : '#fff1e6' },
                                            '& .MuiChip-label': { px: 1 },
                                        }}
                                    />
                                )}
                            </Box>
                        </Box>
                    )}

                    {/* Custom player form — only in custom mode */}
                    {mode === 'custom' && (
                        <Box sx={{ px: 2, py: 2, borderBottom: `1px solid ${dim}`, background: '#fff9f5', display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Player name"
                                value={customName}
                                onChange={e => setCustomName(e.target.value)}
                                autoFocus
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && customName.trim()) {
                                        onSelectPlayer({ id: null, name: customName.trim(), positions: null, headshotUrl: null });
                                        onClose();
                                    }
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '10px',
                                        background: '#fff',
                                        '& fieldset': { borderColor: dim },
                                        '&.Mui-focused fieldset': { borderColor: accent },
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': { color: accent },
                                }}
                            />
                            <Button
                                variant="contained"
                                disabled={!customName.trim()}
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    onSelectPlayer({ id: null, name: customName.trim(), positions: null, headshotUrl: null });
                                    onClose();
                                }}
                                sx={{
                                    flexShrink: 0,
                                    bgcolor: accent,
                                    color: '#fff9f5',
                                    borderRadius: '10px',
                                    textTransform: 'none',
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    fontSize: '0.75rem',
                                    boxShadow: 'none',
                                    '&:hover': { bgcolor: '#e86a0a', boxShadow: 'none' },
                                    '&:disabled': { bgcolor: dim, color: '#a3681e' },
                                }}
                            >
                                Add
                            </Button>
                        </Box>
                    )}
                </DialogTitle>

                {/* Player list — only in search mode */}
                <DialogContent sx={{ p: 0, overflowY: 'auto', display: mode === 'custom' ? 'none' : 'block' }}>
                    {valuationLoading && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5, borderBottom: `1px solid ${dim}` }}>
                            <CircularProgress size={14} sx={{ color: accent }} />
                            <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#a3681e' }}>
                                Loading valuations and statistics...
                            </Typography>
                        </Box>
                    )}
                    {statsLoading && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5, borderBottom: `1px solid ${dim}` }}>
                            <CircularProgress size={14} sx={{ color: accent }} />
                            <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#a3681e' }}>
                                Loading player stats...
                            </Typography>
                        </Box>
                    )}
                    {filtered.length === 0 && !valuationLoading && (
                        <Typography sx={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '0.8rem', color: '#a3681e',
                            textAlign: 'center', py: 4,
                        }}>
                            No players found
                        </Typography>
                    )}
                    {filtered.map(player => (
                        <PlayerCard
                            key={player.id}
                            player={player}
                            valuationMap={valuationMap}
                            statsMap={statsMap}
                            slotAbbr={slotAbbr}
                            onAdd={p => { onSelectPlayer(p); onClose(); }}
                            onViewStats={handleViewStats}
                        />
                    ))}
                    {query.length === 0 && allPlayers.length > MAX_VISIBLE && (
                        <Typography sx={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '0.68rem', color: '#c4a896',
                            textAlign: 'center', py: 1.5,
                        }}>
                            Showing top {MAX_VISIBLE} by value — type to search all {allPlayers.length} players
                        </Typography>
                    )}
                </DialogContent>
            </Dialog>

            {/* Nested PlayerStatsModal */}
            <PlayerStatsModal
                open={statsOpen}
                onClose={() => setStatsOpen(false)}
                playerResult={statsResult}
                playerEntry={statsEntry}
                allPlayersStats={allPlayersStats}
            />
        </>
    );
}