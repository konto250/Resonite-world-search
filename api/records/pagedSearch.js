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
            const count = body.count;
            if (count !== undefined) {
                if (!Number.isInteger(count) || count < 1 || count > 25) {
                    return res.status(400).json({ error: 'count は1以上25以下の整数で指定してください。' });
                }
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
        res.status(502).json({ error: 'プロキシエラーが発生しました。' });
    }
};
