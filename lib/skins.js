// Skin definitions for cars and block themes

export const CAR_SKINS = [
  { id: 'default', name: '经典蓝', icon: '🚚', color: '#5D6D7E', price: 0, desc: '默认小车' },
  { id: 'red_flame', name: '烈焰红', icon: '🚒', color: '#E74C3C', price: 200, desc: '红色火焰涂装' },
  { id: 'gold_race', name: '黄金赛车', icon: '🏎️', color: '#F1C40F', price: 500, desc: '金色赛车条纹' },
  { id: 'neon_green', name: '霓虹绿', icon: '🛸', color: '#2ECC71', price: 350, desc: '霓虹绿色光效' },
];

export const BLOCK_THEMES = [
  { id: 'default', name: '经典方块', icon: '🧱', price: 0, colors: null, desc: '默认配色' },
  { id: 'crystal', name: '水晶方块', icon: '💎', price: 300,
    colors: [
      { lighter: 'rgba(231,76,60,0.7)', main: 'rgba(231,76,60,0.9)', darker: 'rgba(192,57,43,1)' },
      { lighter: 'rgba(52,152,219,0.7)', main: 'rgba(52,152,219,0.9)', darker: 'rgba(36,113,163,1)' },
      { lighter: 'rgba(46,204,113,0.7)', main: 'rgba(46,204,113,0.9)', darker: 'rgba(30,132,73,1)' },
      { lighter: 'rgba(241,196,15,0.7)', main: 'rgba(241,196,15,0.9)', darker: 'rgba(183,149,11,1)' },
      { lighter: 'rgba(155,89,182,0.7)', main: 'rgba(155,89,182,0.9)', darker: 'rgba(125,60,152,1)' },
      { lighter: 'rgba(230,126,34,0.7)', main: 'rgba(230,126,34,0.9)', darker: 'rgba(186,74,0,1)' },
    ],
    desc: '透明水晶质感' },
  { id: 'pixel', name: '像素方块', icon: '👾', price: 400,
    colors: [
      { lighter: '#FF6B6B', main: '#E74C3C', darker: '#900C3F' },
      { lighter: '#6BB5FF', main: '#3498DB', darker: '#1A5276' },
      { lighter: '#6BFF6B', main: '#2ECC71', darker: '#145A32' },
      { lighter: '#FFE66B', main: '#F1C40F', darker: '#7D6608' },
      { lighter: '#C36BFF', main: '#9B59B6', darker: '#4A235A' },
      { lighter: '#FFB36B', main: '#E67E22', darker: '#784212' },
    ],
    desc: '复古像素风格' },
];
