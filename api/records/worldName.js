const ALLOWED_HOSTS = new Set(['go.resonite.com']);

function getTargetUrl(req) {
    if (req.method === 'GET') {
        return req.query?.worldWebUrl || req.query?.url;
    }
    if (req.method === 'POST') {
        return req.body?.worldWebUrl || req.body?.url;
    }
    return null;
}

function decodeHtmlEntities(text) {
    return text
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)));
}

function extractMainH1(html) {
    const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
    if (!mainMatch) return null;

    const h1Match = mainMatch[1].match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    if (!h1Match) return null;

    const stripped = h1Match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return decodeHtmlEntities(stripped);
}

module.exports = async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const targetUrlRaw = getTargetUrl(req);
    if (!targetUrlRaw || typeof targetUrlRaw !== 'string') {
        return res.status(400).json({ error: 'worldWebUrl (または url) を指定してください。' });
    }

    let targetUrl;
    try {
        targetUrl = new URL(targetUrlRaw);
    } catch {
        return res.status(400).json({ error: 'URLの形式が不正です。' });
    }

    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
        return res.status(400).json({ error: 'http/https のURLを指定してください。' });
    }

    if (!ALLOWED_HOSTS.has(targetUrl.hostname)) {
        return res.status(400).json({ error: 'go.resonite.com のURLのみ指定できます。' });
    }

    try {
        const upstreamRes = await fetch(targetUrl.toString(), {
            method: 'GET',
            redirect: 'follow',
        });

        const responseBody = await upstreamRes.text();

        if (upstreamRes.status !== 200) {
            return res
                .status(upstreamRes.status)
                .setHeader('Content-Type', 'text/plain; charset=utf-8')
                .send(String(upstreamRes.status));
        }

        const title = extractMainH1(responseBody);
        if (!title) {
            return res.status(404).json({ error: 'main/h1 が見つかりませんでした。' });
        }

        return res
            .status(200)
            .setHeader('Content-Type', 'text/plain; charset=utf-8')
            .send(title);
    } catch (e) {
        console.error('World name fetch error:', e.message);
        return res.status(502).json({ error: 'ワールドページの取得に失敗しました。' });
    }
};
