const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;
const API_BASE = 'https://api.resonite.com';

// 静的ファイル配信（HTMLを同じサーバーから提供）
app.use(express.static(path.join(__dirname)));

// JSONボディをパース
app.use(express.json());

// プロキシ: /api/* → https://api.resonite.com/*
app.use('/api', async (req, res) => {
  const url = `${API_BASE}${req.url}`;

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

    res.status(apiRes.status)
      .set('Content-Type', apiRes.headers.get('content-type') || 'application/json')
      .send(data);
  } catch (e) {
    console.error('Proxy error:', e.message);
    res.status(502).json({ error: 'プロキシエラー', detail: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`プロキシサーバー起動: http://localhost:${PORT}`);
  console.log(`ブラウザで http://localhost:${PORT}/resonite-world-search.html を開いてください`);
});
