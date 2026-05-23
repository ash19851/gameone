// Social - Open Data Domain communication
// Communicates with open-data-context/ for friend leaderboard

let openDataContext = null;

export function initOpenData() {
  try {
    openDataContext = wx.getOpenDataContext();
  } catch (e) {
    console.warn('Open data context not available:', e);
  }
}

export function submitLadderScore(score) {
  if (!openDataContext) return;
  openDataContext.postMessage({
    type: 'updateScore',
    score: score,
    mode: 'ladder',
  });
}

export function showLeaderboard(view = 'friend') {
  if (!openDataContext) return;
  openDataContext.postMessage({
    type: 'show',
    view: view,
  });
}

export function hideLeaderboard() {
  if (!openDataContext) return;
  openDataContext.postMessage({ type: 'hide' });
}
