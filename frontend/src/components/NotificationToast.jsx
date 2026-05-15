// components/NotificationToast.jsx
import React, { useEffect } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import useNotificationStore from './stores/useNotificationStore';

const TYPE_META = {
    transaction: {
        icon: <SwapHorizIcon sx={{ fontSize: 16 }} />,
        color: '#f97316',
        bg: '#fff1e6',
        border: '#fde0c8',
    },
    injury: {
        icon: <LocalHospitalOutlinedIcon sx={{ fontSize: 16 }} />,
        color: '#dc2626',
        bg: '#fff5f5',
        border: '#fecaca',
    },
    depthChart: {
        icon: <TrendingUpIcon sx={{ fontSize: 16 }} />,
        color: '#16a34a',
        bg: '#f0fdf4',
        border: '#bbf7d0',
    },
};

const AUTO_DISMISS_MS = 6000;

function Toast({ notification, onDismiss }) {
    const meta = TYPE_META[notification.type] ?? TYPE_META.transaction;

    useEffect(() => {
        const timer = setTimeout(() => onDismiss(notification.id), AUTO_DISMISS_MS);
        return () => clearTimeout(timer);
    }, [notification.id, onDismiss]);

    // UI Made with Claude Assistance 
    return (
        <Box
            sx={{
                display: 'flex', alignItems: 'flex-start', gap: 1.25,
                p: 1.5,
                background: meta.bg,
                border: `1px solid ${meta.border}`,
                borderRadius: '10px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                minWidth: 280, maxWidth: 340,
                animation: 'slideIn 0.2s ease',
                '@keyframes slideIn': {
                    from: { opacity: 0, transform: 'translateX(40px)' },
                    to:   { opacity: 1, transform: 'translateX(0)' },
                },
            }}
        >
            {/* Icon */}
            <Box sx={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#fff', color: meta.color, flexShrink: 0,
                border: `1px solid ${meta.border}`,
            }}>
                {meta.icon}
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '0.82rem', fontWeight: 600, color: '#1a1008',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {notification.title}
                </Typography>
                <Typography sx={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '0.75rem', color: '#4a3520', lineHeight: 1.4, mt: 0.25,
                }}>
                    {notification.body}
                </Typography>
            </Box>

            {/* Dismiss */}
            <IconButton
                size="small"
                onClick={() => onDismiss(notification.id)}
                sx={{ p: 0.25, color: meta.color, opacity: 0.6, flexShrink: 0, '&:hover': { opacity: 1 } }}
            >
                <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
        </Box>
    );
}

export default function NotificationToastStack() {
    const toasts       = useNotificationStore(s => s.toasts);
    const dismissToast = useNotificationStore(s => s.dismissToast);

    if (!toasts.length) return null;

    return (
        <Box sx={{
            position: 'fixed',
            bottom: 24, right: 24,
            display: 'flex', flexDirection: 'column', gap: 1,
            zIndex: 1500,
            pointerEvents: 'none',
            '& > *': { pointerEvents: 'auto' },
        }}>
            {toasts.map(t => (
                <Toast key={t.id} notification={t} onDismiss={dismissToast} />
            ))}
        </Box>
    );
}