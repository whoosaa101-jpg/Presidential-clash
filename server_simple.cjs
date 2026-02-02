const http = require('http');
const { Server } = require('socket.io');

const PORT = 3001;

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Presidential Clash Server Running');
});

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Simple game state
let gameState = {
    units: [],
    towers: { player: 5000, enemy: 5000 },
    playerElixir: 10,
    enemyElixir: 10
};

io.on('connection', (socket) => {
    console.log(`[CONNECT] ${socket.id}`);

    // Send init immediately
    socket.emit('init', {
        gameState,
        playerState: {
            elixir: 10,
            superCharge: 0,
            team: 'player'
        }
    });

    socket.on('spawn', (data) => {
        console.log(`[SPAWN] ${data.presidentId}`);
        // Broadcast to all clients
        io.emit('unitSpawned', {
            id: Math.random().toString(36),
            presidentId: data.presidentId,
            team: data.team || 'player',
            position: data.position,
            health: 1000
        });
    });

    socket.on('disconnect', () => {
        console.log(`[DISCONNECT] ${socket.id}`);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🇺🇸 Presidential Clash Server`);
    console.log(`✅ Running at http://0.0.0.0:${PORT}`);
    console.log(`📡 Socket.IO ready\n`);
});
