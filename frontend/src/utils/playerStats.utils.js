// Normalizes (given the range of the values) from 0 to 100
export const clamp = (val, max) => Math.min(100, Math.round((val / max) * 100));

// Claude assisted 
export const computeFiveTools = (stats = {}) => ({
    Contact: clamp(parseFloat(stats.avg  || 0) * 1000, 320), // .320 avg → 100
    Power:   clamp(stats.homeRuns        || 0,          55), // 55 HR  → 100
    Speed:   clamp(stats.stolenBases     || 0,          60), // 60 SB  → 100
    Defense: clamp(
        stats.fieldingPercentage ? parseFloat(stats.fieldingPercentage) * 100 : 50,
        100
    ),
    Arm:     clamp(stats.assists         || 0,         120), // assists as proxy
});

export const computePercentile = (value, allValues) => {
    if (!allValues?.length) return 0;

    const below = allValues.filter(v => v < value).length;

    return Math.round((below / allValues.length) * 100);
}

export const computeRank = (value, allValues) => {
    if (!allValues?.length) return null;

    return allValues.filter(v => v > value).length + 1;
};

// Claude assisted
export const RANKING_STATS = [
    { key: 'homeRuns',          label: 'Home Runs',    isFloat: false },
    { key: 'avg',               label: 'Batting Avg',  isFloat: true  },
    { key: 'rbi',               label: 'RBI',          isFloat: false },
    { key: 'stolenBases',       label: 'Stolen Bases', isFloat: false },
    { key: 'obp',               label: 'On-Base %',    isFloat: true  },
    { key: 'slg',               label: 'Slugging %',   isFloat: true  },
    { key: 'strikeOuts',        label: 'Strikeouts',   isFloat: false },
    { key: 'gamesPlayed',       label: 'Games Played', isFloat: false },
];