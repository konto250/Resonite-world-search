// ソートパラメータのenum値マッピング
const SortParam = {
    CreationDate: 0, LastUpdateDate: 1, FirstPublishTime: 2,
    TotalVisits: 3, Name: 4, Random: 5
};
const SortDir = { Ascending: 0, Descending: 1 };

// タグからメインカテゴリ・サブカテゴリを判定
const TAG_CATEGORIES = [
    { main: 'world', sub: 'social', tags: ['world', 'social'] },
    { main: 'world', sub: 'game', tags: ['world', 'game'] },
    { main: 'world', sub: 'misc', tags: ['world', 'misc'] },
    { main: 'avatar', sub: 'avatars', tags: ['avatar', 'avatars'] },
    { main: 'avatar', sub: 'misc', tags: ['avatar', 'misc'] },
    { main: 'other', sub: 'tau', tags: ['other', 'tau'] },
    { main: 'other', sub: 'misc', tags: ['other', 'misc'] },
    { main: 'art', sub: '', tags: ['art'] },
    { main: 'esd', sub: '', tags: ['esd'] },
    { main: 'meme', sub: '', tags: ['meme'] },
    { main: 'narrative', sub: '', tags: ['narrative'] },
];

function stripRichText(str) {
    if (!str) return '';
    return str.replace(/<\/?[^>]+>/g, '').replace(/[\r\n]+/g, ' ').trim();
}

function classifyTags(tags) {
    if (!tags || tags.length === 0) return { main: '', sub: '' };
    const lowerTags = tags.map(t => t.toLowerCase());
    for (const cat of TAG_CATEGORIES) {
        if (cat.tags.every(t => lowerTags.includes(t))) {
            return { main: cat.main, sub: cat.sub };
        }
    }
    return { main: '', sub: '' };
}

let currentRecords = [];

async function doSearch() {
    const tagsInput = document.getElementById('tags').value.trim();
    const count = parseInt(document.getElementById('count').value) || 100;
    const sortBy = document.getElementById('sortBy').value;
    const sortDir = document.getElementById('sortDir').value;
    const btn = document.getElementById('searchBtn');
    const status = document.getElementById('status');

    if (!tagsInput) {
        status.innerHTML = '<span class="error">タグを入力してください</span>';
        return;
    }

    const requiredTags = tagsInput.split(',').map(t => t.trim()).filter(t => t);

    const body = {
        count: count,
        sortBy: SortParam[sortBy],
        sortDirection: SortDir[sortDir],
        requiredTags: requiredTags,
        recordType: 'world'
    };

    btn.disabled = true;
    status.textContent = '検索中...';
    document.getElementById('resultsHeader').style.display = 'none';
    document.getElementById('resultsTable').style.display = 'none';

    try {
        const resp = await fetch('/api/records/pagedSearch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!resp.ok) {
            throw new Error(`API エラー: ${resp.status} ${resp.statusText}`);
        }

        const data = await resp.json();
        currentRecords = data.records || [];
        renderResults(currentRecords, data.totalCount);
        status.textContent = '';
    } catch (e) {
        status.innerHTML = `<span class="error">${e.message}</span>`;
        if (e instanceof TypeError && e.message === 'Failed to fetch') {
            status.innerHTML = '<span class="error">APIへの接続に失敗しました（CORSエラーの可能性があります）。<br>CORSを無効にしたブラウザか、プロキシ経由でお試しください。</span>';
        }
        currentRecords = [];
    } finally {
        btn.disabled = false;
    }
}

function renderResults(records, totalCount) {
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';

    if (records.length === 0) {
        document.getElementById('status').textContent = '結果が見つかりませんでした';
        return;
    }

    document.getElementById('resultsHeader').style.display = 'flex';
    const total = totalCount != null ? `全 ${totalCount} 件中 ` : '';
    document.getElementById('resultCount').textContent = `${total}${records.length} 件を表示`;
    document.getElementById('resultsTable').style.display = 'table';

    const showCreation = document.getElementById('showCreationDate').checked;
    document.querySelectorAll('.col-creation').forEach(el => el.style.display = showCreation ? '' : 'none');

    for (const r of records) {
        const tr = document.createElement('tr');
        const tags = (r.tags || []).join(', ');
        const cat = classifyTags(r.tags);
        const uri = `resrec:///${r.ownerId}/${r.id}`;
        const webUrl = `https://go.resonite.com/record/${r.ownerId}/${r.id}`;
        const published = r.firstPublishTime ? new Date(r.firstPublishTime).toLocaleDateString('ja-JP') : '-';
        const created = r.creationTime ? new Date(r.creationTime).toLocaleDateString('ja-JP') : '-';
        const updated = r.lastModificationTime ? new Date(r.lastModificationTime).toLocaleDateString('ja-JP') : '-';

        tr.innerHTML = `
      <td><a href="${esc(webUrl)}" target="_blank">開く</a></td>
      <td title="${esc(stripRichText(r.name))}">${esc(stripRichText(r.name))}</td>
      <td title="${esc(r.ownerName)}">${esc(r.ownerName)}</td>
      <td>${esc(cat.main)}</td>
      <td>${esc(cat.sub)}</td>
      <td>${r.visits ?? '-'}</td>
      <td>${published}</td>
      <td class="col-creation" style="${showCreation ? '' : 'display:none'}">${created}</td>
      <td>${updated}</td>
      <td title="${esc(tags)}">${esc(tags)}</td>
      <td><a href="${uri}">${uri}</a></td>
    `;
        tbody.appendChild(tr);
    }
}

function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function downloadCSV() {
    if (currentRecords.length === 0) return;

    const showCreation = document.getElementById('showCreationDate').checked;
    const header = ['訪問済？', '投票候補', '名前', 'オーナー', 'メインカテゴリ', 'サブカテゴリ', 'URI', 'ブラウザURL', '公開日'];
    if (showCreation) header.push('作成日');
    header.push('更新日', 'タグ');
    const rows = currentRecords.map(r => {
        const uri = `resrec:///${r.ownerId}/${r.id}`;
        const webUrl = `https://go.resonite.com/record/${r.ownerId}/${r.id}`;
        const cat = classifyTags(r.tags);
        const cols = [
            '',
            '',
            csvField(stripRichText(r.name)),
            csvField(r.ownerName),
            csvField(cat.main),
            csvField(cat.sub),
            csvField(uri),
            csvField(webUrl),
            r.firstPublishTime || ''
        ];
        if (showCreation) cols.push(r.creationTime || '');
        cols.push(r.lastModificationTime || '', csvField((r.tags || []).join(';')));
        return cols.join(',');
    });

    const bom = '\uFEFF';
    const csv = bom + header.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resonite_worlds_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function csvField(val) {
    if (val == null) return '';
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

// Enterキーで検索
document.getElementById('tags').addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
});
