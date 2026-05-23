const KEY = 'carblocktower_save';

const INITIAL_COINS = 500;

export function load() {
  try {
    const raw = wx.getStorageSync(KEY);
    if (raw) return JSON.parse(raw);
    // New profile — seed with starting coins
    const initial = { coins: INITIAL_COINS, upgrades: {}, gameCount: 0 };
    try { wx.setStorageSync(KEY, JSON.stringify(initial)); } catch (e) {}
    return initial;
  } catch (e) {
    return { coins: INITIAL_COINS, upgrades: {}, gameCount: 0 };
  }
}

export function save(data) {
  try {
    wx.setStorageSync(KEY, JSON.stringify(data));
  } catch (e) {
    // Storage full or unavailable
  }
}

export function loadBestScores() {
  const data = load();
  return {
    levelsBest: data.levelsBest || 0,
    infiniteBest: data.infiniteBest || 0,
    coins: data.coins || 0,
    upgrades: data.upgrades || {},
    gameCount: data.gameCount || 0,
  };
}

export function getTutorialSeen() {
  const data = load();
  return data.tutorialSeen === true;
}

export function setTutorialSeen() {
  const data = load();
  data.tutorialSeen = true;
  save(data);
}

export function incrementGameCount() {
  const data = load();
  data.gameCount = (data.gameCount || 0) + 1;
  save(data);
}

export function saveBestScore(gameMode, score) {
  const data = load();
  let key = 'levelsBest';
  if (gameMode === 'infinite') key = 'infiniteBest';
  else if (gameMode === 'ladder') key = 'ladderBest';
  if (score > (data[key] || 0)) {
    data[key] = score;
    save(data);
    return true;
  }
  return false;
}

export function saveCoins(amount) {
  const data = load();
  data.coins = (data.coins || 0) + amount;
  save(data);
}

export function getUpgradeLevel(key) {
  // Ladder mode: all upgrades disabled for fair competition
  try {
    if (GameGlobal && GameGlobal.databus && GameGlobal.databus.gameMode === 'ladder') {
      return 0;
    }
  } catch (e) {}
  const data = load();
  return (data.upgrades && data.upgrades[key]) || 0;
}

// Skin management
export function getOwnedSkins() {
  const data = load();
  return data.ownedSkins || ['default'];
}

export function getEquippedCarSkin() {
  const data = load();
  return data.equippedCarSkin || 'default';
}

export function getEquippedBlockTheme() {
  const data = load();
  return data.equippedBlockTheme || 'default';
}

export function buySkin(skinId, cost, type) {
  const data = load();
  if ((data.coins || 0) < cost) return false;
  if (!data.ownedSkins) data.ownedSkins = ['default'];
  if (data.ownedSkins.includes(skinId)) return false; // already owned
  data.coins -= cost;
  data.ownedSkins.push(skinId);
  save(data);
  return true;
}

export function equipCarSkin(skinId) {
  const data = load();
  data.equippedCarSkin = skinId;
  save(data);
}

export function equipBlockTheme(themeId) {
  const data = load();
  data.equippedBlockTheme = themeId;
  save(data);
}

export function buyUpgrade(key, cost, newLevel) {
  const data = load();
  if ((data.coins || 0) < cost) return false;
  data.coins -= cost;
  if (!data.upgrades) data.upgrades = {};
  data.upgrades[key] = newLevel;
  save(data);
  return true;
}
