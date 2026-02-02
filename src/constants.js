export const BOARD_WIDTH = 360; // 18 tiles * 20
export const BOARD_HEIGHT = 640; // 32 tiles * 20
export const GRID_SIZE = 20;
export const GRID_COLS = 18;
export const GRID_ROWS = 32;
export const PLAYER_SPAWN_Y_START = 340; // Just past river (320)
export const RIVER_Y = 320;
export const BRIDGES = [
  { x: 80, y: RIVER_Y, width: 60 },
  { x: 280, y: RIVER_Y, width: 60 }
];
export const LANE_X = [80, 280];
export const TOWER_HEALTH = 2500;
export const MAX_ELIXIR = 10;
export const ELIXIR_REGEN_RATE = 6.4; // 6.4 Elixir per second as requested

export const LANDMARKS = {
  WHITE_HOUSE: 'white_house.png',
  LINCOLN_MEMORIAL: 'lincoln_memorial.png',
  PENTAGON: 'pentagon.png'
};

export const PRESIDENTS = {
  // Knight archetype -> Washington (Fast)
  WASHINGTON: {
    id: 'george_washington',
    name: 'George Washington',
    cost: 3,
    health: 1224,
    damage: 159,
    speed: 1.2, // Fast (1-1.5)
    hitSpeed: 1.2,
    deployTime: 1000,
    range: 20,
    image: 'george_washington_card.png',
    targetsPriority: 'any'
  },
  // Musketeer archetype -> Sacagawea (Fast)
  SACAGAWEA: {
    id: 'sacagawea',
    name: 'Sacagawea',
    cost: 4,
    health: 599,
    damage: 162,
    speed: 1.0, // Fast-Medium
    hitSpeed: 1.1,
    deployTime: 1000,
    range: 120,
    image: 'sacagawea_card.png',
    targetsPriority: 'any'
  },
  // Wizard archetype -> Einstein Advisor (Medium)
  EINSTEIN: {
    id: 'einstein_advisor',
    name: 'Einstein Advisor',
    cost: 5,
    health: 598,
    damage: 231,
    speed: 0.9, // Medium (0.7-1)
    hitSpeed: 1.4,
    deployTime: 1000,
    range: 110,
    isSplash: true,
    image: 'einstein_card.png',
    targetsPriority: 'any'
  },
  // Miner archetype -> Deep State Agent (Very Fast)
  DEEP_STATE: {
    id: 'deep_state_agent',
    name: 'Deep State Agent',
    cost: 3,
    health: 1000,
    damage: 160,
    speed: 1.8, // Very Fast (1.5-2)
    hitSpeed: 1.2,
    deployTime: 1000,
    range: 20,
    image: 'deep_state_card.png',
    targetsPriority: 'any',
    isMiner: true
  },
  // Archer Queen -> Eleanor Roosevelt (Medium)
  ELEANOR: {
    id: 'eleanor_roosevelt',
    name: 'Eleanor Roosevelt',
    cost: 5,
    health: 1000,
    damage: 225,
    speed: 0.8, // Medium
    hitSpeed: 1.2,
    deployTime: 1000,
    range: 100,
    image: 'eleanor_card.png',
    targetsPriority: 'any',
    isChampion: true,
    superAbility: { name: 'Arrow Rain', type: 'damage', radius: 200 }
  },
  // Giant -> Lincoln (Slow)
  LINCOLN: {
    id: 'abraham_lincoln',
    name: 'Abraham Lincoln',
    cost: 5,
    health: 4091,
    damage: 254,
    speed: 0.5, // Slow (0.4-0.7)
    hitSpeed: 1.5,
    deployTime: 2000, // Heavy deploy
    range: 20,
    image: 'abraham_lincoln_card.png',
    targetsPriority: 'buildings'
  },
  // Hog Rider -> Teddy (Very Fast)
  TEDDY: {
    id: 'teddy_roosevelt',
    name: 'Teddy Roosevelt',
    cost: 4,
    health: 1599,
    damage: 318,
    speed: 1.9, // Very Fast
    hitSpeed: 1.6,
    deployTime: 1000,
    range: 20,
    image: 'teddy_roosevelt_card.png',
    targetsPriority: 'buildings'
  },
  // Mega Knight -> Taft (Medium-Slow)
  TAFT: {
    id: 'william_taft',
    name: 'William Taft',
    cost: 7,
    health: 3999,
    damage: 288,
    speed: 0.7, // Slow-Medium
    hitSpeed: 1.7,
    deployTime: 3000, // Very Heavy
    range: 20,
    isSplash: true,
    spawnDamage: 500,
    image: 'william_taft_card.png',
    targetsPriority: 'any'
  },
  // Minions -> Secret Service (Fast)
  SECRET_SERVICE: {
    id: 'secret_service',
    name: 'Secret Service',
    cost: 3,
    count: 3,
    health: 190,
    damage: 84,
    speed: 1.4, // Fast
    hitSpeed: 1.0,
    deployTime: 1000,
    range: 40,
    isFlying: true,
    image: 'secret_service_card.png',
    targetsPriority: 'any'
  },
  // P.E.K.K.A -> Trump (Slow)
  TRUMP: {
    id: 'donald_trump',
    name: 'Donald Trump',
    cost: 7,
    health: 4800,
    damage: 900,
    speed: 0.5, // Slow
    hitSpeed: 1.8,
    deployTime: 3000, // Heavy
    range: 20,
    image: 'donald_trump_card.png',
    targetsPriority: 'any'
  },
  // Baby Dragon -> JFK (Fast-Flying)
  JFK: {
    id: 'jfk',
    name: 'John F. Kennedy',
    cost: 4,
    health: 1000,
    damage: 150,
    speed: 1.3, // Fast
    hitSpeed: 1.5,
    deployTime: 1000,
    range: 60,
    isFlying: true,
    isSplash: true,
    image: 'jfk_card.png',
    targetsPriority: 'any'
  },
  // Spell -> Executive Order
  EXECUTIVE_ORDER: {
    id: 'executive_order',
    name: 'Executive Order',
    cost: 4,
    damage: 500,
    radius: 50,
    image: 'executive_order_card.png',
    type: 'spell'
  },
  // Building -> Obama Prism (Tesla-like)
  OBAMA: {
    id: 'obama_prism',
    name: 'Obama Prism',
    cost: 4,
    health: 954,
    damage: 190,
    hitSpeed: 1.1,
    range: 110,
    deployTime: 1000,
    lifetime: 40, // Seconds
    image: 'obama_card.png',
    type: 'building',
    targetsPriority: 'any'
  }
};

