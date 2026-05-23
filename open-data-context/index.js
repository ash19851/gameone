// Open Data Context — renders friend leaderboard
// Runs in a separate context, only has access to wx cloud storage APIs

const ctx = canvas.getContext('2d');
const SCREEN_WIDTH = canvas.width;
const SCREEN_HEIGHT = canvas.height;

// State
let friends = [];
let viewMode = 'friend'; // 'friend' | 'world'
let ownScore = 0;

// Listen for messages from main domain
wx.onMessage(data => {
  if (data.type === 'updateScore') {
    ownScore = data.score;
    uploadScore(data.score, data.mode);
  }
  if (data.type === 'show') {
    viewMode = data.view || 'friend';
    loadAndRender();
  }
  if (data.type === 'hide') {
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }
});

// Upload score to cloud storage
function uploadScore(score, mode) {
  const key = mode === 'ladder' ? 'ladderScore' : 'score';
  wx.setUserCloudStorage({
    KVDataList: [{
      key: key,
      value: String(score),
    }],
    success: () => {
      console.log('Score uploaded');
    },
    fail: (err) => {
      console.error('Score upload failed:', err);
    },
  });
}

// Load friend data and render
function loadAndRender() {
  wx.getFriendCloudStorage({
    keyList: ['ladderScore', 'avatarUrl'],
    success: res => {
      friends = res.data
        .filter(f => f.KVDataList && f.KVDataList.some(kv => kv.key === 'ladderScore'))
        .map(f => {
          const kv = f.KVDataList.find(kv => kv.key === 'ladderScore');
          return {
            nickname: f.nickname || 'Unknown',
            avatarUrl: f.avatarUrl || '',
            score: parseInt(kv ? kv.value : '0') || 0,
            isMe: kv && parseInt(kv.value) === ownScore && f.nickname === getOwnNickname(),
          };
        })
        .sort((a, b) => b.score - a.score);
      render();
    },
    fail: () => {
      // Fallback: show empty state
      renderEmpty();
    },
  });
}

function getOwnNickname() {
  // In open data context, we can get own info
  return '';
}

// Render leaderboard
function render() {
  ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Background
  ctx.fillStyle = 'rgba(26, 26, 46, 0.95)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  // Title
  ctx.fillStyle = '#F1C40F';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('🏆 天梯排行榜', SCREEN_WIDTH / 2, 20);

  // Tabs
  const tabY = 52;
  const tabW = 80;
  const tabH = 32;
  const tabX = SCREEN_WIDTH / 2 - tabW;

  ctx.fillStyle = viewMode === 'friend' ? '#3498DB' : 'rgba(255,255,255,0.1)';
  ctx.fillRect(tabX, tabY, tabW, tabH);
  ctx.fillStyle = '#fff';
  ctx.font = '14px Arial';
  ctx.fillText('好友榜', tabX + tabW / 2, tabY + tabH / 2 - 7);

  ctx.fillStyle = viewMode === 'world' ? '#3498DB' : 'rgba(255,255,255,0.1)';
  ctx.fillRect(tabX + tabW, tabY, tabW, tabH);
  ctx.fillText('世界榜', tabX + tabW + tabW / 2, tabY + tabH / 2 - 7);

  if (friends.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '16px Arial';
    ctx.fillText('暂无好友数据', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    ctx.fillText('去天梯模式打一局吧！', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 28);
    return;
  }

  // Rankings
  const listStartY = 95;
  const rowH = 52;
  const maxItems = Math.min(friends.length, Math.floor((SCREEN_HEIGHT - listStartY - 40) / rowH));

  for (let i = 0; i < maxItems; i++) {
    const f = friends[i];
    const y = listStartY + i * rowH;

    // Highlight own row
    if (f.isMe) {
      ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
      ctx.fillRect(10, y, SCREEN_WIDTH - 20, rowH - 4);
    }

    // Rank
    ctx.fillStyle = i < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][i] : 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`#${i + 1}`, 20, y + 26);

    // Avatar (placeholder circle)
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(60, y + 26, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(f.nickname.charAt(0) || '?', 60, y + 30);

    // Name
    ctx.fillStyle = f.isMe ? '#3498DB' : '#fff';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(f.nickname, 85, y + 20);

    // Score
    ctx.fillStyle = '#F1C40F';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`${f.score}`, SCREEN_WIDTH - 20, y + 26);
  }

  // Close hint
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('点击任意位置关闭', SCREEN_WIDTH / 2, SCREEN_HEIGHT - 20);
}

function renderEmpty() {
  ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  ctx.fillStyle = 'rgba(26, 26, 46, 0.95)';
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('排行榜加载中...', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
}

// Initial load
loadAndRender();
