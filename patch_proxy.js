const fs = require('fs');

let server = fs.readFileSync('server.js', 'utf8');

const searchStr = `app.get('/api/share/:token', (req, res) => {
    const url = tokenMap[req.params.token];
    if (url) {
        res.json({ url });
    } else {
        res.status(404).json({ error: 'Token not found' });
    }
});`;

const replaceStr = `app.get('/api/share/:token', (req, res) => {
    const url = tokenMap[req.params.token];
    if (url) {
        res.json({ url });
    } else {
        res.status(404).json({ error: 'Token not found' });
    }
});

const https = require('https');
const http = require('http');

app.get('/stream/:token', (req, res) => {
    const url = tokenMap[req.params.token];
    if (!url) {
        return res.status(404).send('Token not found');
    }

    // Determine protocol
    const client = url.startsWith('https') ? https : http;

    // Parse URL to properly format options
    const parsedUrl = new URL(url);
    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {}
    };

    // Forward range header if present
    if (req.headers.range) {
        options.headers.range = req.headers.range;
    }

    const proxyReq = client.request(options, (proxyRes) => {
        // Forward headers
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        // Pipe the stream
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (e) => {
        console.error('Proxy error:', e);
        res.status(500).send('Internal Server Error');
    });

    req.pipe(proxyReq);
});`;

server = server.replace(searchStr, replaceStr);

fs.writeFileSync('server.js', server);
