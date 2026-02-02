const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const distPath = path.resolve(__dirname, 'dist');

console.log(`[TEST SERVER] Direct Dist Path: ${distPath}`);

// Log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - from ${req.ip}`);
    next();
});

// Serve static files from dist
app.use(express.static(distPath));

// Health check
app.get('/health', (req, res) => res.send('OK - SERVER ACCESSIBLE'));

// Serve SPA for all other routes
app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send(`index.html not found in ${distPath}`);
    }
});

app.listen(3001, '0.0.0.0', () => {
    console.log('Test server (with game build) listening on http://0.0.0.0:3001');
    console.log('Try reaching: http://192.168.1.120:3001');
});
