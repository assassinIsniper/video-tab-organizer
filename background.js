// background.js —— 维护状态 + 重排标签页
const DEFAULT_SETTINGS = { enabled: true, order: 'asc' }; // asc: 早打开的靠左

/** tabId -> Set<frameId>（该标签页里正在播放视频的 frame） */
const frameStates = new Map();

let stateLoaded = false;
let reorderTimer = null;
let reordering = false;
let reorderQueued = false;

/* ---------------- 状态持久化（Service Worker 会被休眠） ---------------- */

async function loadState() {
  try {
    const stored = await chrome.storage.session.get('frameStates');
    const saved = stored && stored.frameStates;
    if (saved) {
      for (const [tabId, frames] of Object.entries(saved)) {
        frameStates.set(Number(tabId), new Set(frames.map(Number)));
      }
    }
  } catch (e) { /* ignore */ }
  stateLoaded = true;
}

let saveTimer = null;
function saveState() {
  if (saveTimer) return;
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    const obj = {};
    for (const [tabId, frames] of frameStates) {
      if (frames.size) obj[tabId] = [...frames];
    }
    try { await chrome.storage.session.set({ frameStates: obj }); } catch (e) {}
  }, 500);
}

function isTabPlaying(tabId) {
  const s = frameStates.get(tabId);
  return !!s && s.size > 0;
}

/* ---------------- 重排调度 ---------------- */

function scheduleReorder(delay = 500) {
  if (reorderTimer) clearTimeout(reorderTimer);
  reorderTimer = setTimeout(() => {
    reorderTimer = null;
    runReorder();
  }, delay);
}

async function runReorder() {
  if (!stateLoaded) return;
  if (reordering) { reorderQueued = true; return; }
  reordering = true;
  try {
    const { enabled, order } = await chrome.storage.local.get(DEFAULT_SETTINGS);
    if (!enabled) return;
    const wins = await chrome.windows.getAll();
    for (const w of wins) {
      try { await reorderWindow(w.id, order); } catch (e) {}
    }
  } catch (e) {
    // ignore
  } finally {
    reordering = false;
    if (reorderQueued) { reorderQueued = false; scheduleReorder(200); }
  }
}

/**
 * 单个窗口内的重排：
 *   [固定标签页] + [普通标签页（保持原相对顺序）] + [视频标签页（按打开时间排序）]
 */
async function reorderWindow(windowId, order) {
  const raw = await chrome.tabs.query({ windowId });
  if (raw.length < 2) return;

  const tabs = raw.slice().sort((a, b) => a.index - b.index);

  const pinned = [];
  const others = [];
  const videos = [];

  for (const t of tabs) {
    if (t.pinned) { pinned.push(t); continue; }   // 固定标签页永远待在最左侧
    if (isTabPlaying(t.id)) videos.push(t);
    else others.push(t);
  }

  // 用 tab.id 作为“打开时间”的代理：Chrome 的 tabId 是单调递增的
  videos.sort((a, b) => (order === 'desc' ? b.id - a.id : a.id - b.id));

  const desired = [...pinned, ...others, ...videos].map(t => t.id);
  const current = tabs.map(t => t.id);

  if (desired.every((id, i) => id === current[i])) return; // 顺序已正确，不折腾

  // 在内存里同步模拟，再逐个执行移动，避免反复查询
  const list = current.slice();
  for (let i = 0; i < desired.length; i++) {
    if (list[i] === desired[i]) continue;
    const from = list.indexOf(desired[i]);
    if (from === -1) continue;
    list.splice(from, 1);
    list.splice(i, 0, desired[i]);
    try {
      await chrome.tabs.move(desired[i], { index: i });
    } catch (e) { /* 标签页可能已关闭 */ }
  }
}

/* ---------------- 事件监听 ---------------- */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;

  if (msg.type === 'REORDER_NOW') {
    runReorder().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (msg.type === 'VIDEO_STATE') {
    const tabId = sender.tab && sender.tab.id;
    if (tabId == null) return;
    const frameId = sender.frameId != null ? sender.frameId : 0;

    let set = frameStates.get(tabId);
    if (!set) { set = new Set(); frameStates.set(tabId, set); }

    const before = set.size > 0;
    if (msg.playing) set.add(frameId);
    else set.delete(frameId);
    const after = set.size > 0;

    saveState();
    if (before !== after) scheduleReorder();
  }
});

chrome.tabs.onCreated.addListener(() => scheduleReorder());

chrome.tabs.onRemoved.addListener((tabId) => {
  if (frameStates.delete(tabId)) saveState();
  scheduleReorder();
});

chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
  frameStates.delete(removedTabId);
  frameStates.delete(addedTabId);
  saveState();
  scheduleReorder();
});

// 页面导航到新地址后，旧的播放状态作废
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url || changeInfo.status === 'loading') {
    const set = frameStates.get(tabId);
    if (set && set.size) {
      frameStates.delete(tabId);
      saveState();
      scheduleReorder();
    }
  }
});

// 设置变更后立即应用一次
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.enabled || changes.order)) scheduleReorder(200);
});

/* ---------------- 启动 ---------------- */

loadState().then(() => {
  scheduleReorder(800);
});