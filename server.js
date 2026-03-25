const express = require('express');
const app = express();
app.use(express.static('.'));


// Share feature memory (simulating a database)
const shareTokens = new Map();

// Helper to create a random string
function generateToken() {
    return Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);
}

app.use(express.json());

// Generate token for a URL
app.post('/api/share', (req, res) => {
    const url = req.body.url;
    if (!url) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    // Store in our mock DB
    const token = generateToken();
    shareTokens.set(token, url);

    res.json({ token });
});

// Resolve token back to URL and STREAM it (DO NOT leak URL)
app.get('/api/share', async (req, res) => {
    const token = req.query.v;
    if (!token) {
        return res.status(400).json({ error: 'Missing token parameter' });
    }

    const url = shareTokens.get(token);
    if (!url) {
        return res.status(404).json({ error: 'Token not found or expired' });
    }

    // Stream the video back directly so the client never sees the URL
    try {
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*'
        };

        if (req.headers.range) {
            headers.Range = req.headers.range;
        }

        const response = await fetch(url, { headers });

        res.status(response.status);
        response.headers.forEach((value, name) => {
            res.setHeader(name, value);
        });

        // Pipe the fetch response body directly to the express response
        response.body.pipe(res);
    } catch (e) {
        res.status(500).json({ error: 'Failed to proxy video stream' });
    }
});


app.listen(4000, () => console.log('Server running on port 4000'));
