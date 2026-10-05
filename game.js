const stageEl = document.querySelector("#stage");
const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const playerScoreEl = document.querySelector("#playerScore");
const aiScoreEl = document.querySelector("#aiScore");
const statusEl = document.querySelector("#status");
const scoreToastEl = document.querySelector("#scoreToast");
const restartBtn = document.querySelector("#restartBtn");
const menuBtn = document.querySelector("#menuBtn");
const startBtn = document.querySelector("#startBtn");
const playerTeamEl = document.querySelector("#playerTeam");
const coinAmountEl = document.querySelector("#coinAmount");
const gemAmountEl = document.querySelector("#gemAmount");
const mailBtn = document.querySelector("#mailBtn");
const mailNoticeEl = document.querySelector("#mailNotice");
const mailModal = document.querySelector("#mailModal");
const mailCloseBtn = document.querySelector("#mailCloseBtn");
const claimMailBtn = document.querySelector("#claimMailBtn");
const settingsBtn = document.querySelector("#settingsBtn");
const settingsModal = document.querySelector("#settingsModal");
const settingsCloseBtn = document.querySelector("#settingsCloseBtn");
const rewardModal = document.querySelector("#rewardModal");
const rewardIconEl = document.querySelector("#rewardIcon");
const rewardTitleEl = document.querySelector("#rewardTitle");
const rewardMessageEl = document.querySelector("#rewardMessage");
const rewardCoinsEl = document.querySelector("#rewardCoins");
const rewardGemsEl = document.querySelector("#rewardGems");
const rewardCloseBtn = document.querySelector("#rewardCloseBtn");
const rewardNextBtn = document.querySelector("#rewardNextBtn");
const touchToggleEl = document.querySelector("#touchToggle");
const nicknameInputEl = document.querySelector("#nicknameInput");
const saveNicknameBtn = document.querySelector("#saveNicknameBtn");
const fullscreenBtn = document.querySelector("#fullscreenBtn");
const settingsRestartBtn = document.querySelector("#settingsRestartBtn");
const featuredStageImageEl = document.querySelector("#featuredStageImage");
const featuredStageNoEl = document.querySelector("#featuredStageNo");
const featuredStageNameEl = document.querySelector("#featuredStageName");
const featuredStageDescEl = document.querySelector("#featuredStageDesc");
const characterGridEl = document.querySelector("#characterGrid");
const drawCharacterBtn = document.querySelector("#drawCharacterBtn");
const gachaResultImageEl = document.querySelector("#gachaResultImage");
const gachaResultNameEl = document.querySelector("#gachaResultName");
const gachaResultTextEl = document.querySelector("#gachaResultText");
const profileAvatarEl = document.querySelector("#profileAvatar");
const profileNicknameEl = document.querySelector("#profileNickname");
const profileLevelEl = document.querySelector("#profileLevel");
const profileXpFillEl = document.querySelector("#profileXpFill");

const leftBtn = document.querySelector("#leftBtn");
const rightBtn = document.querySelector("#rightBtn");
const serveBtn = document.querySelector("#serveBtn");
const bumpBtn = document.querySelector("#bumpBtn");
const jumpBtn = document.querySelector("#jumpBtn");

const W = canvas.width;
const H = canvas.height;
const floor = 488;
const net = { x: W / 2 - 8, y: 334, w: 16, h: floor - 334 };
const inputs = new Set();
const heldButtons = new Set();
const stageImages = {};
const characterImages = {};
const drawCost = 500;
const saveKey = "animal-volley-save-v1";
const playerIdKey = "animal-volley-player-id";
const playerSecretKey = "animal-volley-player-secret";
const playerIdPattern = /^[a-f0-9]{32}$/;
const playerSecretPattern = /^[a-f0-9]{64}$/;

const characterStats = {
  bunny: { label: "토끼고", name: "토끼", trait: "높은 점프", jump: 1.08, speed: 1.0, power: 1.0, src: "assets/토끼.png", playable: true },
  cat: { label: "고양이고", name: "고양이", trait: "빠른 발", jump: 1.0, speed: 1.16, power: 0.96, src: "assets/고양이.png", playable: true },
  bear: { label: "곰고", name: "곰", trait: "강한 스파이크", jump: 0.95, speed: 0.92, power: 1.2, src: "assets/곰.png", playable: true },
  frog: { label: "개구리고", name: "개구리", trait: "가벼운 서브", jump: 1.18, speed: 0.96, power: 0.98, src: "assets/개구리.png", playable: true },
  sheep: { label: "양고", name: "양", trait: "부드러운 리시브", jump: 1.02, speed: 0.98, power: 1.02, src: "assets/양.png", playable: true },
  penguin: { label: "펭귄고", name: "펭귄", trait: "안정적인 수비", jump: 0.98, speed: 1.04, power: 1.0, src: "assets/펭귄.png", playable: true },
  chick: { label: "병아리고", name: "병아리", trait: "빠른 서브", jump: 1.04, speed: 1.08, power: 0.94, src: "assets/병아리.png", playable: true },
  lion: { label: "사자고", name: "사자", trait: "묵직한 공격", jump: 0.96, speed: 0.95, power: 1.24, src: "assets/사자.png", playable: true },
  turtle: { label: "거북이고", name: "거북이", trait: "튼튼한 방어", jump: 0.92, speed: 0.88, power: 1.12, src: "assets/거북이.png", playable: true },
  rhino: { label: "코뿔소고", name: "코뿔소", trait: "강한 밀어치기", jump: 0.94, speed: 0.9, power: 1.28, src: "assets/코뿔소.png", playable: true },
  parrot: { label: "앵무새중", name: "앵무새", trait: "날카로운 코스", jump: 1.08, speed: 1.08, power: 1.08, src: "assets/앵무새.png", playable: true },
  monkey: { label: "원숭이중", name: "원숭이", trait: "상대 전용", jump: 1.0, speed: 1.0, power: 1.0, src: "assets/원숭이.png", playable: false }
};

