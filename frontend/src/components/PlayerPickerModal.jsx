import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent,
    Box, Typography, IconButton, CircularProgress,
    InputAdornment, TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { getPlayerValues } from '../api/playerClient';
import { getHeadshotUrl } from '../utils/playerStats';
import PlayerStatsModal from './PlayerStatsModal';
import usePlayerStore from './stores/usePlayerStore';

const accent = '#f97316';
const dim    = '#fde0c8';

// ─── Position eligibility ─────────────────────────────────────────────────────
// Returns true if a player (from /players, positions is CSV string) is eligible
// for a given roster slot abbreviation.
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

// ─── Player Card ──────────────────────────────────────────────────────────────
function PlayerCard({ player, valuationMap, slotAbbr, onAdd, onViewStats }) {
    const eligible   = isEligible(player.positions, slotAbbr);
    const valuation  = valuationMap?.[player.id];
    const headshotUrl = getHeadshotUrl(player.id);

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

// ─── Main Modal ───────────────────────────────────────────────────────────────
/**
 * PlayerPickerModal
 *
 * Props:
 *   open           boolean
 *   onClose        () => void
 *   slotAbbr       string | null   — active roster slot abbreviation for eligibility
 *   slotName       string | null   — display name of the slot
 *   draftContext   { budget, relevantStats, unavailablePlayers } | null
 *   onSelectPlayer (player) => void — called when + is clicked on an eligible player
 */
export default function PlayerPickerModal({
    open,
    onClose,
    slotAbbr,
    slotName,
    draftContext,
    onSelectPlayer,
}) {
    const { allPlayers, fetchAllPlayers } = usePlayerStore();

    const [query, setQuery]             = useState('');
    const [valuationMap, setValuationMap] = useState({}); // { mlbId: value }
    const [valuationLoading, setValuationLoading] = useState(false);

    // PlayerStatsModal state
    const [statsOpen, setStatsOpen]         = useState(false);
    const [statsResult, setStatsResult]     = useState(null);
    const [statsEntry, setStatsEntry]       = useState(null);
    const [statsLoading, setStatsLoading]   = useState(false);

    const inputRef = useRef(null);

    useEffect(() => { fetchAllPlayers(); }, [fetchAllPlayers]);

    // Fetch valuations when modal opens
    useEffect(() => {
        if (!open) return;
        setQuery('');
        setValuationMap({});

        if (!draftContext) return;
        setValuationLoading(true);

        getPlayerValues({
            budget: draftContext.budget,
            relevantStats: draftContext.relevantStats,
            unavailablePlayers: draftContext.unavailablePlayers ?? [],
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

    // Sort: by valuation desc, then alphabetically for unvalued players
    const filtered = allPlayers
        .filter(p => !query || p.name.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => {
            const va = valuationMap[a.id] ?? -1;
            const vb = valuationMap[b.id] ?? -1;
            return vb - va;
        });

    const handleViewStats = async (player) => {
        setStatsEntry(player);
        setStatsLoading(true);
        try {
            const { getPlayerStats } = await import('../api/playerClient');
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
                            {slotAbbr && (
                                <Typography sx={{
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    fontSize: '0.65rem', color: accent,
                                    textTransform: 'uppercase', letterSpacing: '0.1em', mt: 0.25,
                                }}>
                                    Only eligible {slotAbbr} players can be added
                                </Typography>
                            )}
                        </Box>
                        <IconButton onClick={onClose} size="small" sx={{ color: '#fff9f5', opacity: 0.6, '&:hover': { opacity: 1 } }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    {/* Search bar */}
                    <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${dim}`, background: '#fff9f5' }}>
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
                    </Box>
                </DialogTitle>

                {/* Player list */}
                <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                    {valuationLoading && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5, borderBottom: `1px solid ${dim}` }}>
                            <CircularProgress size={14} sx={{ color: accent }} />
                            <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#a3681e' }}>
                                Loading valuations...
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
                            slotAbbr={slotAbbr}
                            onAdd={p => { onSelectPlayer(p); onClose(); }}
                            onViewStats={handleViewStats}
                        />
                    ))}
                </DialogContent>
            </Dialog>

            {/* Nested PlayerStatsModal */}
            <PlayerStatsModal
                open={statsOpen}
                onClose={() => setStatsOpen(false)}
                playerResult={statsResult}
                playerEntry={statsEntry}
                allPlayersStats={null}
            />
        </>
    );
}