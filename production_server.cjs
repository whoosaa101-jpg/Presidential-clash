const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200);
        return res.end('D.C. SECURE - ONLINE');
    }
    res.writeHead(404);
    res.end('NOT_FOUND');
});

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

let players = {};
let matchActive = false;
let gameState = {
    units: [],
    enemyUnits: [],
    towers: [],
    matchTimer: 180,
    matchStarted: false,
    gameOver: null,
    activeEvents: []
};

// --- CORE SERVER LOGIC ---
const resetMatch = () => {
    gameState = {
        units: [],
        enemyUnits: [],
        towers: [
            { id: 'p-l', x: 100, y: 600, hp: 1500, type: 'player' },
            { id: 'p-r', x: 300, y: 600, hp: 1500, type: 'player' },
            { id: 'p-k', x: 200, y: 650, hp: 3000, type: 'player', isKing: true },
            { id: 'e-l', x: 100, y: 100, hp: 1500, type: 'enemy' },
            { id: 'e-r', x: 300, y: 100, hp: 1500, type: 'enemy' },
            { id: 'e-k', x: 200, y: 50, hp: 3000, type: 'enemy', isKing: true }
        ],
        matchTimer: 180,
        matchStarted: true,
        gameOver: null,
        activeEvents: []
    };
    io.emit('init', { gameState, playerState: { elixir: 5, superCharge: 0, team: 'player' } });
};

io.on('connection', (socket) => {
    console.log(`[SECURE_LINE] Connected: ${socket.id}`);

    socket.on('register', (data) => {
        players[data.playerId] = {
            id: socket.id,
            team: Object.keys(players).length % 2 === 0 ? 'player' : 'enemy',
            elixir: 5,
            superCharge: 0
        };

        socket.emit('init', {
            gameState,
            playerState: players[data.playerId]
        });

        if (Object.keys(players).length >= 2 && !matchActive) {
            matchActive = true;
            resetMatch();
            io.emit('announcement', { text: "MATCH STARTING - SECURE THE CAPITAL!", team: 'neutral' });
        }
    });

    socket.on('spawn', (data) => {
        const p = players[data.playerId];
        if (!p) return;

        // Simplified broadcast for prototype sync
        socket.broadcast.emit('snapshot', {
            gameState: { ...gameState, units: [...gameState.units, { ...data.president, x: data.x, y: data.y, team: p.team }] },
            players
        });
    });

    socket.on('activateSuper', (data) => {
        const p = players[data.playerId];
        io.emit('superEffect', { ...data, team: p?.team || 'player' });
    });

    socket.on('sendEmote', (data) => {
        socket.broadcast.emit('emote', data);
    });

    socket.on('disconnect', () => {
        console.log(`[SECURE_LINE] Cut: ${socket.id}`);
        // Clean up player
        for (let pid in players) {
            if (players[pid].id === socket.id) delete players[pid];
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n\n================================`);
    console.log(`🦅 PRESIDENTIAL CLASH SERVER 🦅`);
    console.log(`================================`);
    console.log(`STATUS: OPERATIONAL`);
    console.log(`PORT: ${PORT}`);
    console.log(`READY FOR CROSS-COUNTRY SYNC`);
    console.log(`================================\n`);
});
