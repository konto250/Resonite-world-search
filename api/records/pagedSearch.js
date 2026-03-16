const API_BASE = 'https://api.resonite.com';

module.exports = async (req, res) => {
    const url = `${API_BASE}/records/pagedSearch`;
    console.log('[proxy] url:', url);
    console.log('[proxy] method:', req.method);

    try {
        const fetchOptions = {
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const apiRes = await fetch(url, fetchOptions);
        const data = await apiRes.text();

        res
            .status(apiRes.status)
            .setHeader('Content-Type', apiRes.headers.get('content-type') || 'application/json')
            .send(data);
    } catch (e) {
        console.error('Proxy error:', e.message);
        res.status(502).json({ error: 'プロキシエラー', detail: e.message });
    }
};
