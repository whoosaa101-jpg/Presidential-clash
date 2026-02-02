const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

console.log("[SERVER] Booting...");

const app = express();
app.use(cors());

// Use absolute paths with process.cwd() to avoid __dirname issues in some environments
const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
console.log(`[SERVER] Static Root: ${DIST}`);

app.use(express.static(DIST));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.get('/health', (req, res) => res.send('OK'));

app.get('*', (req, res) => {
    const indexPath = path.join(DIST, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("Build missing index.html");
    }
});

// Game logic starts here
const PRESIDENTS = {
    fdr: { cost: 5, health: 3200, damage: 150 },
    truman: { cost: 4, health: 700, damage: 180 },
    grant: { cost: 4, health: 1400, damage: 190 }
};

io.on('connection', (socket) => {
    console.log(`[SOCKET] ID: ${socket.id}`);
    socket.on('ping', () => socket.emit('pong'));
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Stable Game Server on port ${PORT}`);
});
