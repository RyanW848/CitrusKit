export const clamp = (val, max) => Math.min(100, Math.round((val / max) * 100));

const RADAR_PROFILES = {
    hitter: [
        { label: 'Contact', compute: s => clamp(parseFloat(s.avg  || 0) * 1000, 320) },
        { label: 'Power',   compute: s => clamp(s.homeRuns    || 0, 55) },
        { label: 'Speed',   compute: s => clamp(s.stolenBases || 0, 60) },
        { label: 'Eye',     compute: s => clamp(parseFloat(s.obp || 0) * 1000, 420) },
        { label: 'Defense', compute: s => clamp(s.fieldingPercentage ? parseFloat(s.fieldingPercentage) * 100 : 50, 100) },
    ],
    dh: [
        { label: 'Contact', compute: s => clamp(parseFloat(s.avg  || 0) * 1000, 320) },
        { label: 'Power',   compute: s => clamp(s.homeRuns    || 0, 55) },
        { label: 'Speed',   compute: s => clamp(s.stolenBases || 0, 60) },
        { label: 'Eye',     compute: s => clamp(parseFloat(s.obp || 0) * 1000, 420) },
        { label: 'Clutch',  compute: s => clamp(s.rbi         || 0, 140) },
    ],
    catcher: [
        { label: 'Contact',  compute: s => clamp(parseFloat(s.avg || 0) * 1000, 320) },
        { label: 'Power',    compute: s => clamp(s.homeRuns   || 0, 35) },
        { label: 'Arm',      compute: s => clamp(s.caughtStealing || 0, 40) },
        { label: 'Defense',  compute: s => clamp(s.fieldingPercentage ? parseFloat(s.fieldingPercentage) * 100 : 50, 100) },
        { label: 'Framing',  compute: s => clamp(Math.max(0, 10 - (s.passedBall || 0)), 10) },
    ],
    sp: [
        { label: 'Stuff',     compute: s => clamp(s.strikeOutsPitching || s.strikeOuts || 0, 250) },
        { label: 'Control',   compute: s => clamp(Math.max(0, 5 - parseFloat(s.whip || 5)) * 20, 100) },
        { label: 'Stamina',   compute: s => clamp(parseFloat(s.inningsPitched || 0), 220) },
        { label: 'Dominance', compute: s => clamp(Math.max(0, 9 - parseFloat(s.era || 9)) * 11, 100) },
        { label: 'Wins',      compute: s => clamp(s.wins || 0, 20) },
    ],
    rp: [
        { label: 'Stuff',   compute: s => clamp(s.strikeOutsPitching || s.strikeOuts || 0, 100) },
        { label: 'Control', compute: s => clamp(Math.max(0, 5 - parseFloat(s.whip || 5)) * 20, 100) },
        { label: 'Saves',   compute: s => clamp(s.saves  || 0, 45) },
        { label: 'ERA',     compute: s => clamp(Math.max(0, 9 - parseFloat(s.era || 9)) * 11, 100) },
        { label: 'Holds',   compute: s => clamp(s.holds  || 0, 35) },
    ],
};

const resolveRadarProfile = (position = '') => {
    const p = position.trim().toUpperCase();
    if (p.includes('STARTING') || p === 'SP' || p.includes('STARTER')) return RADAR_PROFILES.sp;
    if (p.includes('RELIEF') || p.includes('CLOSER') || p === 'RP' || p === 'CL') return RADAR_PROFILES.rp;
    if (p.includes('PITCHER')) return RADAR_PROFILES.sp;
    if (p.includes('CATCH') || p === 'C') return RADAR_PROFILES.catcher;
    if (p.includes('DESIGNATED') || p === 'DH') return RADAR_PROFILES.dh;
    return RADAR_PROFILES.hitter;
};

export const resolveProfileName = (position = '') => {
    const p = position.trim().toUpperCase();
    if (p.includes('STARTING') || p === 'SP' || p.includes('STARTER')) return 'sp';
    if (p.includes('RELIEF') || p.includes('CLOSER') || p === 'RP' || p === 'CL') return 'rp';
    if (p.includes('PITCHER')) return 'sp';
    if (p.includes('CATCH') || p === 'C') return 'catcher';
    if (p.includes('DESIGNATED') || p === 'DH') return 'dh';
    return 'hitter';
};

