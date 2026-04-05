const BASE_ROSTER = [
  { posAbbr: "C",  posName: "Catcher",         playerName: "Baseball Guy 1", price: 15, stat: "S1" },
  { posAbbr: "C",  posName: "Catcher",         playerName: "Baseball Guy 2", price: 15, stat: "S1" },
  { posAbbr: "AB", posName: "1st Baseman",     playerName: "So on",          price: 15, stat: "S1" },
  { posAbbr: "3B", posName: "3rd Baseman",     playerName: "and",            price: 15, stat: "S1" },
  { posAbbr: "CI", posName: "Center Infielder",playerName: "so",             price: 15, stat: "S1" },
  { posAbbr: "2B", posName: "2nd Baseman",     playerName: "forth",          price: 15, stat: "S1" },
  { posAbbr: "SS", posName: "Shortstop",       playerName: null,             price: 0,  stat: null  },
  { posAbbr: "MI", posName: "Middle Infielder",playerName: "Shohei Ohtani",  price: 15, stat: "S1" },
];

/** Returns the same roster for every owner (replace with real API data later) */
export function getMockRoster(_ownerId) {
  return BASE_ROSTER;
}
