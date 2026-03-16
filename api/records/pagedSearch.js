const API_BASE = 'https://api.resonite.com';

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const url = `${API_BASE}/records/pagedSearch`;

    try {
        const body = { ...req.body };

        const count = body.count;
        if (count !== undefined) {
            if (!Number.isInteger(count) || count < 1 || count > 25) {
                return res.status(400).json({ error: 'count は1以上25以下の整数で指定してください。' });
            }
        }

        const offset = body.offset;
        if (offset !== undefined) {
            if (!Number.isInteger(offset) || offset < 0 || offset > 10000) {
                return res.status(400).json({ error: 'offset は0以上10000以下の整数で指定してください。' });
            }
        }

        const requiredTags = body.requiredTags;
        if (requiredTags !== undefined) {
            if (!Array.isArray(requiredTags) || requiredTags.length > 20) {
                return res.status(400).json({ error: 'requiredTags は20件以下の配列で指定してください。' });
            }
            for (const tag of requiredTags) {
                if (typeof tag !== 'string' || tag.length > 100) {
                    return res.status(400).json({ error: 'タグは100文字以下の文字列で指定してください。' });
                }
            }
        }

        const fetchOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        };
        fetchOptions.body = JSON.stringify(body);

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
