const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const DIST = path.join(process.cwd(), 'dist');

const server = http.createServer((req, res) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);

    if (req.url === '/health') {
        res.writeHead(200);
        return res.end('OK - NATIVE HTTP');
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

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[HTTP] Native Server running at http://0.0.0.0:${PORT}`);
    console.log(`[HTTP] Serving from: ${DIST}`);
});
