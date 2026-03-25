const fs = require('fs');

const shareCode = `
export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

    // CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (request.method === 'POST') {
        try {
            const body = await request.json();
            const videoUrl = body.url;

            if (!videoUrl) {
                return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            // AES-GCM encryption
            const encoder = new TextEncoder();
            const ENCRYPTION_KEY = 'streamflow-secret-key-1234567890'.padEnd(32, '0').slice(0, 32);

            const keyMaterial = await crypto.subtle.importKey(
                "raw",
                encoder.encode(ENCRYPTION_KEY).buffer,
                { name: "AES-GCM" },
                false,
                ["encrypt"]
            );

            const data = encoder.encode(videoUrl);
            const iv = crypto.getRandomValues(new Uint8Array(12));

            const ciphertext = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                keyMaterial,
                data
            );

            const encryptedBytes = new Uint8Array(iv.length + ciphertext.byteLength);
            encryptedBytes.set(iv, 0);
            encryptedBytes.set(new Uint8Array(ciphertext), iv.length);

            const token = btoa(String.fromCharCode(...encryptedBytes))
                .replace(/\\+/g, '-')
                .replace(/\\//g, '_')
                .replace(/=/g, '');

            return new Response(JSON.stringify({ token }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
    }

    // Handle GET - Decode token and redirect to proxy
    const token = url.searchParams.get('v');
    if (!token) {
        return new Response(JSON.stringify({ error: 'Missing token parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    try {
        const ENCRYPTION_KEY = 'streamflow-secret-key-1234567890'.padEnd(32, '0').slice(0, 32);
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            encoder.encode(ENCRYPTION_KEY).buffer,
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        );

        const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
        const binaryStr = atob(base64);
        const encBytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            encBytes[i] = binaryStr.charCodeAt(i);
        }

        const iv = encBytes.slice(0, 12);
        const ciphertext = encBytes.slice(12);

        const decryptedBuf = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            keyMaterial,
            ciphertext
        );

        const decoder = new TextDecoder();
        const originalUrl = decoder.decode(decryptedBuf);

        // Fetch via proxy function
        const proxyUrl = new URL('/proxy', url.origin);
        proxyUrl.searchParams.set('url', originalUrl);

        const proxyReq = new Request(proxyUrl.toString(), request);
        return await fetch(proxyReq);

    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}
`;

fs.writeFileSync('functions/share.js', shareCode);
