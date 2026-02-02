const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const DIST = path.join(process.cwd(), 'dist');
console.log(`[MINIMAL] Serving from: ${DIST}`);

app.use(express.static(DIST));

app.get('/test', (req, res) => res.send('EXPRESS 5 WORKING'));

app.get('*', (req, res) => {
    const indexPath = path.join(DIST, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("Build missing index.html");
    }
});

app.listen(3001, '0.0.0.0', () => {
    console.log('[MINIMAL] Server on 3001');
});
