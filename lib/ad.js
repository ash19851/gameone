// Check if we're running in WeChat DevTools (ads not supported)
function isDevTools() {
  try {
    const info = wx.getSystemInfoSync();
    return info.platform === 'devtools';
  } catch (e) {
    return true; // assume dev if we can't check
  }
}

// Rewarded video ad — returns promise that resolves true when ad completes or fails
export function showRewardedAd(adUnitId) {
  // Ads not supported in dev tools, grant reward immediately
  if (isDevTools()) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    try {
      const rewarded = wx.createRewardedVideoAd({ adUnitId });
      rewarded.onClose((res) => {
        resolve(res && res.isEnded);
      });
      rewarded.onError(() => {
        resolve(true);
      });
      rewarded.load().then(() => rewarded.show()).catch(() => resolve(true));
    } catch (e) {
      resolve(true);
    }
  });
}

// Interstitial ad — fire and forget, skipped in dev tools
export function showInterstitial(adUnitId) {
  if (isDevTools()) return;

  try {
    const interstitial = wx.createInterstitialAd({ adUnitId });
    interstitial.onError(() => {});
    interstitial.load().then(() => interstitial.show()).catch(() => {});
  } catch (e) {
    // Interstitials are optional
  }
}
