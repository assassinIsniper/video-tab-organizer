// popup.js
const DEFAULT_SETTINGS = { enabled: true, order: 'asc' };
const statusEl = document.getElementById('status');

function setStatus(text) {
  statusEl.textContent = text;
  clearTimeout(setStatus._t);
  setStatus._t = setTimeout(() => { statusEl.textContent = ''; }, 2000);
}

async function init() {
  const s = await chrome.storage.local.get(DEFAULT_SETTINGS);
  document.getElementById('enabled').checked = !!s.enabled;
  const radio = document.querySelector(`input[name="order"][value="${s.order}"]`);
  if (radio) radio.checked = true;
}

document.getElementById('enabled').addEventListener('change', async (e) => {
  await chrome.storage.local.set({ enabled: e.target.checked });
  setStatus(e.target.checked ? '已启用' : '已暂停');
});

document.querySelectorAll('input[name="order"]').forEach((r) => {
  r.addEventListener('change', async (e) => {
    await chrome.storage.local.set({ order: e.target.value });
    setStatus('已保存，正在整理…');
    chrome.runtime.sendMessage({ type: 'REORDER_NOW' });
  });
});

document.getElementById('now').addEventListener('click', async () => {
  setStatus('整理中…');
  try {
    await chrome.runtime.sendMessage({ type: 'REORDER_NOW' });
    setStatus('完成');
  } catch (e) {
    setStatus('失败');
  }
});

init();