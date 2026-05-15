import { useEffect, useRef } from 'react';
import { getTransactions, getDepthChart, getAllTeams } from '../api/playerClient';
import useNotificationStore from '../components/stores/useNotificationStore';

const POLL_INTERVAL_MS = 1 * 60 * 1000; // 1 Minute Interval

let lastTransactionDate = null;
const lastInjuryMap = {};

function transactionId(tx) {
    return `tx-${tx.playerId}-${tx.description}-${tx.date ?? ''}`;
}

function injuryId(playerId, status) {
    return `injury-${playerId}-${status}`;
}

async function pollTransactions(addNotifications) {
    try {
        const data = await getTransactions();
        if (!data?.transactions?.length) return;
 
        if (data.date && data.date === lastTransactionDate) return;
        lastTransactionDate = data.date;
 
        const notifications = data.transactions.map(tx => ({
            id: transactionId(tx),
            type: 'transaction',
            title: tx.playerName ?? 'Transaction',
            body: tx.description ?? `Moved from ${tx.fromTeam} to ${tx.toTeam}`,
            timestamp: Date.now(),
            seen: false,
        }));
 
        addNotifications(notifications);
    } catch {
        // Ignore
    }
}

async function pollDepthCharts(addNotifications) {
    try {
        const teams = await getAllTeams();
        if (!teams?.length) return;
 
        const notifications = [];
 
        await Promise.allSettled(
            teams.map(async team => {
                try {
                    const data = await getDepthChart(team.id);
                    const positions = data?.positions ?? {};
 
                    Object.values(positions).forEach(players => {
                        (players ?? []).forEach(player => {
                            if (!player?.id) return;
                            const prev = lastInjuryMap[player.id];
                            const curr = player.status ?? 'Active';
 
                            if (prev !== undefined && prev !== curr) {
                                notifications.push({
                                    id: injuryId(player.id, curr),
                                    type: curr === 'Active' ? 'depthChart' : 'injury',
                                    title: player.name ?? `Player ${player.id}`,
                                    body: curr === 'Active'
                                        ? `Activated — returned to ${team.name} roster`
                                        : `${curr} — ${team.name}`,
                                    timestamp: Date.now(),
                                    seen: false,
                                });
                            }
 
                            lastInjuryMap[player.id] = curr;
                        });
                    });
                } catch {
                    // No abort
                }
            })
        );
 
        if (notifications.length) addNotifications(notifications);
    } catch {
        // Ignore
    }
}

export default function useNotificationPoller() {
    const addNotifications = useNotificationStore(s => s.addNotifications);
    const timerRef = useRef(null);
 
    const runPolls = () => {
        pollTransactions(addNotifications);
        pollDepthCharts(addNotifications);
    };
    
    // Runs every interval
    useEffect(() => {
        runPolls();
 
        timerRef.current = setInterval(runPolls, POLL_INTERVAL_MS);
 
        return () => clearInterval(timerRef.current);
    }, []);
}


