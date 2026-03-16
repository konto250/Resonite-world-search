const API_BASE = 'https://api.resonite.com';

module.exports = async (req, res) => {
    // Vercelがcatch-allセグメントを配列で渡す
    const segments = req.query.path;
    const apiPath = Array.isArray(segments) ? segments.join('/') : (segments || '');

    // pathパラメータ以外のクエリ文字列を引き継ぐ
    const { path: _, ...otherQuery } = req.query;
    const qs = new URLSearchParams(otherQuery).toString();
    const url = `${API_BASE}/${apiPath}${qs ? `?${qs}` : ''}`;
    console.log('[proxy] url:', url);          // ← 追加
    console.log('[proxy] method:', req.method); // ← 追加

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
