const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

console.log("[SERVER] Starting initialization...");

const app = express();
const distPath = path.resolve(__dirname, '..', 'dist');

app.use(cors());
app.use(express.static(distPath));

const server = http.createServer(app);
console.log("[SERVER] HTTP Server created");

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:3000", "http://192.168.1.120:5173", "http://192.168.1.120:3000"],
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// --- INFRASTRUCTURE SETUP ---
const MATCH_CAP_PER_SHARD = 200;
const HEARTBEAT_TIMEOUT = 5000;
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

function getProfilePath(playerId) {
    // Simple 200-shard partitioning simulation
    const shard = playerId.charCodeAt(0) % MATCH_CAP_PER_SHARD;
    const shardDir = path.join(DATA_DIR, `shard_${shard}`);
    if (!fs.existsSync(shardDir)) fs.mkdirSync(shardDir);
    return path.join(shardDir, `${playerId}.json`);
}

function saveProfile(playerId, data) {
    try {
        const filePath = getProfilePath(playerId);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(`[STORAGE] Error saving ${playerId}:`, e);
    }
}

function loadProfile(playerId) {
    try {
        const filePath = getProfilePath(playerId);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {
        console.error(`[STORAGE] Error loading ${playerId}:`, e);
    }
    return null;
}
const RATE_LIMIT_THRESHOLD = 50; // max actions per 5 seconds
const requestCounts = new Map();
const lastHeartbeat = new Map();

// Simplified Sentry-style logging
const logError = (err, context) => {
    const timestamp = new Date().toISOString();
    console.error(`[CRASH-LOG] [${timestamp}] [v0.1.0] [${context.tag}]: ${err.stack || err}`);
};

console.log("[SERVER] Infrastructure initialized with Sharding & Heartbeats");

// Serve frontend for all other routes
app.use((req, res, next) => {
    // Skip if it's a socket.io request
    if (req.url.startsWith('/socket.io')) return next();

    // Skip if it looks like a static file (has an extension)
    // Note: express.static already handled existing files, this is for missing files or SPA routes
    if (path.extname(req.url)) return next();

    const indexPath = path.join(distPath, 'index.html');
    try {
        const html = fs.readFileSync(indexPath, 'utf8');
        res.send(html);
    } catch (err) {
        // If we're here, the build is likely missing or we should just pass through
        res.status(500).send("Critical: build artifacts missing.");
    }
});

// Constants
const BOARD_WIDTH = 400;
const BOARD_HEIGHT = 700;
const ELIXIR_REGEN_RATE = 0.3; // 0.3 units per second as per blueprint
const MAX_ELIXIR = 10;
const MAX_SUPER_CHARGE = 100;
const SUPER_CHARGE_RATE = 5;
const TOWER_HEALTH = 1500;
const MATCH_DURATION = 180;
const RIVER_Y = BOARD_HEIGHT / 2;
const BRIDGES = [
    { x: 100, y: RIVER_Y, width: 60 },
    { x: 300, y: RIVER_Y, width: 60 }
];

const LANDMARKS = {
    WHITE_HOUSE: 'white_house.png',
    LINCOLN_MEMORIAL: 'lincoln_memorial.png',
    PENTAGON: 'pentagon.png'
};

const PRESIDENTS = {
    george_washington: { cost: 3, health: 1224, damage: 159, speed: 1.2, range: 20, targetsPriority: 'any' },
    sacagawea: { cost: 4, health: 599, damage: 162, speed: 1.0, range: 120, targetsPriority: 'any' },
    einstein_advisor: { cost: 5, health: 598, damage: 231, speed: 1.0, range: 110, isSplash: true, targetsPriority: 'any' },
    deep_state_agent: { cost: 3, health: 1000, damage: 160, speed: 1.2, range: 20, targetsPriority: 'any', isMiner: true },
    eleanor_roosevelt: { cost: 5, health: 1000, damage: 225, speed: 1.0, range: 100, targetsPriority: 'any', isChampion: true, superAbility: { type: 'damage', radius: 200 } },
    abraham_lincoln: { cost: 5, health: 4091, damage: 254, speed: 0.8, range: 20, targetsPriority: 'buildings' },
    donald_trump: { cost: 4, health: 1361, damage: 698, speed: 1.8, range: 20, targetsPriority: 'any' },
    obama: { cost: 4, health: 1152, damage: 160, speed: 1.5, range: 80, targetsPriority: 'any', isFlying: true, isSplash: true },
    jfk_space: { cost: 4, health: 1696, damage: 318, speed: 2.5, range: 20, targetsPriority: 'buildings' },
    secret_service: { cost: 3, health: 81, damage: 81, speed: 2.0, range: 20, count: 15, targetsPriority: 'any' },
    executive_order: { cost: 4, damage: 689, isSpell: true, radius: 100 },
    fdr: { cost: 5, health: 3200, damage: 150, speed: 0.7, range: 20, superAbility: { type: 'heal', radius: 150 } },
    truman: { cost: 4, health: 700, damage: 180, speed: 1.0, range: 130, isSplash: true, superAbility: { type: 'damage', radius: 120 } },
    grant: { cost: 4, health: 1400, damage: 190, speed: 1.1, range: 20, superAbility: { type: 'rush', radius: 180 } },
    the_constitution: { id: 'the_constitution', name: 'THE CONSTITUTION', health: 12000, damage: 800, speed: 0.5, range: 40, isSplash: true, image: 'constitution_boss.png' }
};

const EVENTS = [
    { time: 150, id: 'infrastructure', name: 'INFRASTRUCTURE BILL', text: 'ALL UNITS GAIN +30% SPEED!', action: (gs) => { gs.speedMultiplier = 1.3; } },
    { time: 60, id: 'tax_cut', name: 'TAX CUT', text: 'TRIPLE ELIXIR REGEN!', action: (gs) => { gs.elixirMultiplier = 3.0; } },
    { time: 30, id: 'boom', name: 'ECONOMIC BOOM', text: 'TOWERS REGENERATING HP!', action: (gs) => { gs.isRegen = true; } }
];

let gameState = {
    units: [],
    enemyUnits: [],
    neutralUnits: [], // New array for boss and future neutrale events
    matchmakingQueue: [],
    towers: [
        { id: 'player-left', x: BRIDGES[0].x, y: BOARD_HEIGHT - 100, hp: TOWER_HEALTH, type: 'player', landmark: LANDMARKS.LINCOLN_MEMORIAL },
        { id: 'player-right', x: BRIDGES[1].x, y: BOARD_HEIGHT - 100, hp: TOWER_HEALTH, type: 'player', landmark: LANDMARKS.PENTAGON },
        { id: 'player-king', x: 200, y: BOARD_HEIGHT - 50, hp: TOWER_HEALTH * 2, type: 'player', isKing: true, landmark: LANDMARKS.WHITE_HOUSE },
        { id: 'enemy-left', x: BRIDGES[0].x, y: 100, hp: TOWER_HEALTH, type: 'enemy', landmark: LANDMARKS.LINCOLN_MEMORIAL },
        { id: 'enemy-right', x: BRIDGES[1].x, y: 100, hp: TOWER_HEALTH, type: 'enemy', landmark: LANDMARKS.PENTAGON },
        { id: 'enemy-king', x: 200, y: 50, hp: TOWER_HEALTH * 2, type: 'enemy', isKing: true, landmark: LANDMARKS.WHITE_HOUSE },
    ],
    bridges: [...BRIDGES],
    shiftsTriggered: new Set(),
    gameOver: null,
    matchTimer: MATCH_DURATION,
    matchStarted: false,
    isSuddenDeath: false,
    rematchRequests: new Set(),
    speedMultiplier: 1.0,
    elixirMultiplier: 1.0,
    isRegen: false,
    activeEvents: [],
    gameOverTriggered: false // Track if we've processed trophies
};

function resetGame() {
    gameState.units = [];
    gameState.enemyUnits = [];
    gameState.neutralUnits = [];
    gameState.gameOver = null;
    gameState.matchTimer = MATCH_DURATION;
    gameState.matchStarted = false;
    gameState.isSuddenDeath = false;
    gameState.rematchRequests = new Set();
    gameState.speedMultiplier = 1.0;
    gameState.elixirMultiplier = 1.0;
    gameState.isRegen = false;
    gameState.activeEvents = [];
    gameState.gameOverTriggered = false;
    gameState.bridges = [...BRIDGES];
    gameState.shiftsTriggered = new Set();
    gameState.towers = [
        { id: 'player-left', x: BRIDGES[0].x, y: BOARD_HEIGHT - 100, hp: TOWER_HEALTH, type: 'player', landmark: LANDMARKS.LINCOLN_MEMORIAL },
        { id: 'player-right', x: BRIDGES[1].x, y: BOARD_HEIGHT - 100, hp: TOWER_HEALTH, type: 'player', landmark: LANDMARKS.PENTAGON },
        { id: 'player-king', x: 200, y: BOARD_HEIGHT - 50, hp: TOWER_HEALTH * 2, type: 'player', isKing: true, landmark: LANDMARKS.WHITE_HOUSE },
        { id: 'enemy-left', x: BRIDGES[0].x, y: 100, hp: TOWER_HEALTH, type: 'enemy', landmark: LANDMARKS.LINCOLN_MEMORIAL },
        { id: 'enemy-right', x: BRIDGES[1].x, y: 100, hp: TOWER_HEALTH, type: 'enemy', landmark: LANDMARKS.PENTAGON },
        { id: 'enemy-king', x: 200, y: 50, hp: TOWER_HEALTH * 2, type: 'enemy', isKing: true, landmark: LANDMARKS.WHITE_HOUSE }
    ];
    for (const id in playerStates) {
        playerStates[id].elixir = 5;
        playerStates[id].superCharge = 0;
    }
    console.log('[GAME] Reset');
}

const playersByTeam = { player: null, enemy: null };
const playerStates = {};
const matchmakingQueue = [];
const AI_PLAYER_ID = 'computer_executive';

// Heartbeat Integrity Check
setInterval(() => {
    const now = Date.now();
    for (const [socketId, lastTime] of lastHeartbeat) {
        if (now - lastTime > HEARTBEAT_TIMEOUT) {
            console.warn(`[SECURITY] Heartbeat lost for ${socketId}. Kicking...`);
            const socket = io.sockets.sockets.get(socketId);
            if (socket) socket.disconnect(true);
            lastHeartbeat.delete(socketId);
        }
    }
}, 2000);

io.on('connection', (socket) => {
    console.log('[SOCKET] User connected:', socket.id);
    lastHeartbeat.set(socket.id, Date.now());

    socket.on('register', (data) => {
        lastHeartbeat.set(socket.id, Date.now());
        const { playerId, trophies } = data;

        if (!playerId || typeof playerId !== 'string' || playerId.length > 50) {
            return socket.disconnect(true);
        }

        let pState = playerStates[playerId];
        if (pState) {
            pState.socketId = socket.id;
            socket.emit('init', {
                gameState: { ...gameState, rematchRequests: Array.from(gameState.rematchRequests) },
                playerState: { team: pState.team, elixir: pState.elixir, superCharge: pState.superCharge }
            });
            return;
        }

        // LOAD PERSISTENT PROFILE
        const profile = loadProfile(playerId);
        const currentTrophies = profile ? profile.trophies : (trophies || 0);

        // Add to Matchmaking Queue
        const inQueue = matchmakingQueue.find(q => q.playerId === playerId);
        if (!inQueue && !gameState.matchStarted) {
            matchmakingQueue.push({ playerId, socketId: socket.id, trophies: currentTrophies, joinTime: Date.now() });
            console.log(`[MATCH] ${playerId} entered queue (${currentTrophies}🏆)`);
            socket.emit('announcement', { text: "FINDING CHALLENGER...", team: 'neutral' });
        }
    });

    socket.on('spawn', (data) => {
        lastHeartbeat.set(socket.id, Date.now());

        // Rate Limiting Throttler
        const count = requestCounts.get(socket.id) || 0;
        if (count > RATE_LIMIT_THRESHOLD) {
            return socket.emit('announcement', { text: "ACTION OVERLOAD DETECTED", team: 'neutral' });
        }
        requestCounts.set(socket.id, count + 1);
        setTimeout(() => requestCounts.set(socket.id, Math.max(0, (requestCounts.get(socket.id) || 0) - 1)), 5000);

        const { president, x, y, playerId, presidentId: pidLegacy } = data;
        const pState = playerStates[playerId];

        // Strict Input Validation
        const pid = president?.id || pidLegacy || president;
        if (typeof pid !== 'string' || !PRESIDENTS[pid]) {
            return logError(new Error("Invalid President ID Attempted"), { tag: 'SECURITY' });
        }

        const stats = PRESIDENTS[pid];

        if (pState && stats && pState.elixir >= stats.cost) {
            const isBlue = pState.team === 'player';
            const validY = isBlue ? (y >= RIVER_Y + 20) : (y <= RIVER_Y - 20);

            if (validY) {
                pState.elixir -= stats.cost;
                if (stats.isSpell) {
                    applySpellLogic(stats, x, y, pState.team);
                    return;
                }
                const unitList = isBlue ? gameState.units : gameState.enemyUnits;
                const count = stats.count || 1;
                for (let i = 0; i < count; i++) {
                    unitList.push({
                        ...stats,
                        id: pid,
                        uid: Date.now() + Math.random(),
                        x: x + (count > 1 ? (Math.random() - 0.5) * 20 : 0),
                        y: y + (count > 1 ? (Math.random() - 0.5) * 20 : 0),
                        currentHp: stats.health,
                        team: pState.team,
                        owner: playerId,
                        isAttacking: false
                    });
                }
            }
        }
    });

    socket.on('activateSuper', (data) => {
        const { playerId, x, y, id } = data;
        const pState = playerStates[playerId];
        if (pState && pState.superCharge >= MAX_SUPER_CHARGE) {
            pState.superCharge = 0;
            const stats = Object.values(PRESIDENTS).find(p => p.id === id) || PRESIDENTS[id];
            const ability = stats?.superAbility;
            if (ability) {
                io.emit('announcement', { text: `${stats.name || id} ACTIVATED SUPER!`, team: pState.team });
                io.emit('superEffect', { ...ability, x, y, team: pState.team });
                applyAbilityLogic(ability, x, y, pState.team);
            }
        }
    });

    socket.on('sendEmote', (data) => {
        const { emote, playerId } = data;
        const pState = playerStates[playerId];
        if (pState) io.emit('emote', { emote, team: pState.team, playerId });
    });

    socket.on('requestRematch', (data) => {
        const { playerId } = data;
        if (gameState.gameOver) {
            gameState.rematchRequests.add(playerId);
            const pState = playerStates[playerId];
            if (pState) io.emit('announcement', { text: `${pState.team.toUpperCase()} REQUESTED REMATCH`, team: pState.team });
            if (Object.keys(playerStates).every(id => gameState.rematchRequests.has(id))) {
                resetGame();
                gameState.matchStarted = true;
                io.emit('announcement', { text: `REMATCH STARTED!`, team: 'neutral' });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('[SOCKET] User disconnected:', socket.id);
    });
});

function applySpellLogic(spell, x, y, team) {
    const isBlue = team === 'player';
    const enemies = isBlue ? gameState.enemyUnits : gameState.units;
    const enemyTowers = gameState.towers.filter(t => t.type !== team);
    [...enemies, ...enemyTowers].forEach(t => {
        const d = Math.sqrt(Math.pow(t.x - x, 2) + Math.pow(t.y - y, 2));
        if (d <= spell.radius) {
            if (t.uid) t.currentHp -= spell.damage;
            else t.hp -= spell.damage;
        }
    });
    io.emit('superEffect', { type: 'damage', radius: spell.radius, x, y, team, isSpell: true });
}

function applyAbilityLogic(ability, x, y, team) {
    const { type, radius } = ability;
    const isBlue = team === 'player';
    if (['damage', 'stun', 'knockback'].includes(type)) {
        const targets = [...(isBlue ? gameState.enemyUnits : gameState.units), ...gameState.towers.filter(t => t.type !== team)];
        targets.forEach(t => {
            if (Math.sqrt(Math.pow(t.x - x, 2) + Math.pow(t.y - y, 2)) <= radius) {
                if (t.uid) t.currentHp -= 300;
                else t.hp -= 300;
            }
        });
    } else if (type === 'heal') {
        const allies = isBlue ? gameState.units : gameState.enemyUnits;
        allies.forEach(u => {
            if (Math.sqrt(Math.pow(u.x - x, 2) + Math.pow(u.y - y, 2)) <= radius) u.currentHp = Math.min(u.health, u.currentHp + 400);
        });
    } else if (type === 'rush') {
        const allies = isBlue ? gameState.units : gameState.enemyUnits;
        allies.forEach(u => {
            if (Math.sqrt(Math.pow(u.x - x, 2) + Math.pow(u.y - y, 2)) <= radius) {
                u.speedMultiplier = 2.0;
                setTimeout(() => { u.speedMultiplier = 1.0; }, 3000);
            }
        });
    }
}

setInterval(() => {
    const deltaTime = 0.05;
    if (gameState.gameOver) return;

    if (gameState.matchStarted) {
        EVENTS.forEach(event => {
            if (!gameState.activeEvents.includes(event.id) && gameState.matchTimer <= event.time) {
                gameState.activeEvents.push(event.id);
                event.action(gameState);
                io.emit('announcement', { text: `EVENT: ${event.name}!`, subtext: event.text, team: 'neutral' });
            }
        });

        if (gameState.isRegen) {
            gameState.towers.forEach(t => { if (t.hp > 0) t.hp = Math.min(TOWER_HEALTH * (t.isKing ? 2 : 1), t.hp + (20 * deltaTime)); });
        }

        gameState.matchTimer -= deltaTime;
        const currentRegen = ELIXIR_REGEN_RATE * (gameState.matchTimer < 60 ? 2 : 1) * gameState.elixirMultiplier;
        for (const id in playerStates) {
            const p = playerStates[id];
            p.elixir = Math.min(MAX_ELIXIR, p.elixir + currentRegen * deltaTime);
            p.superCharge = Math.min(MAX_SUPER_CHARGE, p.superCharge + (SUPER_CHARGE_RATE * deltaTime));
        }

        updateAILogic(deltaTime);
        updateProceduralArena(deltaTime);
    }

    const damageMap = new Map();
    const processUnit = (u) => {
        const isPlayer = u.team === 'player';
        const enemies = isPlayer ? gameState.enemyUnits : gameState.units;
        const enemyTowers = gameState.towers.filter(t => t.type !== u.team && t.hp > 0);
        const targets = [...enemyTowers, ...enemies];
        let nearest = null; let minDist = Infinity;
        targets.forEach(t => {
            const d = Math.sqrt(Math.pow(t.x - u.x, 2) + Math.pow(t.y - u.y, 2));
            if (d < minDist) { minDist = d; nearest = t; }
        });

        if (nearest) {
            if (minDist <= u.range) {
                const tid = nearest.uid || nearest.id;
                // 5% Random Damage Variance as per blueprint
                const variance = 1 + (Math.random() * 0.1 - 0.05);
                const damage = u.damage * deltaTime * variance;
                damageMap.set(tid, (damageMap.get(tid) || 0) + damage);
                return { ...u, isAttacking: true };
            } else {
                const angle = Math.atan2(nearest.y - u.y, nearest.x - u.x);
                const speed = u.speed * (u.speedMultiplier || 1) * gameState.speedMultiplier * 60 * deltaTime;
                return { ...u, isAttacking: false, x: u.x + Math.cos(angle) * speed, y: u.y + Math.sin(angle) * speed };
            }
        }
        return { ...u, isAttacking: false };
    };

    gameState.units = gameState.units.map(processUnit);
    gameState.enemyUnits = gameState.enemyUnits.map(processUnit);
    gameState.neutralUnits = gameState.neutralUnits.map(u => {
        const targets = [...gameState.units, ...gameState.enemyUnits, ...gameState.towers];
        let nearest = null;
        let minDist = Infinity;
        targets.forEach(t => {
            const dx = t.x - u.x;
            const dy = t.y - u.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) { minDist = dist; nearest = t; }
        });

        if (nearest) {
            if (minDist <= u.range) {
                const variance = 1 + (Math.random() * 0.1 - 0.05);
                const damage = u.damage * deltaTime * variance;
                damageMap.set(nearest.uid || nearest.id, (damageMap.get(nearest.uid || nearest.id) || 0) + damage);
                return { ...u, isAttacking: true };
            } else {
                const angle = Math.atan2(nearest.y - u.y, nearest.x - u.x);
                return { ...u, isAttacking: false, x: u.x + Math.cos(angle) * 50 * deltaTime, y: u.y + Math.sin(angle) * 50 * deltaTime };
            }
        }
        return u;
    });

    gameState.towers = gameState.towers.map(t => {
        const d = damageMap.get(t.id) || 0;
        if (d > 0) t.hp = Math.max(0, t.hp - d);
        return t;
    });

    const applyDmg = (u) => ({ ...u, currentHp: u.currentHp - (damageMap.get(u.uid) || 0) });
    gameState.units = gameState.units.map(applyDmg).filter(u => u.currentHp > 0);
    gameState.enemyUnits = gameState.enemyUnits.map(applyDmg).filter(u => u.currentHp > 0);
    gameState.neutralUnits = gameState.neutralUnits.map(applyDmg).filter(u => u.currentHp > 0);

    const pk = gameState.towers.find(t => t.isKing && t.type === 'player');
    const ek = gameState.towers.find(t => t.isKing && t.type === 'enemy');

    if (!gameState.gameOver) {
        if (pk && pk.hp <= 0) gameState.gameOver = 'red-victory';
        else if (ek && ek.hp <= 0) gameState.gameOver = 'blue-victory';
        else if (gameState.matchTimer <= 0) gameState.gameOver = 'draw';
    }

    if (gameState.gameOver && !gameState.gameOverTriggered) {
        gameState.gameOverTriggered = true;
        const winner = gameState.gameOver;
        console.log(`[GAME OVER] Result: ${winner}`);

        // Process Trophy Changes
        for (const pid in playerStates) {
            const p = playerStates[pid];
            if (pid === AI_PLAYER_ID) continue;

            const isWinner = (winner === 'blue-victory' && p.team === 'player') || (winner === 'red-victory' && p.team === 'enemy');
            const change = isWinner ? 30 : winner === 'draw' ? 0 : -20;
            p.trophyChange = change;
            p.trophies = Math.max(0, (p.trophies || 0) + change);
            saveProfile(pid, { trophies: p.trophies });

            // Notify specific socket
            const socket = io.sockets.sockets.get(p.socketId);
            if (socket) socket.emit('matchResult', { winner, trophyChange: change, trophies: p.trophies });
        }
    }

    io.emit('snapshot', { gameState, players: playerStates });
}, 50);

// --- AI BOT BRAIN ---
let aiSpawnTimer = 0;
function updateAILogic(deltaTime) {
    if (!gameState.matchStarted || gameState.gameOver) return;

    // If enemy slot is empty, initialize AI
    if (!playersByTeam.enemy) {
        playersByTeam.enemy = AI_PLAYER_ID;
        playerStates[AI_PLAYER_ID] = {
            playerId: AI_PLAYER_ID,
            socketId: 'cpu_socket',
            team: 'enemy',
            elixir: 5,
            superCharge: 0
        };
    }

    const ai = playerStates[AI_PLAYER_ID];
    if (!ai) return;

    aiSpawnTimer += deltaTime;

    // AI Decision loop every 2 seconds
    if (aiSpawnTimer >= 2.0) {
        aiSpawnTimer = 0;
        const availablePresidents = Object.keys(PRESIDENTS);
        const randomPid = availablePresidents[Math.floor(Math.random() * availablePresidents.length)];
        const stats = PRESIDENTS[randomPid];

        if (ai.elixir >= stats.cost) {
            // Pick a lane
            const laneX = Math.random() > 0.5 ? 100 : 300;
            const spawnY = RIVER_Y - 50 - (Math.random() * 50); // Enemy spawns below river (higher Y coordinate logic check in spawn handler is opposite)

            // Note: Server 'spawn' logic expects y-check: isBlue ? (y >= RIVER_Y + 20) : (y <= RIVER_Y - 20)
            // So for enemy (isBlue=false), y must be <= RIVER_Y - 20.

            // Execute Spawn Logic (Dry call or simulate)
            ai.elixir -= stats.cost;
            const unitList = gameState.enemyUnits;
            const count = stats.count || 1;
            for (let i = 0; i < count; i++) {
                unitList.push({
                    ...stats,
                    id: randomPid,
                    uid: Date.now() + Math.random(),
                    x: laneX + (count > 1 ? (Math.random() - 0.5) * 20 : 0),
                    y: spawnY + (count > 1 ? (Math.random() - 0.5) * 20 : 0),
                    currentHp: stats.health,
                    team: 'enemy',
                    owner: AI_PLAYER_ID,
                    isAttacking: false
                });
            }
            console.log(`[AI] Spawned ${randomPid} at (${laneX}, ${spawnY})`);
        }
    }
}

// --- PROCEDURAL SHIFTER ---
function updateProceduralArena(deltaTime) {
    if (!gameState.matchStarted || gameState.gameOver) return;

    const timer = Math.floor(gameState.matchTimer);

    // 120s: Bridge Collapse (Vanish Left Bridge)
    if (timer === 120 && !gameState.shiftsTriggered.has('120')) {
        gameState.shiftsTriggered.add('120');
        gameState.bridges = [BRIDGES[1]]; // Only keep right bridge
        io.emit('announcement', { text: "WEST BRIDGE COLLAPSED!", subtext: "Lanes have shifted!", team: 'neutral' });
    }

    // 60s: Pentagon Deployment (Neutral Tower Pops Up)
    if (timer === 60 && !gameState.shiftsTriggered.has('60')) {
        gameState.shiftsTriggered.add('60');
        gameState.towers.push({ id: 'neutral-pentagon', type: 'neutral', x: 200, y: RIVER_Y, hp: 3000, isPentagon: true, landmark: LANDMARKS.PENTAGON });
        io.emit('announcement', { text: "PENTAGON OUTPOST DEPLOYED!", subtext: "Secure the center!", team: 'neutral' });
    }

    // 30s: Full Recall (Restore Bridges & Double Speed)
    if (timer === 30 && !gameState.shiftsTriggered.has('30')) {
        gameState.shiftsTriggered.add('30');
        gameState.bridges = [...BRIDGES];
        gameState.speedMultiplier = 1.5;
        io.emit('announcement', { text: "INFRASTRUCTURE RESTORED!", subtext: "Hyper-drive active!", team: 'neutral' });
    }

    // 15s: THE CONSTITUTION BOSS SPAWN
    if (timer === 15 && !gameState.shiftsTriggered.has('boss')) {
        gameState.shiftsTriggered.add('boss');
        const stats = PRESIDENTS.the_constitution;
        gameState.neutralUnits.push({
            ...stats,
            uid: Date.now() + Math.random(),
            x: 200,
            y: RIVER_Y,
            currentHp: stats.health,
            team: 'neutral',
            isBoss: true,
            isAttacking: false
        });
        io.emit('announcement', { text: "THE CONSTITUTION OF THE UNITED STATES", subtext: "THE SUPREME LAW HAS ARRIVED!", team: 'neutral' });
        console.log('[BOSS] The Constitution spawned');
    }
}

const PORT = 3001;

// --- RANKED MATCHMAKING PROCESS ---
setInterval(() => {
    if (gameState.matchStarted || matchmakingQueue.length === 0) return;

    const now = Date.now();

    // 1. Try to pair similar players
    if (matchmakingQueue.length >= 2) {
        for (let i = 0; i < matchmakingQueue.length; i++) {
            for (let j = i + 1; j < matchmakingQueue.length; j++) {
                const p1 = matchmakingQueue[i];
                const p2 = matchmakingQueue[j];
                if (Math.abs(p1.trophies - p2.trophies) <= 500) {
                    startMatch(p1, p2);
                    matchmakingQueue.splice(j, 1);
                    matchmakingQueue.splice(i, 1);
                    return;
                }
            }
        }
    }

    // 2. Wait 5s then default to AI
    const firstIn = matchmakingQueue[0];
    if (now - firstIn.joinTime > 5000) {
        startMatch(firstIn, { playerId: AI_PLAYER_ID, trophies: firstIn.trophies, isBot: true });
        matchmakingQueue.shift();
    }
}, 1000);

function startMatch(p1, p2) {
    resetGame();

    // Player 1
    playerStates[p1.playerId] = {
        playerId: p1.playerId,
        socketId: p1.socketId,
        team: 'player',
        elixir: 5,
        superCharge: 0,
        trophies: p1.trophies || 0
    };
    playersByTeam.player = p1.playerId;

    // Player 2 (or Bot)
    if (p2.isBot) {
        playerStates[AI_PLAYER_ID] = {
            playerId: AI_PLAYER_ID,
            socketId: 'cpu_socket',
            team: 'enemy',
            elixir: 5,
            superCharge: 0,
            trophies: p2.trophies || 0
        };
        playersByTeam.enemy = AI_PLAYER_ID;
    } else {
        playerStates[p2.playerId] = {
            playerId: p2.playerId,
            socketId: p2.socketId,
            team: 'enemy',
            elixir: 5,
            superCharge: 0,
            trophies: p2.trophies || 0
        };
        playersByTeam.enemy = p2.playerId;
    }

    gameState.matchStarted = true;
    console.log(`[MATCH] Started: ${p1.playerId} vs ${p2.playerId}`);

    const snap = { gameState, players: playerStates };
    io.emit('init', { gameState: snap.gameState, playerState: playerStates[p1.playerId] });
    // In a multi-room environment, we'd emit to specific sockets/rooms
}

server.listen(PORT, '0.0.0.0', () => console.log(`[SERVER] Standardized Server running on port ${PORT}`));