const defaultAnimal = "bunny";
const playableAnimals = Object.keys(characterStats).filter((key) => characterStats[key].playable);

const stages = {
  beach: {
    index: 1,
    name: "바닷가 코트",
    desc: "시원한 바다 앞 첫 경기.",
    image: "assets/stage-1.jpg",
    opponent: "monkey",
    aiLevel: 0.55,
    gravity: 0.27,
    tint: "rgba(255, 230, 160, 0.04)"
  },
  sunset: {
    index: 2,
    name: "노을 숲 코트",
    desc: "따뜻한 저녁 랠리.",
    image: "assets/stage-2.jpg",
    opponent: "rhino",
    aiLevel: 0.8,
    gravity: 0.285,
    tint: "rgba(255, 116, 43, 0.1)"
  },
  blossom: {
    index: 3,
    name: "벚꽃 공원",
    desc: "꽃잎이 흩날리는 코트.",
    image: "assets/stage-3.jpg",
    opponent: "lion",
    aiLevel: 1.08,
    gravity: 0.265,
    tint: "rgba(255, 196, 216, 0.08)"
  },
  moon: {
    index: 4,
    name: "달빛 숲",
    desc: "조용한 밤의 경기.",
    image: "assets/stage-4.jpg",
    opponent: "bear",
    aiLevel: 1.38,
    gravity: 0.3,
    tint: "rgba(41, 56, 104, 0.12)"
  },
  autumn: {
    index: 5,
    name: "가을 코트",
    desc: "낙엽과 함께 서브.",
    image: "assets/stage-5.jpg",
    opponent: "penguin",
    aiLevel: 1.72,
    gravity: 0.29,
    tint: "rgba(255, 156, 54, 0.08)"
  },
  forest: {
    index: 6,
    name: "숲속 배구장",
    desc: "기본기를 익히기 좋은 곳.",
    image: "assets/stage-6.jpg",
    opponent: "parrot",
    aiLevel: 2.08,
    gravity: 0.28,
    tint: "rgba(129, 199, 132, 0.06)"
  }
};

Object.entries(stages).forEach(([key, stage]) => {
  const image = new Image();
  image.src = stage.image;
  stageImages[key] = image;
});

Object.entries(characterStats).forEach(([key, character]) => {
  const image = new Image();
  image.src = character.src;
  characterImages[key] = image;
});

let selectedStage = "beach";
let selectedAnimal = defaultAnimal;
let gameMode = "menu";
let player;
let ai;
let ball;
let score;
let rallyOver;
let winner;
let waitingServe;
let serverSide;
let servePower;
let aiServeAt;
let difficulty = 1;
let coins = 0;
let gems = 0;
let playerLevel = 1;
let playerXp = 0;
let mailClaimed = false;
let pendingResult = null;
const ownedAnimals = new Set([defaultAnimal]);

function currentSaveData() {
  return {
    nickname: profileNicknameEl.textContent.trim(),
    selectedStage,
    selectedAnimal,
    coins,
    gems,
    playerLevel,
    playerXp,
    mailClaimed,
    ownedAnimals: Array.from(ownedAnimals),
    touchControlsVisible: !stageEl.classList.contains("hide-touch-controls")
  };
}

function getPlayerId() {
  let playerId = localStorage.getItem(playerIdKey);
  if (!playerIdPattern.test(playerId || "")) {
    const bytes = new Uint8Array(16);
    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256);
      }
    }
    playerId = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(playerIdKey, playerId);
  }
  return playerId;
}

function randomHex(byteLength) {
  const bytes = new Uint8Array(byteLength);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getPlayerSecret() {
  let playerSecret = localStorage.getItem(playerSecretKey);
  if (!playerSecretPattern.test(playerSecret || "")) {
    playerSecret = randomHex(32);
    localStorage.setItem(playerSecretKey, playerSecret);
  }
  return playerSecret;
}

function applySaveData(data) {
  if (!data || typeof data !== "object") return;
  coins = Math.max(0, Number(data.coins) || 0);
  gems = Math.max(0, Number(data.gems) || 0);
  playerLevel = Math.max(1, Number(data.playerLevel) || 1);
  playerXp = clamp(Number(data.playerXp) || 0, 0, 99);
  mailClaimed = Boolean(data.mailClaimed);
  if (stages[data.selectedStage]) selectedStage = data.selectedStage;
  ownedAnimals.clear();
  ownedAnimals.add(defaultAnimal);
  if (Array.isArray(data.ownedAnimals)) {
    data.ownedAnimals.forEach((animal) => {
      if (characterStats[animal]?.playable) ownedAnimals.add(animal);
    });
  }
  selectedAnimal = normalizePlayableAnimal(data.selectedAnimal || selectedAnimal);
  if (typeof data.nickname === "string" && data.nickname.trim()) {
    profileNicknameEl.textContent = data.nickname.trim().slice(0, 10);
  }
  stageEl.classList.toggle("hide-touch-controls", data.touchControlsVisible === false);
}

function syncLoadedState() {
  selectStage(selectedStage, false);
  resetMatch();
  syncPlayerName();
  syncWallet();
  syncProfileProgress();
  syncSettingsPanel();
  updateGachaResult(selectedAnimal, "선택 캐릭터");
  updateProfileAvatar(selectedAnimal);
  renderCharacterGrid();
}

function saveGame() {
  const data = currentSaveData();
  try {
    localStorage.setItem(saveKey, JSON.stringify(data));
  } catch (error) {
    console.warn("save failed", error);
  }
  fetch("/api/save", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Player-Id": getPlayerId(),
      "X-Player-Secret": getPlayerSecret()
    },
    body: JSON.stringify({ ...data, playerSecret: getPlayerSecret() })
  }).catch(() => {});
}

