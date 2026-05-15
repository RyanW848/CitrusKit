import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Typography, IconButton, Badge, Divider, Button,
} from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import useNotificationStore from './stores/useNotificationStore';

const TYPE_META = {
    transaction: {
        icon: <SwapHorizIcon sx={{ fontSize: 15 }} />,
        color: '#f97316',
        bg: '#fff1e6',
    },
    injury: {
        icon: <LocalHospitalOutlinedIcon sx={{ fontSize: 15 }} />,
        color: '#dc2626',
        bg: '#fee2e2',
    },
    depthChart: {
        icon: <TrendingUpIcon sx={{ fontSize: 15 }} />,
        color: '#16a34a',
        bg: '#dcfce7',
    },
};

function timeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);

    if (mins < 1) return 'just now';

    if (mins < 60) return `${mins}m ago`;
    
    if (hrs < 24) return `${hrs}h ago`;
    
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const panelRef = useRef(null);
    const buttonRef = useRef(null);

    const notifications = useNotificationStore(s => s.notifications);
    const markAllSeen = useNotificationStore(s => s.markAllSeen);
    const clearAll = useNotificationStore(s => s.clearAll);
    const unseenCount = notifications.filter(n => !n.seen).length;

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (
                panelRef.current && !panelRef.current.contains(e.target) &&
                buttonRef.current && !buttonRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleOpen = () => {
        setOpen(v => !v);
        if (!open) markAllSeen();
    };

    // UI Made with Claude Assistance 
    return (
        <Box sx={{ position: 'relative' }}>
            <IconButton ref={buttonRef} onClick={handleOpen} size="small">
                <Badge
                    badgeContent={unseenCount}
                    max={99}
                    sx={{
                        '& .MuiBadge-badge': {
                            bgcolor: '#f97316',
                            color: '#fff',
                            fontSize: '0.6rem',
                            minWidth: 16,
                            height: 16,
                            p: '0 4px',
                        },
                    }}
                >
                    <NotificationsOutlinedIcon sx={{ fontSize: 22, color: '#6d5a57' }} />
                </Badge>
            </IconButton>

            {open && (
                <Box
                    ref={panelRef}
                    sx={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: 320,
                        background: '#fff9f5',
                        border: '1px solid #fde0c8',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        zIndex: 1400,
                        overflow: 'hidden',
                    }}
                >
                    {/* Header */}
                    <Box sx={{
                        px: 2, py: 1.5,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: '1px solid #fde0c8',
                    }}>
                        <Typography sx={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '0.78rem', fontWeight: 500, color: '#1a1008',
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}>
                            Notifications
                        </Typography>
                        {notifications.length > 0 && (
                            <Button
                                onClick={clearAll}
                                size="small"
                                sx={{
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    fontSize: '0.65rem', color: '#a3681e',
                                    textTransform: 'none', p: 0, minWidth: 0,
                                    '&:hover': { background: 'transparent', color: '#f97316' },
                                }}
                            >
                                Clear all
                            </Button>
                        )}
                    </Box>

                    {/* List */}
                    <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <Typography sx={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: '0.75rem', color: '#a3681e',
                                textAlign: 'center', py: 4,
                            }}>
                                No notifications yet
                            </Typography>
                        ) : (
                            notifications.map((n, i) => {
                                const meta = TYPE_META[n.type] ?? TYPE_META.transaction;
                                return (
                                    <Box key={n.id}>
                                        <Box sx={{
                                            display: 'flex', gap: 1.25,
                                            px: 2, py: 1.25,
                                            background: n.seen ? 'transparent' : '#fff8f3',
                                        }}>
                                            {/* Type icon */}
                                            <Box sx={{
                                                width: 28, height: 28, borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: meta.bg, color: meta.color, flexShrink: 0, mt: 0.25,
                                            }}>
                                                {meta.icon}
                                            </Box>

                                            {/* Content */}
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography sx={{
                                                    fontFamily: "'IBM Plex Sans', sans-serif",
                                                    fontSize: '0.82rem', fontWeight: 500,
                                                    color: '#1a1008',
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                }}>
                                                    {n.title}
                                                </Typography>
                                                <Typography sx={{
                                                    fontFamily: "'IBM Plex Sans', sans-serif",
                                                    fontSize: '0.75rem', color: '#6d5a57',
                                                    lineHeight: 1.4,
                                                }}>
                                                    {n.body}
                                                </Typography>
                                                <Typography sx={{
                                                    fontFamily: "'IBM Plex Mono', monospace",
                                                    fontSize: '0.65rem', color: '#a3681e', mt: 0.25,
                                                }}>
                                                    {timeAgo(n.timestamp)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        {i < notifications.length - 1 && (
                                            <Divider sx={{ borderColor: '#fef0e6' }} />
                                        )}
                                    </Box>
                                );
                            })
                        )}
                    </Box>
                </Box>
            )}
        </Box>
    );
}
