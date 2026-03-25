const fs = require('fs');

let server = fs.readFileSync('server.js', 'utf8');

const newServer = `const express = require('express');
const app = express();

app.use(express.json());

// In-memory token storage for Share Link feature
const tokenMap = {};

app.post('/api/share', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });

    const token = Math.random().toString(36).substring(2, 8);
    tokenMap[token] = url;
    res.json({ token });
});

app.get('/api/share/:token', (req, res) => {
    const url = tokenMap[req.params.token];
    if (url) {
        res.json({ url });
    } else {
        res.status(404).json({ error: 'Token not found' });
    }
});

app.use(express.static('.'));
app.listen(4000, () => console.log('Server running on port 4000'));
`;

fs.writeFileSync('server.js', newServer);
