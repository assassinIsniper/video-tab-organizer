// content.js —— 运行在每个页面的每个 frame 里，检测是否有 <video> 正在播放
(() => {
  if (window.__videoTabWatcherInjected) return;
  window.__videoTabWatcherInjected = true;

  const HEARTBEAT_MS = 15000;
  let lastReported = null;
  let timer = null;

  function anyPlaying() {
    const vids = document.querySelectorAll('video');
    for (let i = 0; i < vids.length; i++) {
      const v = vids[i];
      if (!v.paused && !v.ended) return true;
    }
    return false;
  }

  function send(msg) {
    try {
      const p = chrome.runtime.sendMessage(msg);
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) { /* 扩展被卸载时忽略 */ }
  }

  function report(force) {
    const playing = anyPlaying();
    if (!force && playing === lastReported) return;
    lastReported = playing;
    send({ type: 'VIDEO_STATE', playing });
  }

  // 合并短时间内的多次变化，避免频繁唤醒后台
  function scheduleReport() {
    if (timer) return;
    timer = setTimeout(() => { timer = null; report(false); }, 200);
  }

  // 媒体事件不冒泡，用捕获阶段监听
  const EVENTS = ['play', 'playing', 'pause', 'ended', 'emptied', 'abort', 'seeked', 'waiting'];
  for (const ev of EVENTS) {
    document.addEventListener(ev, scheduleReport, true);
  }

  // 动态插入的 <video> 也能捕捉到
  const mo = new MutationObserver(scheduleReport);
  mo.observe(document.documentElement || document, { childList: true, subtree: true });

  // 心跳，兜底（也用于 Service Worker 重启后恢复状态）
  setInterval(() => report(false), HEARTBEAT_MS);

  // 页面卸载/跳转时上报停止
  window.addEventListener('pagehide', () => send({ type: 'VIDEO_STATE', playing: false }));

  // 初始上报
  report(true);
})();