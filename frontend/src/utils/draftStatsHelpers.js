export const LOWER_BETTER = new Set(['era', 'whip', 'losses', 'earnedRuns', 'homeRunsAllowed', 'errors', 'passedBall']);

export const KEY_STATS_SP  = [{ key: 'era', label: 'ERA' }, { key: 'wins', label: 'W' }, { key: 'strikeOutsPitching', label: 'K' }];
export const KEY_STATS_RP  = [{ key: 'era', label: 'ERA' }, { key: 'saves', label: 'SV' }, { key: 'strikeOutsPitching', label: 'K' }];
export const KEY_STATS_HIT = [{ key: 'avg', label: 'AVG' }, { key: 'homeRuns', label: 'HR' }, { key: 'rbi', label: 'RBI' }];

export function getKeyStats(positions) {
    const p0 = ((Array.isArray(positions) ? positions[0] : positions) ?? '').toUpperCase();
    if (p0 === 'RP' || p0 === 'CL') return KEY_STATS_RP;
    if (p0 === 'SP' || p0 === 'P') return KEY_STATS_SP;
    return KEY_STATS_HIT;
}

export function fmtStat(key, val) {
    if (val == null || val === '') return null;
    const n = parseFloat(val);
    if (isNaN(n)) return null;
    if (key === 'avg' || key === 'obp' || key === 'slg' || key === 'ops') return n.toFixed(3).replace(/^0\./, '.');
    if (key === 'era' || key === 'whip' || key === 'inningsPitched') return n.toFixed(2);
    return Math.round(n).toString();
}
