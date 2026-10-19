const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");

// Exercise the game's actual account/save orchestration without network writes.
const source = fs.readFileSync("game.js", "utf8");
const saveFunctions = source.slice(source.indexOf("function cacheSave("), source.indexOf("function playerShotIntent("));

function harness() {
  const storage = new Map();
  const writes = [];
  let progress = { coins: 0 };
  const context = vm.createContext({
    auth: { currentUser: null },
    cloudReadyUid: null, accountRevision: 0, accountLoading: false, authBusy: false,
    saveQueue: Promise.resolve(), defaultAnimal: "bunny", pendingResult: null,
    stageEl: { inert: false }, loginMessageEl: { textContent: "" },
    localStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    localSaveKey: () => context.auth.currentUser ? `save:${context.auth.currentUser.uid}` : "guest",
    currentSaveData: () => ({ ...progress }),
    applySaveData: (data) => { progress = { ...data }; },
    syncLoadedState() {}, syncAuthUi() {}, showMenu() {}, closeRewardModal() {},
    readCloudSave: async () => null,
    writeCloudSave: async (uid, data) => { writes.push({ uid, data }); },
    firebaseErrorMessage: () => "connection failed", console: { warn() {} }
  });
  vm.runInContext(saveFunctions, context);
  return { context, storage, writes, progress: () => progress, setCoins: (coins) => { progress.coins = coins; } };
}

test("guest saves remain local", async () => {
  const h = harness();
  h.setCoins(2000);
  h.context.saveGame();
  await h.context.saveQueue;
  assert.equal(JSON.parse(h.storage.get("guest")).coins, 2000);
  assert.equal(h.writes.length, 0);
});

test("existing cloud progress is loaded before any write", async () => {
  const h = harness();
  const user = { uid: "a", email: "a@example.com" };
  h.context.auth.currentUser = user;
  h.storage.set("save:a", JSON.stringify({ coins: 10 }));
  h.context.readCloudSave = async () => ({ coins: 300 });
  await h.context.loadServerGame(user);
  assert.equal(h.progress().coins, 300);
  assert.equal(h.writes.length, 0);
  assert.equal(h.context.cloudReadyUid, "a");
  assert.equal(h.context.stageEl.inert, false);
});

test("failed cloud read never allows overwriting an unread save", async () => {
  const h = harness();
  const user = { uid: "a", email: "a@example.com" };
  h.context.auth.currentUser = user;
  h.storage.set("save:a", JSON.stringify({ coins: 50 }));
  h.context.readCloudSave = async () => { throw Error("offline"); };
  await h.context.loadServerGame(user);
  h.setCoins(100);
  h.context.saveGame();
  await h.context.saveQueue;
  assert.equal(h.writes.length, 0);
  assert.equal(JSON.parse(h.storage.get("save:a")).coins, 100);
  assert.equal(h.context.cloudReadyUid, null);
});

test("missing cloud document is seeded and writes preserve order", async () => {
  const h = harness();
  const user = { uid: "a", email: "a@example.com" };
  h.context.auth.currentUser = user;
  await h.context.loadServerGame(user);
  h.setCoins(10);
  h.context.saveGame();
  h.setCoins(20);
  h.context.saveGame();
  await h.context.saveQueue;
  assert.deepEqual(h.writes.map((write) => write.data.coins), [0, 10, 20]);
  assert.ok(h.writes.every((write) => write.uid === "a"));
});

test("late load and queued writes cannot cross account boundaries", async () => {
  const h = harness();
  const user = { uid: "a", email: "a@example.com" };
  h.context.auth.currentUser = user;
  let finishRead;
  h.context.readCloudSave = () => new Promise((resolve) => { finishRead = resolve; });
  const loading = h.context.loadServerGame(user);
  h.context.auth.currentUser = null;
  h.storage.set("guest", JSON.stringify({ coins: 42 }));
  await h.context.loadServerGame(null);
  finishRead({ coins: 999 });
  await loading;
  assert.equal(h.progress().coins, 42);
  h.context.auth.currentUser = user;
  h.context.cloudReadyUid = "a";
  h.context.saveGame();
  h.context.auth.currentUser = { uid: "b" };
  await h.context.saveQueue;
  assert.equal(h.writes.length, 0);
});
