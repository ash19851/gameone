export const BLOCK_TYPES = [
  { name: 'red',    color: '#E74C3C', lighter: '#F1948A', darker: '#C0392B' },
  { name: 'blue',   color: '#3498DB', lighter: '#85C1E9', darker: '#2471A3' },
  { name: 'green',  color: '#2ECC71', lighter: '#82E0AA', darker: '#1E8449' },
  { name: 'yellow', color: '#F1C40F', lighter: '#F9E79F', darker: '#B7950B' },
  { name: 'purple', color: '#9B59B6', lighter: '#C39BD3', darker: '#7D3C98' },
  { name: 'orange', color: '#E67E22', lighter: '#F0B27A', darker: '#BA4A00' },
  // Special blocks
  { name: 'universal', color: '#FFD700', lighter: '#FFF3B0', darker: '#DAA520', special: 'universal', icon: '⭐' },
  { name: 'magnet',    color: '#FF4500', lighter: '#FF7043', darker: '#BF360C', special: 'magnet',    icon: '🧲' },
  { name: 'bomb',      color: '#2C2C2C', lighter: '#4A4A4A', darker: '#111111', special: 'bomb',      icon: '💣' },
];

export const SPECIAL_SPAWN_RATE = 0.04;
export const BOMB_FUSE_DURATION = 1.0;
export const BOMB_EXPLOSION_RADIUS = 75;
export const MAGNET_PULL_FORCE = 500;
export const MAGNET_PULL_FALLOFF = 300;
export const SCORE_BOMB_DESTROY = 10;

export const GRAVITY = 900;
export const TERMINAL_VELOCITY = 650;

export const BUCKET_SIZE = 8;

export const BLOCK_HEIGHT = 28;
export const BLOCK_MIN_WIDTH = 26;
export const BLOCK_MAX_WIDTH = 58;
export const BLOCK_BORDER_RADIUS = 4;

export const CAR_BASE_WIDTH = 76;
export const CAR_HEIGHT = 18;
export const CAR_Y_RATIO = 0.88;
export const CAR_COLOR = '#5D6D7E';

export const BASE_SPAWN_INTERVAL = 2.2;
export const MIN_SPAWN_INTERVAL = 0.7;
export const SPAWN_MARGIN = 20;

export const MERGE_VERTICAL_TOLERANCE = 14;
export const MERGE_GAP_TOLERANCE = 15;
export const SNAP_RANGE = 42;

export const STABILITY_MARGIN = 1.4;
export const INSTABILITY_THRESHOLD = 1.8;
export const TILT_SPEED = 25;
export const COLLAPSE_ANGLE = 40;

export const MAX_PARTICLES = 50;
export const PARTICLE_LIFE = 0.6;
export const PARTICLE_SPEED = 200;
export const PARTICLE_SIZE = 4;

// Scoring
export const SCORE_CATCH = 10;
export const SCORE_DROP_PENALTY = 5;
export const SCORE_PER_MERGE = 15;
export const SCORE_DISPLACE = 8;
export const COMBO_WINDOW = 5.0;

// Lives
export const MAX_LIVES = 5;

// Camera
export const HUD_HEIGHT = 40;
export const CAR_BAR_HEIGHT = 80;
export const CAMERA_THRESHOLD_RATIO = 0.6;

// Levels mode
export const LEVELS = [
  { level: 1, layers: 6,  colors: 2, intervalStart: 2.2, intervalEnd: 1.6, colorNames: ['红', '蓝'] },
  { level: 2, layers: 6,  colors: 3, intervalStart: 1.6, intervalEnd: 1.2, colorNames: ['红', '蓝', '绿'] },
  { level: 3, layers: 12, colors: 4, intervalStart: 1.2, intervalEnd: 0.9, colorNames: ['红', '蓝', '绿', '黄'] },
  { level: 4, layers: 24, colors: 5, intervalStart: 0.9, intervalEnd: 0.7, colorNames: ['红', '蓝', '绿', '黄', '紫'] },
  { level: 5, layers: Infinity, colors: 6, intervalStart: 0.6, intervalEnd: 0.6, colorNames: ['红', '蓝', '绿', '黄', '紫', '橙'] },
];

// Infinite mode
export const INFINITE_COLORS_START = 3;
export const INFINITE_COLORS_MAX = 6;
export const INFINITE_LAYERS_PER_COLOR = 8;
export const INFINITE_INTERVAL_START = 1.8;
export const INFINITE_INTERVAL_MIN = 0.5;
export const INFINITE_INTERVAL_DECREASE = 0.02;

// Coins
export const COIN_EARN_RATIO = 5;

// Upgrades
export const UPGRADES = [
  { key: 'carWidth',   name: '加宽小车', icon: '🚗', maxLv: 3, costs: [100, 250, 500],   desc: '车宽 +8px' },
  { key: 'colorReduce',name: '颜色精简', icon: '🎨', maxLv: 2, costs: [200, 400],         desc: '起始颜色 -1' },
  { key: 'slowStart',  name: '缓降开局', icon: '⏱',  maxLv: 3, costs: [100, 200, 400],   desc: '起始间隔 +0.3s' },
  { key: 'stability',  name: '稳定底座', icon: '💪', maxLv: 2, costs: [300, 600],         desc: '底座容差 +0.2' },
];
export const UPGRADE_CAR_WIDTH_BONUS = 8;
export const UPGRADE_SLOW_START_BONUS = 0.3;
export const UPGRADE_STABILITY_BONUS = 0.2;

// Skills
export const SKILL_SLOW_DURATION = 4;
export const SKILL_SLOW_FACTOR = 0.5;
export const SKILL_MAGNET_USES = 2;
export const SKILL_SAME_COLOR_DURATION = 5;
export const SKILL_TILT_RESET_USES = 1;

// Ad triggers
export const INTERSTITIAL_EVERY_N_GAMES = 3;

// Screen shake
export const SHAKE_DECAY = 6.0;
export const SHAKE_INITIAL = 10;

// Floating score text
export const MAX_FLOAT_TEXTS = 24;
export const FLOAT_TEXT_LIFE = 1.0;
export const FLOAT_TEXT_RISE_SPEED = 60;
