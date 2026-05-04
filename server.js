const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 8089);
const BASE_DIR = __dirname;
const BASE_PATH = '/cdr-scan';

const STATIC_FILES = new Map([
  ['/index.html', { file: 'index.html', type: 'text/html; charset=utf-8' }],
]);

function sendFile(res, absolutePath, contentType) {
  fs.readFile(absolutePath, (error, data) => {
    if (error) {
      const statusCode = error.code === 'ENOENT' ? 404 : 500;
      res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(statusCode === 404 ? 'Not found' : 'Internal server error');
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}

function normalizePathname(pathname = '/') {
  if (!pathname.startsWith('/')) {
    return `/${pathname}`;
  }
  return pathname;
}

function stripBasePath(pathname = '/') {
  if (pathname === BASE_PATH) {
    return '/';
  }
  if (pathname.startsWith(`${BASE_PATH}/`)) {
    const stripped = pathname.slice(BASE_PATH.length);
    return stripped.startsWith('/') ? stripped : `/${stripped}`;
  }
  return pathname;
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  const pathname = stripBasePath(normalizePathname(requestUrl.pathname));

  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'cdr-scan',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  if (pathname === '/' || pathname === '') {
    sendFile(res, path.join(BASE_DIR, 'index.html'), 'text/html; charset=utf-8');
    return;
  }

  const asset = STATIC_FILES.get(pathname);
  if (asset) {
    sendFile(res, path.join(BASE_DIR, asset.file), asset.type);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(PORT, HOST, () => {
  console.log(`cdr-scan listening on http://${HOST}:${PORT}`);
});