function loadGame() {
  try {
    const raw = localStorage.getItem(saveKey);
    if (raw) applySaveData(JSON.parse(raw));
  } catch (error) {
    console.warn("load failed", error);
  }
}

function loadServerGame() {
  fetch("/api/save", {
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "X-Player-Id": getPlayerId(),
      "X-Player-Secret": getPlayerSecret()
    }
  })
    .then((response) => response.ok ? response.json() : null)
    .then((data) => {
      if (!data?.save) return;
      applySaveData(data.save);
      localStorage.setItem(saveKey, JSON.stringify(currentSaveData()));
      syncLoadedState();
    })
    .catch(() => {});
}

function playerShotIntent() {
  return {
    left: active("left"),
    right: active("right"),
    up: active("jump"),
    down: active("down")
  };
}

function normalizePlayableAnimal(animal) {
  return ownedAnimals.has(animal) && characterStats[animal]?.playable ? animal : defaultAnimal;
}

function currentStage() {
  return stages[selectedStage] || stages.beach;
}

function stageKeys() {
  return Object.keys(stages);
}

function nextStageKey() {
  const keys = stageKeys();
  const index = keys.indexOf(selectedStage);
  return keys[Math.min(index + 1, keys.length - 1)] || selectedStage;
}

function selectStage(stageKey, shouldSave = true) {
  selectedStage = stageKey;
  document.querySelectorAll("[data-stage]").forEach((item) => {
    item.classList.toggle("selected", item.dataset.stage === selectedStage);
  });
  updateStagePreview();
  if (shouldSave) saveGame();
}

function currentOpponentAnimal() {
  return currentStage().opponent || "monkey";
}

function currentOpponentStats() {
  return characterStats[currentOpponentAnimal()] || characterStats.monkey;
}

function currentAiDifficulty() {
  return difficulty * (currentStage().aiLevel || 1);
}

function currentPlayerNickname() {
  return profileNicknameEl.textContent.trim() || "배구왕토끼";
}

function syncPlayerName() {
  playerTeamEl.textContent = currentPlayerNickname();
}

function resetMatch() {
  selectedAnimal = normalizePlayableAnimal(selectedAnimal);
  score = { player: 0, ai: 0 };
  serverSide = "player";
  winner = null;
  syncPlayerName();
  resetRally("서브 버튼으로 시작");
}

function resetRally(message) {
  selectedAnimal = normalizePlayableAnimal(selectedAnimal);
  player = makePlayer(165, selectedAnimal, true);
  ai = makePlayer(882, currentOpponentAnimal(), false);
  ball = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    r: 12,
    spin: 0
  };
  rallyOver = false;
  waitingServe = true;
  servePower = 0;
  holdServeBall();
  aiServeAt = serverSide === "ai" ? performance.now() + 850 : 0;
  statusEl.textContent = winner ? `${winner} 승리! 다시 시작하세요` : message;
  syncScore();
}

function makePlayer(x, animal, human) {
  return {
    x,
    y: floor,
    vx: 0,
    vy: 0,
    r: 28,
    animal,
    human,
    facing: human ? 1 : -1,
    onGround: true,
    swing: 0,
    hitCooldown: 0,
    aiTargetX: x,
    name: characterStats[animal]?.name || characterStats.bunny.name
  };
}

function syncWallet() {
  coinAmountEl.textContent = coins.toLocaleString("en-US");
  gemAmountEl.textContent = gems.toLocaleString("en-US");
  mailNoticeEl.style.display = mailClaimed ? "none" : "block";
  claimMailBtn.disabled = mailClaimed;
  claimMailBtn.textContent = mailClaimed ? "보상 수령 완료" : "보상 받기";
  drawCharacterBtn.disabled = coins < drawCost;
  drawCharacterBtn.textContent = coins < drawCost ? `골드 부족 (${drawCost}골드)` : `캐릭터 뽑기 ${drawCost}골드`;
}

function syncSettingsPanel() {
  touchToggleEl.checked = !stageEl.classList.contains("hide-touch-controls");
  nicknameInputEl.value = profileNicknameEl.textContent.trim();
}

function openSettings() {
  syncSettingsPanel();
  settingsModal.classList.add("open");
  settingsModal.setAttribute("aria-hidden", "false");
}

function closeSettings() {
  settingsModal.classList.remove("open");
  settingsModal.setAttribute("aria-hidden", "true");
}

