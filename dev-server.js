const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname);
const port = Number(process.env.PORT || 5173);
const dataDir = path.join(root, "server-data");
const savePath = path.join(dataDir, "saves.json");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};
const playableAnimals = new Set(["bunny", "cat", "bear", "frog", "sheep", "penguin", "chick", "lion", "turtle", "rhino", "parrot"]);
const stages = new Set(["beach", "sunset", "blossom", "moon", "autumn", "forest"]);

function securityHeaders(extra = {}) {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cache-Control": "no-store",
    ...extra
  };
}

function loadSaves() {
  try {
    return JSON.parse(fs.readFileSync(savePath, "utf8"));
  } catch {
    return {};
  }
}

function writeSaves(saves) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(savePath, JSON.stringify(saves, null, 2));
}

function sendJson(res, status, data) {
  res.writeHead(status, securityHeaders({ "Content-Type": "application/json; charset=utf-8" }));
  res.end(JSON.stringify(data));
}

function readJson(req, callback) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 24000) req.destroy();
  });
  req.on("end", () => {
    try {
      callback(null, body ? JSON.parse(body) : {});
    } catch (error) {
      callback(error);
    }
  });
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(number)));
}

function sanitizeSave(data) {
  const ownedAnimals = Array.isArray(data.ownedAnimals)
    ? data.ownedAnimals.filter((animal) => playableAnimals.has(animal))
    : [];
  if (!ownedAnimals.includes("bunny")) ownedAnimals.unshift("bunny");

  const selectedAnimal = playableAnimals.has(data.selectedAnimal) && ownedAnimals.includes(data.selectedAnimal)
    ? data.selectedAnimal
    : "bunny";

  return {
    nickname: String(data.nickname || "배구왕토끼").trim().slice(0, 10) || "배구왕토끼",
    selectedStage: stages.has(data.selectedStage) ? data.selectedStage : "beach",
    selectedAnimal,
    coins: clampNumber(data.coins, 0, 999999, 0),
    gems: clampNumber(data.gems, 0, 99999, 0),
    playerLevel: clampNumber(data.playerLevel, 1, 99, 1),
    playerXp: clampNumber(data.playerXp, 0, 99, 0),
    mailClaimed: Boolean(data.mailClaimed),
    ownedAnimals: Array.from(new Set(ownedAnimals)),
    touchControlsVisible: data.touchControlsVisible !== false,
    updatedAt: new Date().toISOString()
  };
}

function playerIdFrom(req, data = {}) {
  const headerId = String(req.headers["x-player-id"] || "");
  const bodyId = String(data.playerId || "");
  const id = headerId || bodyId;
  return /^[a-f0-9]{32}$/.test(id) ? id : "";
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/api/save" && req.method === "GET") {
    const playerId = playerIdFrom(req);
    if (!playerId) return sendJson(res, 400, { error: "invalid player id" });
    const saves = loadSaves();
    return sendJson(res, 200, { save: saves[playerId] || null });
  }

  if (url.pathname === "/api/save" && req.method === "POST") {
    return readJson(req, (error, data) => {
      if (error) return sendJson(res, 400, { error: "invalid json" });
      const playerId = playerIdFrom(req, data);
      if (!playerId) return sendJson(res, 400, { error: "invalid player id" });
      const saves = loadSaves();
      saves[playerId] = sanitizeSave(data);
      writeSaves(saves);
      return sendJson(res, 200, { ok: true, save: saves[playerId] });
    });
  }

  if (url.pathname === "/api/player-id" && req.method === "POST") {
    return sendJson(res, 200, { playerId: crypto.randomBytes(16).toString("hex") });
  }

  const name = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
  const filePath = path.resolve(root, name);

  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    res.writeHead(403, securityHeaders());
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, securityHeaders());
      res.end("Not found");
      return;
    }
    res.writeHead(200, securityHeaders({ "Content-Type": types[path.extname(filePath)] || "application/octet-stream" }));
    res.end(data);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`http://127.0.0.1:${port}/`);
});
