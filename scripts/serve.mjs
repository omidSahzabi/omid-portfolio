// Local preview of the static export. No application server is needed in production.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, relative, extname, isAbsolute } from "node:path";

const root = resolve("out");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".woff": "font/woff", ".woff2": "font/woff2", ".glb": "model/gltf-binary", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8" };
const server = createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    let file = resolve(root, `.${pathname}`);
    const local = relative(root, file);
    if (local.startsWith("..") || isAbsolute(local)) { res.writeHead(403).end(); return; }
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" });
    res.end(data);
  } catch { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("Not found"); }
});
server.listen(Number(process.env.PORT ?? 3000), "127.0.0.1", () => { console.log(`Portfolio preview: http://127.0.0.1:${process.env.PORT ?? 3000}`); });
