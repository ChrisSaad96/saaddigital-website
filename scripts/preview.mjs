import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.png':'image/png', '.xml':'application/xml', '.txt':'text/plain'};

export function createPreviewServer() {
  return http.createServer((request, response) => {
    let target;
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      target = path.resolve(root, '.' + pathname);
      const relative = path.relative(root, target);
      if (relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).some(part => part.startsWith('.') && part !== '.well-known')) throw Error('Invalid path');
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
      if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
        response.statusCode = 404;
        target = path.join(root, '404.html');
      }
    } catch {
      response.writeHead(400).end('Invalid request');
      return;
    }
    response.setHeader('Content-Type', (types[path.extname(target)] || (target.endsWith('apple-app-site-association') ? 'application/json' : 'application/octet-stream')) + '; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    fs.createReadStream(target).pipe(response);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.argv[2] || 8080);
  const server = createPreviewServer();
  server.listen(port, '127.0.0.1', () => console.log(`Saad Digital preview: http://127.0.0.1:${server.address().port}/`));
}
