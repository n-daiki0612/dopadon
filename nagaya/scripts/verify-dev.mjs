import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

// Run server and requests together so verification does not depend on a
// terminal session remaining alive between commands.
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5183', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
let output = '';
server.stdout.on('data', chunk => { output += chunk; });
server.stderr.on('data', chunk => { output += chunk; });
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error(output);
    if (output.includes('http://127.0.0.1:5183/')) { ready = true; break; }
    await delay(500);
  }
  if (!ready) throw new Error(`Server timed out: ${output}`);
  for (const route of ['/', '/src/main.jsx', '/.vite-cache/deps/react.js', '/.vite-cache/deps/react-dom_client.js']) {
    const response = await fetch(`http://127.0.0.1:5183${route}`, { signal: AbortSignal.timeout(30000) });
    const body = await response.text();
    if (!response.ok || (route !== '/' && !response.headers.get('content-type')?.includes('javascript'))) throw new Error(`${route}: HTTP ${response.status}\n${body.slice(0, 500)}`);
    console.log(`PASS ${response.status} ${route} (${body.length} characters)`);
  }
  if (output.includes('[ERROR]')) throw new Error(output);
  console.log('Development server and optimized dependencies verified.');
} finally {
  server.kill();
}
