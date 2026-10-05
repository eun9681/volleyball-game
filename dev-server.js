const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname);
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || (process.env.PORT ? "0.0.0.0" : "127.0.0.1");
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
const rateBuckets = new Map();
const maxBodyBytes = 24000;
const maxSaveJump = {
  coins: 2500,
  gems: 30,
  level: 1,
  animals: 1
};

function securityHeaders(extra = {}) {
  return {
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self' data:",
      "connect-src 'self'",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join("; "),
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
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

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
}

function rateLimit(req, res) {
  const key = `${clientIp(req)}:${req.url.split("?")[0]}`;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const limit = req.url.startsWith("/api/") ? 90 : 600;
  const bucket = rateBuckets.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  if (bucket.count > limit) {
    sendJson(res, 429, { error: "too many requests" });
    return false;
  }
  return true;
}

function validOrigin(req) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return true;
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers.host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function readJson(req, callback) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > maxBodyBytes) req.destroy();
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

function hashSecret(secret) {
  return crypto.createHash("sha256").update(String(secret)).digest("hex");
}

function playerSecretFrom(req, data = {}) {
  const headerSecret = String(req.headers["x-player-secret"] || "");
  const bodySecret = String(data.playerSecret || "");
  const secret = headerSecret || bodySecret;
  return /^[a-f0-9]{64}$/.test(secret) ? secret : "";
}

function canAccessSave(save, secret) {
  if (!save) return true;
  if (!save.secretHash) return true;
  const a = Buffer.from(save.secretHash, "hex");
  const b = Buffer.from(hashSecret(secret), "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function boundedIncrease(next, previous, key, maxJump) {
  if (!previous) return next;
  return Math.min(next, clampNumber(previous[key], 0, 999999, 0) + maxJump);
}

function sanitizeSave(data, previousSave, secret) {
  const ownedAnimals = Array.isArray(data.ownedAnimals)
    ? data.ownedAnimals.filter((animal) => playableAnimals.has(animal))
    : [];
  if (!ownedAnimals.includes("bunny")) ownedAnimals.unshift("bunny");

  let finalOwnedAnimals = Array.from(new Set(ownedAnimals));
  if (previousSave?.ownedAnimals?.length) {
    const previousOwned = new Set(previousSave.ownedAnimals.filter((animal) => playableAnimals.has(animal)));
    previousOwned.add("bunny");
    const additions = finalOwnedAnimals.filter((animal) => !previousOwned.has(animal));
    finalOwnedAnimals = Array.from(new Set([...previousOwned, ...additions.slice(0, maxSaveJump.animals)]));
  }

  const selectedAnimal = playableAnimals.has(data.selectedAnimal) && finalOwnedAnimals.includes(data.selectedAnimal)
    ? data.selectedAnimal
    : "bunny";

  const coins = clampNumber(data.coins, 0, 999999, 0);
  const gems = clampNumber(data.gems, 0, 99999, 0);
  const playerLevel = clampNumber(data.playerLevel, 1, 99, 1);

  return {
    nickname: String(data.nickname || "배구왕토끼").trim().slice(0, 10) || "배구왕토끼",
    selectedStage: stages.has(data.selectedStage) ? data.selectedStage : "beach",
    selectedAnimal,
    coins: boundedIncrease(coins, previousSave, "coins", maxSaveJump.coins),
    gems: boundedIncrease(gems, previousSave, "gems", maxSaveJump.gems),
    playerLevel: boundedIncrease(playerLevel, previousSave, "playerLevel", maxSaveJump.level),
    playerXp: clampNumber(data.playerXp, 0, 99, 0),
    mailClaimed: Boolean(data.mailClaimed),
    ownedAnimals: finalOwnedAnimals,
    touchControlsVisible: data.touchControlsVisible !== false,
    secretHash: previousSave?.secretHash || hashSecret(secret),
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
  if (!rateLimit(req, res)) return;
  if (!validOrigin(req)) return sendJson(res, 403, { error: "forbidden" });

  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  } catch {
    res.writeHead(400, securityHeaders());
    res.end("Bad request");
    return;
  }

  if (url.pathname === "/api/save" && req.method === "GET") {
    const playerId = playerIdFrom(req);
    const playerSecret = playerSecretFrom(req);
    if (!playerId) return sendJson(res, 400, { error: "invalid player id" });
    if (!playerSecret) return sendJson(res, 401, { error: "unauthorized" });
    const saves = loadSaves();
    if (!canAccessSave(saves[playerId], playerSecret)) return sendJson(res, 403, { error: "forbidden" });
    const save = saves[playerId] ? { ...saves[playerId] } : null;
    if (save) delete save.secretHash;
    return sendJson(res, 200, { save });
  }

  if (url.pathname === "/api/save" && req.method === "POST") {
    return readJson(req, (error, data) => {
      if (error) return sendJson(res, 400, { error: "invalid json" });
      const playerId = playerIdFrom(req, data);
      const playerSecret = playerSecretFrom(req, data);
      if (!playerId) return sendJson(res, 400, { error: "invalid player id" });
      if (!playerSecret) return sendJson(res, 401, { error: "unauthorized" });
      const saves = loadSaves();
      if (!canAccessSave(saves[playerId], playerSecret)) return sendJson(res, 403, { error: "forbidden" });
      saves[playerId] = sanitizeSave(data, saves[playerId], playerSecret);
      writeSaves(saves);
      const save = { ...saves[playerId] };
      delete save.secretHash;
      return sendJson(res, 200, { ok: true, save });
    });
  }

  if (url.pathname === "/api/player-id" && req.method === "POST") {
    return sendJson(res, 200, {
      playerId: crypto.randomBytes(16).toString("hex"),
      playerSecret: crypto.randomBytes(32).toString("hex")
    });
  }

  if (url.pathname.startsWith("/api/")) {
    return sendJson(res, 404, { error: "not found" });
  }

  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, securityHeaders({ Allow: "GET, HEAD" }));
    res.end("Method not allowed");
    return;
  }

  let name;
  try {
    name = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
  } catch {
    res.writeHead(400, securityHeaders());
    res.end("Bad request");
    return;
  }
  const filePath = path.resolve(root, name);

  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    res.writeHead(403, securityHeaders());
    res.end("Forbidden");
    return;
  }

  const blockedDirs = [dataDir, path.join(root, ".git"), path.join(root, ".agents"), path.join(root, ".codex")];
  if (blockedDirs.some((dir) => filePath === dir || filePath.startsWith(dir + path.sep))) {
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

server.listen(port, host, () => {
  const shownHost = host === "0.0.0.0" ? "127.0.0.1" : host;
  console.log(`http://${shownHost}:${port}/`);
});
