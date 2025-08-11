

// history.js - Regenerated for robust history page
import { getSessionToken, requireUser } from './auth.js';

const historyList = document.getElementById('history-list');
const searchEl = document.getElementById('searchEl');
const btnSearch = document.getElementById('btnSearch');

// Load all uploads on page load
window.addEventListener('DOMContentLoaded', () => {
  requireUser().then(() => loadHistory());
});

btnSearch.onclick = () => {
  requireUser().then(() => loadHistory(searchEl.value.trim()));
};

async function loadHistory(search = '') {
  const token = await getSessionToken();
  let url = 'http://localhost:5500/api/history';
  if (search) url += `?search=${encodeURIComponent(search)}`;
  const resp = await fetch(url, {
    headers: { Authorization: 'Bearer ' + token }
  });
  const data = await resp.json();
  if (!resp.ok) {
    historyList.textContent = data.error || 'Failed to load history.';
    return;
  }
  render(data.items || [], search);
}

function render(items, search) {
  historyList.innerHTML = '';
  if (!items.length) {
    const msg = search ? `No uploads found for "${search}".` : 'No uploads found.';
    historyList.innerHTML = `<div style="color:#e74c3c;font-weight:600;text-align:center;padding:2rem 0;">${msg}</div>`;
    return;
  }
  // Sort by newest first
  items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  for (const it of items) {
    const row = document.createElement('div');
    row.className = 'item';
    row.innerHTML = `
      <div>
        <div><strong>${escapeHtml(it.name)}</strong></div>
        <div class="small">${new Date(it.created_at).toLocaleString()}</div>
        <div class="small">Image: <a href="${it.image_url}" target="_blank">open</a> &middot; Model: <a href="${it.model_url}" target="_blank">open</a></div>
      </div>
      <div class="row">
        <button class="btn secondary" data-view="${it.share_id}" style="width:100%;margin-bottom:0.3rem;">View</button>
        <button class="btn secondary" data-copy="${it.share_id}" style="width:100%;margin-bottom:0.3rem;">Copy Link</button>
        <button class="btn secondary" data-rename="${it.id}" style="width:100%;margin-bottom:0.3rem;">Rename</button>
        <button class="btn" data-del="${it.id}" style="width:100%;">Delete</button>
      </div>
    `;
    historyList.appendChild(row);
  }

  historyList.onclick = async (e) => {
    const t = e.target;
    if (t.dataset.view) {
      window.open(`./viewer.html?id=${t.dataset.view}`, '_blank');
    } else if (t.dataset.copy) {
      const link = `${location.origin}/viewer.html?id=${t.dataset.copy}`;
      await navigator.clipboard.writeText(link);
      alert('Link copied!');
    } else if (t.dataset.rename) {
      const id = t.dataset.rename;
      const name = prompt('New name:');
      if (!name) return;
      await rename(id, name);
      await loadHistory(searchEl.value.trim());
    } else if (t.dataset.del) {
      const id = t.dataset.del;
      if (!confirm('Delete this item?')) return;
      await del(id);
      await loadHistory(searchEl.value.trim());
    }
  };
}

async function rename(id, name) {
  const token = await getSessionToken();
  const resp = await fetch(`http://localhost:5500/api/uploads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ name })
  });
  if (!resp.ok) {
    const d = await resp.json();
    alert(d.error || 'Rename failed');
  }
}

async function del(id) {
  const token = await getSessionToken();
  const resp = await fetch(`http://localhost:5500/api/uploads/${id}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!resp.ok) {
    const d = await resp.json();
    alert(d.error || 'Delete failed');
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#039;'}[c]));
}

btnSearch.onclick = () => loadHistory(searchEl.value.trim());

requireUser().then(() => loadHistory());
