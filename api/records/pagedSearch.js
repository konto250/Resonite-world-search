const API_BASE = 'https://api.resonite.com';

module.exports = async (req, res) => {
    const url = `${API_BASE}/records/pagedSearch`;

    try {
        const fetchOptions = {
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            const body = { ...req.body };
            if (body.count !== undefined && body.count > 25) {
                return res.status(400).json({ error: '件数上限は25件までです。' });
            }
            fetchOptions.body = JSON.stringify(body);
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
