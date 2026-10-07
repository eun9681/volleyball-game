const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname);
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || (process.env.PORT ? "0.0.0.0" : "127.0.0.1");
const dataDir = path.join(root, "server-data");
const savePath = path.join(dataDir, "saves.json");
const usersPath = path.join(dataDir, "users.json");
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
const sessions = new Map();
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

function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(usersPath, "utf8"));
  } catch {
    return {};
  }
}

function writeUsers(users) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
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

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
  return { salt, hash };
}

function validPassword(password, user) {
  if (!user?.salt || !user?.passwordHash) return false;
  const { hash } = hashPassword(password, user.salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(user.passwordHash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function cleanUsername(value) {
  const username = String(value || "").trim().slice(0, 16);
  return /^[A-Za-z0-9_가-힣]{2,16}$/u.test(username) ? username : "";
}

function validPasswordText(value) {
  const password = String(value || "");
  return password.length >= 4 && password.length <= 64 ? password : "";
}

function authUserFrom(req) {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  return session;
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username
  };
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

function saveKeyFor(req, data = {}) {
  const session = authUserFrom(req);
  if (session) return { key: `account:${session.userId}`, session };
  const playerId = playerIdFrom(req, data);
  const playerSecret = playerSecretFrom(req, data);
  return { key: playerId, playerSecret };
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

  if (url.pathname === "/api/auth/register" && req.method === "POST") {
    return readJson(req, (error, data) => {
      if (error) return sendJson(res, 400, { error: "invalid json" });
      const username = cleanUsername(data.username);
      const password = validPasswordText(data.password);
      if (!username || !password) return sendJson(res, 400, { error: "invalid credentials" });
      const users = loadUsers();
      const normalized = username.toLowerCase();
      if (users[normalized]) return sendJson(res, 409, { error: "user exists" });
      const { salt, hash } = hashPassword(password);
      const user = {
        id: crypto.randomBytes(16).toString("hex"),
        username,
        salt,
        passwordHash: hash,
        createdAt: new Date().toISOString()
      };
      users[normalized] = user;
      writeUsers(users);
      const token = crypto.randomBytes(32).toString("hex");
      sessions.set(token, { userId: user.id, username: user.username, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });
      return sendJson(res, 201, { token, user: publicUser(user) });
    });
  }

  if (url.pathname === "/api/auth/login" && req.method === "POST") {
    return readJson(req, (error, data) => {
      if (error) return sendJson(res, 400, { error: "invalid json" });
      const username = cleanUsername(data.username);
      const password = validPasswordText(data.password);
      const users = loadUsers();
      const user = users[username.toLowerCase()];
      if (!username || !password || !validPassword(password, user)) {
        return sendJson(res, 401, { error: "login failed" });
      }
      const token = crypto.randomBytes(32).toString("hex");
      sessions.set(token, { userId: user.id, username: user.username, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });
      return sendJson(res, 200, { token, user: publicUser(user) });
    });
  }

  if (url.pathname === "/api/auth/me" && req.method === "GET") {
    const session = authUserFrom(req);
    if (!session) return sendJson(res, 401, { error: "unauthorized" });
    return sendJson(res, 200, { user: { id: session.userId, username: session.username } });
  }

  if (url.pathname === "/api/auth/logout" && req.method === "POST") {
    const header = String(req.headers.authorization || "");
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (token) sessions.delete(token);
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname === "/api/save" && req.method === "GET") {
    const auth = saveKeyFor(req);
    if (!auth.key) return sendJson(res, 400, { error: "invalid player id" });
    if (!auth.session && !auth.playerSecret) return sendJson(res, 401, { error: "unauthorized" });
    const saves = loadSaves();
    if (!auth.session && !canAccessSave(saves[auth.key], auth.playerSecret)) return sendJson(res, 403, { error: "forbidden" });
    const save = saves[auth.key] ? { ...saves[auth.key] } : null;
    if (save) delete save.secretHash;
    return sendJson(res, 200, { save });
  }

  if (url.pathname === "/api/save" && req.method === "POST") {
    return readJson(req, (error, data) => {
      if (error) return sendJson(res, 400, { error: "invalid json" });
      const auth = saveKeyFor(req, data);
      if (!auth.key) return sendJson(res, 400, { error: "invalid player id" });
      if (!auth.session && !auth.playerSecret) return sendJson(res, 401, { error: "unauthorized" });
      const saves = loadSaves();
      if (!auth.session && !canAccessSave(saves[auth.key], auth.playerSecret)) return sendJson(res, 403, { error: "forbidden" });
      const secret = auth.session ? crypto.createHash("sha256").update(auth.key).digest("hex") : auth.playerSecret;
      saves[auth.key] = sanitizeSave(data, saves[auth.key], secret);
      writeSaves(saves);
      const save = { ...saves[auth.key] };
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
