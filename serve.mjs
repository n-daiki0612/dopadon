// 開発用の静的HTTPサーバー。ゲームに必要な明示リストだけを配信する。
// ディレクトリ走査・一覧表示は行わず、シンボリックリンクも拒否する。
import http from 'node:http';
import { readFile, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url));
const allowed = new Set([
  'index.html', 'main.js', 'style.css', 'scoring.js', 'fishing.js', 'result.js',
  'data/config.js', 'data/user_data.js', 'shop/shop.js',
  ...['title', 'fishing', 'result', 'shop'].map(s => `pages/${s}.html`),
  ...['bg_sea','bg_kitchen','bowl','can','ika','kani','net','sakuraebi','shirasu','tai','title_logo','unagi'].map(s => `dopadon/images/${s}.png`),
]);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png' };
const server = http.createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
    const url = new URL(req.url, 'http://localhost');
    const name = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    if (!allowed.has(name)) { res.writeHead(404); res.end('Not found'); return; }
    let current = root;
    for (const part of name.split('/')) {
      current = path.join(current, part);
      if ((await lstat(current)).isSymbolicLink()) throw new Error('Link blocked');
    }
    const body = await readFile(current);
    res.writeHead(200, { 'Content-Type': mime[path.extname(name)], 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(Number(process.env.PORT || 4173), '127.0.0.1', () => console.log(`Open http://127.0.0.1:${server.address().port}`));