export const computeRadarData = (stats = {}, position = '') => {
    const profile = resolveRadarProfile(position);
    return profile.map(({ label, compute }) => ({ tool: label, value: compute(stats) }));
};

export const computePercentile = (value, allValues) => {
    if (!allValues?.length) return 0;
    const below = allValues.filter(v => v < value).length;
    return Math.round((below / allValues.length) * 100);
};

export const computeRank = (value, allValues) => {
    if (!allValues?.length) return null;
    return allValues.filter(v => v > value).length + 1;
};

export const ALL_STATS = [
    // Hitting
    { key: 'avg',                label: 'Batting Avg',       isFloat: true  },
    { key: 'homeRuns',           label: 'Home Runs',         isFloat: false },
    { key: 'rbi',                label: 'RBI',               isFloat: false },
    { key: 'stolenBases',        label: 'Stolen Bases',      isFloat: false },
    { key: 'obp',                label: 'On-Base %',         isFloat: true  },
    { key: 'slg',                label: 'Slugging %',        isFloat: true  },
    { key: 'ops',                label: 'OPS',               isFloat: true  },
    { key: 'hits',               label: 'Hits',              isFloat: false },
    { key: 'doubles',            label: 'Doubles',           isFloat: false },
    { key: 'triples',            label: 'Triples',           isFloat: false },
    { key: 'runs',               label: 'Runs',              isFloat: false },
    { key: 'strikeOuts',         label: 'Strikeouts',        isFloat: false },
    { key: 'baseOnBalls',        label: 'Walks',             isFloat: false },
    { key: 'gamesPlayed',        label: 'Games Played',      isFloat: false },
    // Pitching
    { key: 'era',                label: 'ERA',               isFloat: true  },
    { key: 'wins',               label: 'Wins',              isFloat: false },
    { key: 'losses',             label: 'Losses',            isFloat: false },
    { key: 'saves',              label: 'Saves',             isFloat: false },
    { key: 'holds',              label: 'Holds',             isFloat: false },
    { key: 'inningsPitched',     label: 'Innings Pitched',   isFloat: true  },
    { key: 'strikeOutsPitching', label: 'Strikeouts (P)',    isFloat: false },
    { key: 'whip',               label: 'WHIP',              isFloat: true  },
    { key: 'battersFaced',       label: 'Batters Faced',     isFloat: false },
    { key: 'homeRunsAllowed',    label: 'HR Allowed',        isFloat: false },
    { key: 'earnedRuns',         label: 'Earned Runs',       isFloat: false },
    // Catching
    { key: 'caughtStealing',     label: 'Caught Stealing',   isFloat: false },
    { key: 'passedBall',         label: 'Passed Balls',      isFloat: false },
    // Fielding (all positions)
    { key: 'errors',             label: 'Errors',            isFloat: false },
    { key: 'assists',            label: 'Assists',           isFloat: false },
    { key: 'fieldingPercentage', label: 'Fielding %',        isFloat: true  },
];

const HITTING_CORE = [
    'avg', 'homeRuns', 'rbi', 'stolenBases', 'obp', 'slg', 'ops',
    'hits', 'doubles', 'triples', 'runs', 'strikeOuts', 'baseOnBalls', 'gamesPlayed',
];
const FIELDING_CORE = ['errors', 'assists', 'fieldingPercentage'];

export const POSITION_STATS = {
    SP: [
        'era', 'wins', 'losses', 'inningsPitched', 'strikeOutsPitching',
        'whip', 'battersFaced', 'homeRunsAllowed', 'earnedRuns', 'gamesPlayed',
    ],
    RP: [
        'era', 'saves', 'holds', 'wins', 'losses', 'inningsPitched',
        'strikeOutsPitching', 'whip', 'earnedRuns', 'gamesPlayed',
    ],
    CL: [ 
        'saves', 'era', 'holds', 'inningsPitched', 'strikeOutsPitching',
        'whip', 'earnedRuns', 'gamesPlayed',
    ],
    C: [
        ...HITTING_CORE, 'caughtStealing', 'passedBall', ...FIELDING_CORE,
    ],
    '1B': [ ...HITTING_CORE, ...FIELDING_CORE ],
    '2B': [ ...HITTING_CORE, ...FIELDING_CORE ],
    '3B': [ ...HITTING_CORE, ...FIELDING_CORE ],
    SS: [  ...HITTING_CORE, ...FIELDING_CORE ],
    LF: [  ...HITTING_CORE, ...FIELDING_CORE ],
    CF: [  ...HITTING_CORE, 'stolenBases', ...FIELDING_CORE ], 
    RF: [  ...HITTING_CORE, ...FIELDING_CORE ],
    OF: [  ...HITTING_CORE, ...FIELDING_CORE ],
    DH: [  ...HITTING_CORE ], 
    UT: [  ...HITTING_CORE, ...FIELDING_CORE ], 
};

