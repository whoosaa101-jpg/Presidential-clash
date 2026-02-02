const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const PORT = 3001;
const DIST = path.join(process.cwd(), 'dist');

console.log("[SERVER] Stabilized Game Server booting...");
console.log(`[SERVER] Static Root: ${DIST}`);

const server = http.createServer((req, res) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);

    if (req.url === '/health') {
        res.writeHead(200);
        return res.end('OK - NATIVE STABLE');
    }

    let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url);

    // Simple SPA fallback
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST, 'index.html');
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end("Not Found");
            return;
        }

        const ext = path.extname(filePath);
        const contentType = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.png': 'image/png',
            '.svg': 'image/svg+xml'
        }[ext] || 'text/plain';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Game State & Constants
const PRESIDENTS = {
    fdr: { cost: 5, health: 3200, damage: 150 },
    truman: { cost: 4, health: 700, damage: 180 },
    grant: { cost: 4, health: 1400, damage: 190 }
};

let activeEvent = null;
let gameState = {
    units: [],
    enemyUnits: [],
    towers: { player: 5000, enemy: 5000 },
    gameTime: 0,
    playerElixir: 10,
    enemyElixir: 10
};
let players = {};

io.on('connection', (socket) => {
    console.log(`[SOCKET] User Connected: ${socket.id}`);

    // Send initial game state
    socket.emit('init', {
        gameState: gameState,
        playerState: {
            elixir: 10,
            superCharge: 0,
            team: 'player'
        }
    });

    socket.on('register', (data) => {
        console.log(`[SOCKET] Player registered: ${data.playerId}`);
        players[data.playerId] = {
            socketId: socket.id,
            elixir: 10,
            superCharge: 0,
            team: 'player'
        };
    });

    socket.on('join', (data) => {
        console.log(`[SOCKET] User joined as ${data.team}`);
    });

    socket.on('spawn', (data) => {
        console.log(`[SOCKET] Spawn: ${data.presidentId} at ${data.position}`);
        socket.broadcast.emit('spawn', { ...data, socketId: socket.id });
    });

    socket.on('emote', (data) => {
        console.log(`[SOCKET] Emote: ${data.emote}`);
        socket.broadcast.emit('emote', data);
    });

    socket.on('disconnect', () => {
        console.log(`[SOCKET] User Disconnected: ${socket.id}`);
        // Remove player
        for (let playerId in players) {
            if (players[playerId].socketId === socket.id) {
                delete players[playerId];
            }
        }
    });
});

// Arena Events Loop
setInterval(() => {
    if (!activeEvent) {
        const events = ['INFRASTRUCTURE_BILL', 'TAX_CUT', 'ECONOMIC_BOOM'];
        activeEvent = events[Math.floor(Math.random() * events.length)];
        console.log(`[EVENT] Starting ${activeEvent}`);
        io.emit('arenaEvent', { type: activeEvent });

        setTimeout(() => {
            console.log(`[EVENT] Ending ${activeEvent}`);
            io.emit('arenaEvent', { type: null });
            activeEvent = null;
        }, 15000);
    }
}, 45000);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Running at http://0.0.0.0:${PORT}`);
});