function setTouchControlsVisible(visible) {
  stageEl.classList.toggle("hide-touch-controls", !visible);
  touchToggleEl.checked = visible;
  statusEl.textContent = visible ? "터치 버튼 표시" : "터치 버튼 숨김";
  saveGame();
}

function saveNickname() {
  const nickname = nicknameInputEl.value.trim().slice(0, 10) || "배구왕토끼";
  profileNicknameEl.textContent = nickname;
  nicknameInputEl.value = nickname;
  syncPlayerName();
  statusEl.textContent = "닉네임 저장 완료";
  saveGame();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    stageEl.requestFullscreen?.();
    statusEl.textContent = "전체화면 전환";
  } else {
    document.exitFullscreen?.();
    statusEl.textContent = "전체화면 종료";
  }
}

function updateProfileAvatar(animal) {
  const character = characterStats[animal];
  if (!character) return;
  profileAvatarEl.src = character.src;
  profileAvatarEl.alt = character.name;
}

function updateGachaResult(animal, message) {
  const character = characterStats[animal];
  if (!character) return;
  gachaResultImageEl.src = character.src;
  gachaResultImageEl.alt = character.name;
  gachaResultNameEl.textContent = character.name;
  gachaResultTextEl.textContent = message || character.trait;
  document.querySelector("#characterName").textContent = character.name;
}

function renderCharacterGrid() {
  characterGridEl.innerHTML = "";
  playableAnimals.forEach((animal) => {
    const character = characterStats[animal];
    const owned = ownedAnimals.has(animal);
    const button = document.createElement("button");
    button.className = `character-card${selectedAnimal === animal ? " selected" : ""}${owned ? "" : " locked"}`;
    button.type = "button";
    button.dataset.animal = animal;
    button.innerHTML = `
      <img class="portrait" src="${character.src}" alt="${character.name}">
      <strong>${character.name}</strong>
      <small>${owned ? character.trait : "미보유"}</small>
    `;
    button.addEventListener("click", () => {
      if (!ownedAnimals.has(animal)) {
        statusEl.textContent = "뽑기로 먼저 획득하세요";
        return;
      }
      selectedAnimal = animal;
      syncPlayerName();
      updateGachaResult(animal, "선택 완료");
      updateProfileAvatar(animal);
      renderCharacterGrid();
      saveGame();
      if (gameMode === "playing") resetMatch();
    });
    characterGridEl.appendChild(button);
  });
}

function drawCharacter() {
  if (coins < drawCost) {
    statusEl.textContent = "골드가 부족합니다";
    syncWallet();
    return;
  }

  coins -= drawCost;
  const missingAnimals = playableAnimals.filter((animal) => !ownedAnimals.has(animal));
  const pool = missingAnimals.length ? missingAnimals : playableAnimals;
  const pickedAnimal = pool[Math.floor(Math.random() * pool.length)];
  const isNew = !ownedAnimals.has(pickedAnimal);
  ownedAnimals.add(pickedAnimal);
  selectedAnimal = pickedAnimal;
  syncPlayerName();
  updateGachaResult(pickedAnimal, isNew ? "새 친구 획득!" : "이미 보유한 친구예요");
  updateProfileAvatar(pickedAnimal);
  statusEl.textContent = `${characterStats[pickedAnimal].name} 획득!`;
  syncWallet();
  renderCharacterGrid();
  saveGame();
  if (gameMode === "playing") resetMatch();
}

function holdServeBall() {
  const server = serverSide === "player" ? player : ai;
  ball.x = server.x + server.facing * 42;
  ball.y = server.y - 126 - Math.sin(Date.now() / 160) * 7;
  ball.vx = 0;
  ball.vy = 0;
}

function startServe() {
  if (gameMode !== "playing" || winner || rallyOver || !waitingServe) return;
  const server = serverSide === "player" ? player : ai;
  const stats = server.human ? characterStats[selectedAnimal] : currentOpponentStats();
  const intent = server.human ? playerShotIntent() : { left: false, right: false, up: false, down: false };
  const dir = server.human ? 1 : -1;
  const forward = server.human
    ? ((intent.right ? 1 : 0) - (intent.left ? 1 : 0))
    : 0;
  const serveArc = intent.down ? -5.2 : intent.up ? -10.4 : -8.4;
  waitingServe = false;
  aiServeAt = 0;
  ball.x = server.x + dir * 46;
  ball.y = server.y - 132;
  ball.vx = dir * (4.8 + servePower * 0.7 + Math.max(0, forward) * 1.2) * stats.power;
  ball.vy = serveArc - servePower * (intent.down ? 0.18 : 0.45);
  ball.spin = dir * 0.8;
  servePower = 0;
  server.swing = 18;
  statusEl.textContent = "랠리 중";
}

function hitBall() {
  if (waitingServe) {
    if (serverSide === "player") startServe();
    return;
  }
  if (gameMode !== "playing" || winner || rallyOver) return;
  player.swing = 18;
}

function syncScore() {
  playerScoreEl.textContent = score.player;
  aiScoreEl.textContent = score.ai;
}

function syncProfileProgress() {
  profileLevelEl.textContent = `Lv.${playerLevel}`;
  profileXpFillEl.style.width = `${clamp(playerXp, 0, 100)}%`;
}

function addExperience(amount) {
  playerXp += amount;
  if (playerXp >= 100) {
    playerLevel += 1;
    playerXp = 0;
  }
  syncProfileProgress();
}