export const getStatsForPosition = (position = '') => {
    const p = position.trim().toUpperCase();

    const normalized =
        p === 'P' || p.includes('STARTING') || p === 'STARTER' ? 'SP' :
        p.includes('RELIEF')   || p === 'RELIEVER'   ? 'RP' :
        p.includes('CLOSER')                          ? 'CL' :
        p.includes('PITCHER')                         ? 'SP' :
        p.includes('DESIGNATED')                      ? 'DH' :
        p === 'UT' || p.includes('UTIL')              ? 'UT' :
        p.includes('CENTER')                          ? 'CF' :
        p.includes('LEFT')                            ? 'LF' :
        p.includes('RIGHT')                           ? 'RF' :
        p.includes('OUTFIELD')                        ? 'OF' :
        p.includes('SHORT')                           ? 'SS' :
        p.includes('THIRD')                           ? '3B' :
        p.includes('SECOND')                          ? '2B' :
        p.includes('FIRST')                           ? '1B' :
        p.includes('CATCH')                           ? 'C'  :
        p; // already short form

    const keys = POSITION_STATS[normalized] ?? HITTING_CORE; // default to hitting
    return ALL_STATS.filter(s => keys.includes(s.key));
};

export const expandPosition = (position = '') => {
    const p = position.trim().toUpperCase();

    if (p.includes('TWO-WAY') || p.includes('TWO WAY')) return ['SP', 'DH'];

    if (p.includes('STARTING') || p.includes('STARTER')) return ['SP'];
    if (p.includes('CLOSER'))                             return ['CL'];
    if (p.includes('RELIEF') || p === 'RELIEVER')        return ['RP'];
    if (p.includes('PITCHER'))                            return ['SP'];
    if (p.includes('DESIGNATED'))                         return ['DH'];
    if (p.includes('CENTER'))                             return ['CF'];
    if (p.includes('LEFT FIELD') || p === 'LEFT FIELDER') return ['LF'];
    if (p.includes('RIGHT FIELD') || p === 'RIGHT FIELDER') return ['RF'];
    if (p.includes('OUTFIELD'))                           return ['OF'];
    if (p.includes('SHORTSTOP') || p.includes('SHORT STOP')) return ['SS'];
    if (p.includes('THIRD'))                              return ['3B'];
    if (p.includes('SECOND'))                             return ['2B'];
    if (p.includes('FIRST'))                              return ['1B'];
    if (p.includes('CATCH'))                              return ['C'];

    return [p];
};
export const getHeadshotUrl = (mlbId) =>
    mlbId ? `https://securea.mlb.com/mlb/images/players/head_shot/${mlbId}.jpg` : null;


export function getDepthChartRankings(depthChart, playerId) {
    if (!depthChart?.positions || !playerId) return [];

    const id = Number(playerId);
    const results = [];

    for (const [posLabel, players] of Object.entries(depthChart.positions)) {
        // Dedupe players within this position group (API can repeat entries)
        const seen = new Set();
        const unique = players.filter(p => {
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
        });

        const rankIndex = unique.findIndex(p => Number(p.id) === id);
        if (rankIndex === -1) continue;

        results.push({
            position: posLabel,           // e.g. "Starting Pitcher", "Outfielder"
            rank:     rankIndex + 1,      // 1-based
            total:    unique.length,
            players:  unique,             // full ranked list for the position
        });
    }

    return results;
}

export function abbreviateDepthPosition(label = '') {
    const map = {
        'Starting Pitcher':  'SP',
        'Relief Pitcher':    'RP',
        'Pitcher':           'RP',
        'Closer':            'CL',
        'Catcher':           'C',
        'First Base':        '1B',
        'Second Base':       '2B',
        'Third Base':        '3B',
        'Shortstop':         'SS',
        'Outfielder':        'OF',
        'Left Field':        'LF',
        'Center Field':      'CF',
        'Right Field':       'RF',
        'Designated Hitter': 'DH',
        'Utility':           'UT',
    };
    return map[label] ?? label;
}