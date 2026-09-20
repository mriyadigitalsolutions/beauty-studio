/*
 * The tiny static host the e2e suite runs against.
 *
 * What ships is `out/` — a folder of files on someone else's hosting, with no
 * Next.js runtime in front of it (§1, story 29). The suite used to drive
 * `next dev` instead, so a regression that only showed up in the export (a
 * route that never got exported, an asset that only the dev server resolves,
 * a `trailingSlash` mismatch) stayed green all the way to the customer.
 *
 * Serves `out/` the way a plain static host does: `/de/` -> `de/index.html`,
 * unknown path -> `404.html` with status 404. No dependency, on purpose.
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { createGzip } from 'node:zlib';

const root = resolve(process.argv[3] ?? 'out');
const port = Number(process.argv[2] ?? 3110);

const TYPES = new Map(
  Object.entries({
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
  }),
);

/** The file a static host would answer `pathname` with, or null. */
function resolveFile(pathname) {
  const clean = normalize(decodeURIComponent(pathname.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const target = join(root, clean);
  if (!target.startsWith(root)) return null;
  if (existsSync(target) && statSync(target).isFile()) return target;
  const indexed = join(target, 'index.html');
  if (existsSync(indexed)) return indexed;
  const html = `${target.replace(/\/$/, '')}.html`;
  if (existsSync(html) && statSync(html).isFile()) return html;
  return null;
}

createServer((request, response) => {
  const match = resolveFile(new URL(request.url, 'http://localhost').pathname);
  const status = match ? 200 : 404;
  const served = match ?? join(root, '404.html');

  if (!existsSync(served)) {
    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end('Not found');
    return;
  }

  const type = TYPES.get(extname(served)) ?? 'application/octet-stream';
  /* Compression and cache headers are what any real static host adds, and
     without them a measurement of this folder measures the toy server: text
     arrives uncompressed and `no-store` alone disqualifies the bfcache. */
  const compressible = /^(text\/|application\/(json|xml|javascript)|image\/svg)/.test(type);
  const gzip = compressible && /\bgzip\b/.test(request.headers['accept-encoding'] ?? '');
  const immutable = served.includes('/_next/static/');

  response.writeHead(status, {
    'content-type': type,
    'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate',
    ...(gzip ? { 'content-encoding': 'gzip', vary: 'Accept-Encoding' } : {}),
  });

  const file = createReadStream(served);
  if (gzip) file.pipe(createGzip()).pipe(response);
  else file.pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`serving ${root} on http://127.0.0.1:${port}`);
});