function popScore(side) {
  const target = side === "player" ? playerScoreEl : aiScoreEl;
  target.classList.remove("score-pop");
  void target.offsetWidth;
  target.classList.add("score-pop");
}

function showScoreToast(side) {
  scoreToastEl.textContent = side === "player" ? "+1 우리 팀" : "+1 상대";
  scoreToastEl.classList.remove("show");
  void scoreToastEl.offsetWidth;
  scoreToastEl.classList.add("show");
}

function matchReward() {
  const stage = currentStage();
  return {
    coins: 120 + stage.index * 80,
    gems: stage.index >= 4 ? 2 : 1,
    xp: 18 + stage.index * 7
  };
}

function showRewardModal(result, reward = null) {
  const won = result === "win";
  pendingResult = {
    result,
    reward,
    claimed: false,
    stage: selectedStage
  };
  rewardIconEl.textContent = won ? "WIN" : "LOSE";
  rewardTitleEl.textContent = won ? "WIN" : "LOSE";
  rewardMessageEl.textContent = won
    ? `${currentPlayerNickname()} 승리! ${currentStage().name} 보상`
    : "아쉬워요. 다시 도전해요!";
  rewardCoinsEl.parentElement.classList.toggle("is-hidden", !won);
  rewardCoinsEl.textContent = reward ? `${reward.coins.toLocaleString("en-US")} 골드` : "0 골드";
  rewardGemsEl.textContent = reward ? `${reward.gems.toLocaleString("en-US")} 보석 · 경험치 +${reward.xp}` : "0 보석";
  rewardCloseBtn.textContent = won ? "보상 수령" : "다시 도전";
  rewardCloseBtn.disabled = false;
  rewardNextBtn.classList.toggle("is-hidden", !won);
  rewardNextBtn.parentElement.classList.toggle("single", !won);
  rewardNextBtn.textContent = nextStageKey() === selectedStage ? "메인으로 가기" : "다음 스테이지 가기";
  rewardModal.classList.add("open");
  rewardModal.setAttribute("aria-hidden", "false");
}

function closeRewardModal() {
  rewardModal.classList.remove("open");
  rewardModal.setAttribute("aria-hidden", "true");
  pendingResult = null;
}

