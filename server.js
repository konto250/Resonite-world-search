const express = require('express');
const path = require('path');

const pagedSearch = require('./api/records/pagedSearch');
const worldName = require('./api/records/worldName');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.all('/api/records/pagedSearch', (req, res) => pagedSearch(req, res));
app.all('/api/records/worldName', (req, res) => worldName(req, res));

app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Local server running at http://localhost:${port}`);
});