// --- LEAGUE SYSTEM ---
export const LEAGUES = [
  { id: 'voter', name: 'Voter League', minElectoralVotes: 0, multiplier: 1.0, color: '#95a5a6' },
  { id: 'delegate', name: 'Delegate League', minElectoralVotes: 1000, multiplier: 1.2, color: '#3498db' },
  { id: 'senator', name: 'Senator League', minElectoralVotes: 2000, multiplier: 1.5, color: '#9b59b6' },
  { id: 'governor', name: "Governor's Mansion", minElectoralVotes: 3500, multiplier: 2.0, color: '#e67e22' },
  { id: 'oval_office', name: 'The Oval Office', minElectoralVotes: 5000, multiplier: 3.0, color: '#f1c40f' }
];

export const SEASON_PASS_REWARDS = [
  { tier: 1, ballots: 10, free: { type: 'funds', amount: 100 }, premium: { type: 'declaration', rarity: 'PREAMBLE' } },
  { tier: 2, ballots: 25, free: { type: 'funds', amount: 150 }, premium: { type: 'funds', amount: 500 } },
  { tier: 3, ballots: 50, free: { type: 'declaration', rarity: 'PREAMBLE' }, premium: { type: 'declaration', rarity: 'ARTICLE' } },
  { tier: 4, ballots: 80, free: { type: 'funds', amount: 200 }, premium: { type: 'funds', amount: 1000 } },
  { tier: 5, ballots: 120, free: { type: 'declaration', rarity: 'ARTICLE' }, premium: { type: 'unique_skin', name: 'Golden Lincoln' } }
];