function claimResultReward() {
  if (!pendingResult?.reward || pendingResult.claimed) return;
  coins += pendingResult.reward.coins;
  gems += pendingResult.reward.gems;
  addExperience(pendingResult.reward.xp);
  pendingResult.claimed = true;
  syncWallet();
  saveGame();
  rewardCloseBtn.textContent = "수령 완료";
  rewardCloseBtn.disabled = true;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function active(name) {
  return inputs.has(name) || heldButtons.has(name);
}

function normalizeInput(event) {
  const code = event.code || "";
  const key = (event.key || "").toLowerCase();
  if (code === "ArrowLeft" || code === "KeyA" || key === "arrowleft" || key === "a") return "left";
  if (code === "ArrowRight" || code === "KeyD" || key === "arrowright" || key === "d") return "right";
  if (code === "ArrowUp" || code === "KeyW" || key === "arrowup" || key === "w") return "jump";
  if (code === "ArrowDown" || code === "KeyS" || key === "arrowdown" || key === "s") return "down";
  if (code === "Space" || code === "Enter" || code === "KeyZ" || key === " " || key === "enter" || key === "z") return "hit";
  if (code === "Escape") return "menu";
  return "";
}

function updatePlayer(p) {
  const stats = p.human ? characterStats[selectedAnimal] : currentOpponentStats();
  if (p.human) {
    const left = active("left");
    const right = active("right");
    const crouch = active("down") && p.onGround;
    p.vx = (right - left) * (crouch ? 3.4 : 5.35) * stats.speed;
    if (active("jump") && p.onGround) {
      p.vy = -13.1 * stats.jump;
      p.onGround = false;
    }
    if (active("down") && !p.onGround) {
      p.vy += 0.34;
    }
  } else {
    const aiLevel = currentAiDifficulty();
    const safeSpot = W - 180;
    const prediction = ball.x + ball.vx * (7 + aiLevel * 4.5);
    const desiredTarget = ball.x > W / 2 ? clamp(prediction, W / 2 + 72, W - 72) : safeSpot;
    const follow = 0.035 + aiLevel * 0.026;
    p.aiTargetX += (desiredTarget - p.aiTargetX) * follow;
    const distance = p.aiTargetX - p.x;
    const deadZone = Math.max(7, 20 - aiLevel * 5);
    const wantedVx = Math.abs(distance) < deadZone
      ? 0
      : clamp(distance / 42, -1, 1) * (2.6 + aiLevel * 2.25) * stats.speed;
    p.vx += (wantedVx - p.vx) * 0.22;
    const near = Math.abs(ball.x - p.x) < 72 + aiLevel * 18 && ball.y < p.y && ball.y > 230 - aiLevel * 18;
    if (near && p.onGround && !waitingServe) {
      p.vy = -(10.7 + aiLevel * 1.4) * stats.jump;
      p.onGround = false;
      p.swing = 14;
    }
  }

  p.x += p.vx;
  p.y += p.vy;
  p.vy += 0.62;
  if (p.y >= floor) {
    p.y = floor;
    p.vy = 0;
    p.onGround = true;
  }
  const sideMin = p.human ? 56 : W / 2 + 70;
  const sideMax = p.human ? W / 2 - 70 : W - 56;
  p.x = clamp(p.x, sideMin, sideMax);
  if (p.swing > 0) p.swing -= 1;
  if (p.hitCooldown > 0) p.hitCooldown -= 1;
}

function updateBall() {
  const stage = stages[selectedStage];
  ball.vy += stage.gravity;
  ball.vx *= 0.998;
  ball.x += ball.vx;
  ball.y += ball.vy;
  ball.spin += ball.vx * 0.045;

  if (ball.x - ball.r < 22) {
    ball.x = 22 + ball.r;
    ball.vx = Math.abs(ball.vx) * 0.86;
  }
  if (ball.x + ball.r > W - 22) {
    ball.x = W - 22 - ball.r;
    ball.vx = -Math.abs(ball.vx) * 0.86;
  }
  if (ball.y - ball.r < 58) {
    ball.y = 58 + ball.r;
    ball.vy = Math.abs(ball.vy) * 0.74;
  }

  collideWithPlayer(player);
  collideWithPlayer(ai);
  collideWithNet();

  if (ball.y + ball.r >= floor + 3) {
    awardPoint(ball.x < W / 2 ? "ai" : "player");
  }
}

function collideWithPlayer(p) {
  if (p.hitCooldown > 0) return;
  const dx = ball.x - p.x;
  const dy = ball.y - (p.y - 34);
  const dist = Math.hypot(dx, dy);
  const minDist = ball.r + p.r + 6;
  if (dist >= minDist || dist <= 0) return;

  const stats = p.human ? characterStats[selectedAnimal] : currentOpponentStats();
  const nx = dx / dist;
  const ny = dy / dist;
  ball.x = p.x + nx * minDist;
  ball.y = p.y - 34 + ny * minDist;

  const swingBoost = p.swing > 0 ? 1.38 : 1;
  const side = p.human ? 1 : -1;
  if (p.human && p.swing > 0) {
    const intent = playerShotIntent();
    const horizontal = (intent.right ? 1 : 0) - (intent.left ? 1 : 0);
    const aimedSide = horizontal || side;
    const lift = intent.up ? -9.2 : intent.down ? -3.6 : -6.4;
    const drive = intent.down ? 11.2 : intent.up ? 7.4 : 9.2;
    ball.vx = (aimedSide * drive + p.vx * 0.42) * stats.power;
    ball.vy = lift + p.vy * 0.16;
    ball.spin += aimedSide * (intent.down ? 1.7 : 1.15);
  } else {
    ball.vx = (nx * 8.4 + p.vx * 0.35 + side * (p.swing > 0 ? 4.6 : 1.45)) * swingBoost * stats.power;
    ball.vy = Math.min(-5.3, ny * 9.5 + p.vy * 0.2 - (p.swing > 0 ? 5.4 : 1.15));
    ball.spin += side * swingBoost;
  }
  p.swing = Math.max(p.swing, 7);
  p.hitCooldown = 8;
}

function collideWithNet() {
  const withinY = ball.y + ball.r > net.y && ball.y - ball.r < floor;
  const withinX = ball.x + ball.r > net.x && ball.x - ball.r < net.x + net.w;
  if (!withinX || !withinY) return;

  if (ball.y < net.y + 24) {
    const fromLeft = ball.x < W / 2;
    ball.y = net.y - ball.r - 4;
    ball.vy = -Math.max(4.2, Math.abs(ball.vy) * 0.78);
    ball.vx = Math.abs(ball.vx) < 1.8
      ? (fromLeft ? -2.2 : 2.2)
      : ball.vx * 0.82;
  } else if (ball.x < W / 2) {
    ball.x = net.x - ball.r - 2;
    ball.vx = -Math.max(2.4, Math.abs(ball.vx) * 0.86);
  } else {
    ball.x = net.x + net.w + ball.r + 2;
    ball.vx = Math.max(2.4, Math.abs(ball.vx) * 0.86);
  }
}

function awardPoint(side) {
  if (rallyOver || winner) return;
  rallyOver = true;
  score[side] += 1;
  serverSide = side;
  syncScore();
  popScore(side);
  showScoreToast(side);

  if (score[side] >= 7) {
    winner = side === "player" ? currentPlayerNickname() : currentOpponentStats().label;
    statusEl.textContent = `${winner} 승리!`;
    if (side === "player") {
      const reward = matchReward();
      window.setTimeout(() => showRewardModal("win", reward), 550);
    } else {
      window.setTimeout(() => showRewardModal("lose"), 550);
    }
    return;
  }

  statusEl.textContent = side === "player" ? "득점! 다음 서브" : "상대 득점. 곧 상대 서브";
  window.setTimeout(() => resetRally(side === "player" ? "서브 버튼으로 시작" : "상대가 서브합니다"), 850);
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCourt() {
  const stage = stages[selectedStage];
  const image = stageImages[selectedStage];
  if (image && image.complete && image.naturalWidth) {
    ctx.drawImage(image, 0, 0, W, H);
    ctx.fillStyle = stage.tint;
    ctx.fillRect(0, 0, W, H);
    return;
  }

  ctx.fillStyle = "#9dcc78";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f1c179";
  ctx.fillRect(0, 382, W, H - 382);
}

function drawNet() {
  // Stage artwork already includes the visible net; collision uses the same logical bounds.
}

function drawAnimal(p) {
  const image = characterImages[p.animal];
  if (image && image.complete && image.naturalWidth) {
    drawSpriteAnimal(p);
    drawNameTag(p);
    return;
  }

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.facing, 1);
  const bounce = p.onGround ? Math.sin(Date.now() / 100) * 1.5 : -3;
  ctx.translate(0, bounce);
  if (p.animal === "bunny") drawBunny(p);
  if (p.animal === "cat") drawCat(p);
  if (p.animal === "bear") drawBear(p);
  if (p.animal === "frog") drawFrog(p);
  ctx.restore();
  drawNameTag(p);
}

function drawSpriteAnimal(p) {
  const image = characterImages[p.animal] || characterImages.bunny;
  if (!image || !image.naturalWidth) return;
  const bounce = p.human && p.onGround ? Math.sin(Date.now() / 120) * 1.1 : p.onGround ? 0 : -3;
  const h = p.human ? 122 : 116;
  const w = h * (image.naturalWidth / image.naturalHeight);
  const drawX = Math.round(p.x);
  const drawY = Math.round(p.y);
  const drawW = Math.round(w);
  const drawH = Math.round(h);
  const drawBounce = Math.round(bounce);
  const y = drawY - drawH + drawBounce + (p.swing > 0 ? -4 : 0);

  ctx.save();
  ctx.translate(drawX, drawY);
  if (p.human) ctx.scale(p.facing, 1);
  ctx.shadowColor = "rgba(78, 47, 27, 0.28)";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 8;
  ctx.drawImage(image, -drawW / 2, -drawH + drawBounce, drawW, drawH);
  ctx.restore();

  if (p.swing > 0) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 240, 166, 0.75)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(drawX + p.facing * 24, y + 34, 28, -0.7, 0.65);
    ctx.stroke();
    ctx.restore();
  }
}

