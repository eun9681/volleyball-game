const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const config = require("./vercel.json");

const root = path.join(__dirname, "dist");
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || (process.env.PORT ? "0.0.0.0" : "127.0.0.1");
const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key, value]));
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"
};

const server = http.createServer(async (req, res) => {
  function reply(code, body, extra = {}) {
    res.writeHead(code, { ...headers, "Cache-Control": "no-store", ...extra });
    res.end(req.method === "HEAD" ? undefined : body);
  }
  if (!["GET", "HEAD"].includes(req.method)) {
    return reply(405, "Method not allowed", { Allow: "GET, HEAD" });
  }
  let name;
  try {
    const url = new URL(req.url, "http://localhost");
    name = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
  } catch {
    return reply(400, "Bad request");
  }
  const file = path.resolve(root, name);
  if (!file.startsWith(root + path.sep) || name.split(/[\\/]/).some((part) => part.startsWith("."))) {
    return reply(403, "Forbidden");
  }
  try {
    const data = await fs.readFile(file);
    reply(200, data, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
  } catch {
    reply(404, "Not found. Run npm run build first.");
  }
});

server.listen(port, host, () => {
  console.log(`http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}/`);
});
