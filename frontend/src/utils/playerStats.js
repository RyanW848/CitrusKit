// Normalizes (given the range of the values) from 0 to 100
export const clamp = (val, max) => Math.min(100, Math.round((val / max) * 100));

// Claude assisted 
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


export const computeRadarData = (stats = {}, position = '') => {
    const profile = resolveRadarProfile(position);
    return profile.map(({ label, compute }) => ({ tool: label, value: compute(stats) }));
};

export const computePercentile = (value, allValues) => {
    if (!allValues?.length) return 0;

    const below = allValues.filter(v => v < value).length;

    return Math.round((below / allValues.length) * 100);
}

export const computeRank = (value, allValues) => {
    if (!allValues?.length) return null;

    return allValues.filter(v => v > value).length + 1;
};

/**
 * All possible stat rows with display metadata.
 */
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
 
/**
 * Which stat keys are relevant per position.
 * The modal filters ALL_STATS down to only these keys for the given position.
 */
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
    CL: [ // Closer — same as RP but saves front and center
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
    CF: [  ...HITTING_CORE, 'stolenBases', ...FIELDING_CORE ], // speed extra relevant
    RF: [  ...HITTING_CORE, ...FIELDING_CORE ],
    OF: [  ...HITTING_CORE, ...FIELDING_CORE ],
    DH: [  ...HITTING_CORE ], // no fielding for DH
};
 
/**
 * Given a position string from the API (e.g. "Starting Pitcher", "SP", "RF"),
 * returns the list of relevant stat definitions from ALL_STATS.
 */
export const getStatsForPosition = (position = '') => {
    const p = position.trim().toUpperCase();
 
    // Normalize verbose position names the API might return
    const normalized =
        p.includes('STARTING') || p === 'STARTER'   ? 'SP' :
        p.includes('RELIEF')   || p === 'RELIEVER'   ? 'RP' :
        p.includes('CLOSER')                          ? 'CL' :
        p.includes('PITCHER')                         ? 'SP' : // fallback for generic "Pitcher"
        p.includes('DESIGNATED')                      ? 'DH' :
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
 
/**
 * Builds the headshot URL from an MLB ID.
 * https://securea.mlb.com/mlb/images/players/head_shot/{mlbId}.jpg
 */
export const getHeadshotUrl = (mlbId) =>
    mlbId ? `https://securea.mlb.com/mlb/images/players/head_shot/${mlbId}.jpg` : null;