function roundedEllipse(x, y, rx, ry, rotation) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
}

function drawBunny(p) {
  drawEars("#fffdf7", "#ffd9e7");
  drawBody("#fffdf7", "#443832", "#ffd9e7", p.swing);
}

function drawCat(p) {
  ctx.fillStyle = "#eef6f4";
  ctx.strokeStyle = "#443832";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-24, -92);
  ctx.lineTo(-11, -112);
  ctx.lineTo(1, -89);
  ctx.lineTo(14, -112);
  ctx.lineTo(27, -92);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  drawBody("#eef6f4", "#443832", "#ffd6d9", p.swing);
}

function drawBear(p) {
  ctx.fillStyle = "#b8794c";
  ctx.strokeStyle = "#4a3527";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(-19, -88, 11, 0, Math.PI * 2);
  ctx.arc(19, -88, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawBody("#b8794c", "#4a3527", "#f8dfba", p.swing);
}

function drawFrog(p) {
  ctx.fillStyle = "#9ed584";
  ctx.strokeStyle = "#3f5a35";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(-17, -91, 11, 0, Math.PI * 2);
  ctx.arc(17, -91, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawBody("#9ed584", "#3f5a35", "#f2e9a6", p.swing);
}

function drawEars(outer, inner) {
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#443832";
  ctx.fillStyle = outer;
  roundedEllipse(-12, -88, 13, 31, -0.18);
  ctx.fill();
  ctx.stroke();
  roundedEllipse(15, -88, 13, 31, 0.22);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = inner;
  roundedEllipse(-12, -88, 5, 20, -0.18);
  ctx.fill();
  roundedEllipse(15, -88, 5, 20, 0.22);
  ctx.fill();
}

function drawBody(fill, stroke, belly, swing) {
  const armAngle = swing > 0 ? -22 : -7;
  ctx.lineWidth = 4;
  ctx.strokeStyle = stroke;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(0, -42, 30, 38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -74, 28, 25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = belly;
  ctx.beginPath();
  ctx.ellipse(0, -37, 10, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#322723";
  ctx.beginPath();
  ctx.arc(-9, -78, 3, 0, Math.PI * 2);
  ctx.arc(9, -78, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#322723";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -70, 5, 0.2, Math.PI - 0.2);
  ctx.stroke();

  drawLimbs(fill, stroke, armAngle);
}

function drawLimbs(color, stroke, swing) {
  ctx.strokeStyle = stroke;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(-19, -37, 8, 17, -0.5, 0, Math.PI * 2);
  ctx.ellipse(19, -37, 8, 17, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.rotate((Math.PI / 180) * swing);
  ctx.beginPath();
  ctx.ellipse(28, -58, 9, 24, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#fffaf0";
  ctx.beginPath();
  ctx.ellipse(-13, -2, 13, 6, -0.25, 0, Math.PI * 2);
  ctx.ellipse(15, -2, 13, 6, 0.25, 0, Math.PI * 2);
  ctx.fill();
}

function drawNameTag(p) {
  ctx.save();
  ctx.font = "12px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillText(p.name, p.x, floor + 22);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText(p.name, p.x, floor + 20);
  ctx.restore();
}

function drawBall() {
  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.rotate(ball.spin);
  ctx.shadowColor = "rgba(255, 236, 151, 0.9)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#fffdf1";
  ctx.beginPath();
  ctx.arc(0, 0, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#e84f3d";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, ball.r - 3, -1.4, 0.6);
  ctx.stroke();
  ctx.strokeStyle = "#f0b32e";
  ctx.beginPath();
  ctx.arc(0, 0, ball.r - 3, 0.8, 2.8);
  ctx.stroke();
  ctx.strokeStyle = "#2f6ed8";
  ctx.beginPath();
  ctx.arc(0, 0, ball.r - 3, 3, 5.2);
  ctx.stroke();
  ctx.restore();
}

function showMenu() {
  gameMode = "menu";
  stageEl.classList.add("menu-active");
  closeRewardModal();
  statusEl.textContent = "서브 버튼으로 시작";
}

function startGame() {
  gameMode = "playing";
  stageEl.classList.remove("menu-active");
  closeRewardModal();
  resetMatch();
}

function setPanel(name) {
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === name);
  });
  document.querySelectorAll(".panel-view").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === name);
  });
}

function updateStagePreview() {
  const stage = stages[selectedStage];
  const opponent = characterStats[stage.opponent] || characterStats.monkey;
  featuredStageImageEl.src = stage.image;
  featuredStageImageEl.alt = `${stage.name} 미리보기`;
  featuredStageNoEl.textContent = `스테이지 ${stage.index}`;
  featuredStageNameEl.textContent = stage.name;
  featuredStageDescEl.textContent = `${stage.desc} 상대: ${opponent.name}`;
  const starsEl = document.querySelector(".stage-stars");
  starsEl.innerHTML = "";
  for (let index = 0; index < stage.index; index += 1) {
    const star = document.createElement("span");
    star.textContent = "★";
    starsEl.appendChild(star);
  }
  document.querySelector("#stageCount").textContent = `${stage.index} / ${Object.keys(stages).length}`;
}

function loop() {
  if (gameMode === "playing") {
    updatePlayer(player);
    updatePlayer(ai);
    if (waitingServe) {
      holdServeBall();
      servePower = (servePower + 0.025) % 2.4;
      if (serverSide === "ai" && aiServeAt && performance.now() >= aiServeAt) {
        startServe();
      }
    } else if (!winner && !rallyOver) {
      updateBall();
    }
  }
  drawCourt();
  drawAnimal(player);
  drawAnimal(ai);
  drawBall();
  drawNet();
  requestAnimationFrame(loop);
}

function bindHold(button, name, onTap) {
  const start = (event) => {
    event.preventDefault();
    heldButtons.add(name);
    button.classList.add("is-active");
    if (onTap) onTap();
  };
  const end = (event) => {
    event.preventDefault();
    heldButtons.delete(name);
    button.classList.remove("is-active");
  };
  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", end);
  button.addEventListener("pointercancel", end);
  button.addEventListener("pointerleave", end);
}

window.addEventListener("keydown", (event) => {
  const name = normalizeInput(event);
  if (!name) return;
  event.preventDefault();
  if (name === "menu") {
    showMenu();
    return;
  }
  if (name === "hit") hitBall();
  inputs.add(name);
});

window.addEventListener("keyup", (event) => {
  const name = normalizeInput(event);
  if (name) inputs.delete(name);
});

document.querySelectorAll(".tab-btn").forEach((button) => {
  button.addEventListener("click", () => setPanel(button.dataset.view));
});

document.querySelectorAll("[data-stage]").forEach((button) => {
  button.addEventListener("click", () => {
    selectStage(button.dataset.stage);
  });
});

drawCharacterBtn.addEventListener("click", drawCharacter);

mailBtn.addEventListener("click", () => {
  mailModal.classList.add("open");
  mailModal.setAttribute("aria-hidden", "false");
});

mailCloseBtn.addEventListener("click", () => {
  mailModal.classList.remove("open");
  mailModal.setAttribute("aria-hidden", "true");
});

settingsBtn.addEventListener("click", openSettings);
settingsCloseBtn.addEventListener("click", closeSettings);
settingsModal.addEventListener("click", (event) => {
  if (event.target === settingsModal) closeSettings();
});

touchToggleEl.addEventListener("change", () => setTouchControlsVisible(touchToggleEl.checked));
saveNicknameBtn.addEventListener("click", saveNickname);
nicknameInputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    saveNickname();
  }
});
fullscreenBtn.addEventListener("click", toggleFullscreen);
settingsRestartBtn.addEventListener("click", () => {
  resetMatch();
  closeSettings();
});
rewardCloseBtn.addEventListener("click", () => {
  if (pendingResult?.result === "lose") {
    closeRewardModal();
    startGame();
    return;
  }
  claimResultReward();
});

rewardNextBtn.addEventListener("click", () => {
  claimResultReward();
  closeRewardModal();
  const next = nextStageKey();
  if (next === selectedStage) {
    showMenu();
    return;
  }
  selectStage(next);
  startGame();
});

claimMailBtn.addEventListener("click", () => {
  if (mailClaimed) return;
  coins += 2000;
  gems += 30;
  mailClaimed = true;
  syncWallet();
  saveGame();
});

bindHold(leftBtn, "left");
bindHold(rightBtn, "right");
bindHold(serveBtn, "hit", hitBall);
bindHold(bumpBtn, "down");
bindHold(jumpBtn, "jump");

startBtn.addEventListener("click", startGame);
menuBtn.addEventListener("click", showMenu);
restartBtn.addEventListener("click", resetMatch);

loadGame();
selectStage(selectedStage, false);
resetMatch();
syncPlayerName();
syncWallet();
syncProfileProgress();
syncSettingsPanel();
updateGachaResult(selectedAnimal, "선택 캐릭터");
updateProfileAvatar(selectedAnimal);
renderCharacterGrid();
loadServerGame();
showMenu();
loop();
