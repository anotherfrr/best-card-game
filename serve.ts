// serve.ts — a tiny static server for game/ (Node 22, standard library only),
// so Ember Court can be played locally without a build step:
//   node --run serve        (or: node serve.ts)
// then open http://localhost:8080. Development convenience only.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const port = Number(process.env.PORT || 8080);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  let pathname = url.pathname;
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = resolve(join(root, normalize(decodeURIComponent(pathname))));
  if (file !== root && !file.startsWith(root + sep)) {
    response.writeHead(403).end('forbidden');
    return;
  }
  try {
    const size = statSync(file).size;
    response.writeHead(200, {
      'content-type': MIME[extname(file)] || 'application/octet-stream',
      'content-length': size,
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end('not found');
  }
}).listen(port, () => console.log(`Ember Court at http://localhost:${port}`));
