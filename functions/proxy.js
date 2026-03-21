export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const videoUrl = url.searchParams.get('url');

    // CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (!videoUrl) {
        return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    try {
        const parsedUrl = new URL(videoUrl);
        const headers = new Headers();
        headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        headers.set('Accept', '*/*');
        headers.set('Referer', `${parsedUrl.protocol}//${parsedUrl.hostname}/`);

        // Forward Range header for seeking
        const range = request.headers.get('Range');
        if (range) {
            headers.set('Range', range);
        }

        const response = await fetch(videoUrl, {
            method: request.method,
            headers: headers,
        });

        const proxyHeaders = new Headers(response.headers);

        // Ensure proper CORS headers are appended to the response
        for (const [key, value] of Object.entries(corsHeaders)) {
            proxyHeaders.set(key, value);
        }

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: proxyHeaders
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}
