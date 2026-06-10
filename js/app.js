// FlixoraPlay — Version 3 — API-based data layer (Cloudflare D1)

// ── API Client ─────────────────────────────────────────────
const API_BASE = '/api';

const API = {
  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },
  async getCompetitions(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.sort) params.append('sort', filters.sort);

    const url = params.toString() ? `${API_BASE}/competitions?${params.toString()}` : `${API_BASE}/competitions`;
    const r = await fetch(url, {
      headers: this.getHeaders()
    });
    if (!r.ok) throw new Error('Failed to load competitions');
    return r.json();
  },
  async getCompetition(id) {
    const r = await fetch(`${API_BASE}/competitions/${id}`, {
      headers: this.getHeaders()
    });
    if (!r.ok) throw new Error('Competition not found');
    return r.json();
  },
  async createCompetition(data) {
    const r = await fetch(`${API_BASE}/competitions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error('Failed to create competition');
    return r.json();
  },
  async updateCompetition(id, data) {
    const r = await fetch(`${API_BASE}/competitions/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error('Failed to update competition');
    return r.json();
  },
  async updateEntry(id, data) {
    const r = await fetch(`${API_BASE}/entries/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error('Failed to update entry');
    return r.json();
  },
  async getEntries(competitionId = null) {
    const url = competitionId
      ? `${API_BASE}/entries?competitionId=${competitionId}`
      : `${API_BASE}/entries`;
    const r = await fetch(url, {
      headers: this.getHeaders()
    });
    if (!r.ok) throw new Error('Failed to load entries');
    return r.json();
  },
  async submitEntry(data) {
    const r = await fetch(`${API_BASE}/entries`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error('Failed to submit entry');
    return r.json();
  },
  async vote(entryId) {
    // Use a fingerprint stored in localStorage as voter identity
    const voterId = getVoterId();
    const r = await fetch(`${API_BASE}/votes`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ entryId, voterId })
    });
    if (r.status === 409) throw new Error('Already voted');
    if (!r.ok) throw new Error('Failed to cast vote');
    return r.json();
  },
  async getLeaderboard() {
    const r = await fetch(`${API_BASE}/leaderboard`, {
      headers: this.getHeaders()
    });
    if (!r.ok) throw new Error('Failed to load leaderboard');
    return r.json();
  },
  async register(email, password, username) {
    const r = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', email, password, username })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },
  async login(email, password) {
    const r = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Login failed');
    return data;
  },
  async loginGoogle(credential) {
    const r = await fetch(`${API_BASE}/auth-google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Google Login failed');
    return data;
  },
  async getNotifications() {
    const r = await fetch(`${API_BASE}/notifications`, {
      headers: this.getHeaders()
    });
    if (!r.ok) throw new Error('Failed to load notifications');
    return r.json();
  },
  async markNotificationRead(id) {
    const r = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'PUT',
      headers: this.getHeaders()
    });
    if (!r.ok) throw new Error('Failed to update notification');
    return r.json();
  },
  async markAllNotificationsRead() {
    const r = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: this.getHeaders()
    });
    if (!r.ok) throw new Error('Failed to mark all read');
    return r.json();
  }
};

// ── Voter ID (anonymous, stored locally) ──────────────────
function getVoterId() {
  const key = 'flixora_voter_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'voter_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem(key, id);
  }
  return id;
}

// ── Legacy Store shim (keeps old localStorage code working) ─
// This shim allows pages that haven't been migrated yet to still function.
const Store = {
  get(key, fallback = []) {
    try {
      const v = localStorage.getItem('flixora_' + key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    localStorage.setItem('flixora_' + key, JSON.stringify(value));
  },
  seed() {} // No-op — seed data is in D1
};

// ── ID generator ──────────────────────────────────────────
function genId(prefix = 'id') {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

// ── Toast notifications ───────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toastIcons = {
    success: '<svg data-lucide="check-circle" style="width:16px;height:16px;"></svg>',
    error:   '<svg data-lucide="alert-circle" style="width:16px;height:16px;"></svg>',
    info:    '<svg data-lucide="info" style="width:16px;height:16px;"></svg>',
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `${toastIcons[type] || toastIcons.info} <span>${message}</span>`;
  container.appendChild(toast);
  if (typeof lucide !== 'undefined') lucide.createIcons({ el: toast });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(110%)';
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => toast.remove(), 320);
  }, duration);
}

// ── URL helpers ───────────────────────────────────────────
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}
function navigate(url) { window.location.href = url; }

// ── Date helpers ──────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function daysRemaining(deadlineStr) {
  const today = new Date();
  const deadline = new Date(deadlineStr);
  const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
  return diff;
}
function deadlinePercent(created, deadline) {
  const start = new Date(created);
  const end   = new Date(deadline);
  const now   = new Date();
  const total = end - start;
  const elapsed = now - start;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

// ── Active nav link ───────────────────────────────────────
function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ── Session helpers ───────────────────────────────────────
function getToken() {
  return localStorage.getItem('flixora_token');
}
function getSession() {
  return Store.get('session', null);
}
function setSession(data) {
  // If the payload includes a token, store it separately
  if (data.token) {
    localStorage.setItem('flixora_token', data.token);
  }
  // Extract user info if nested, else use data itself
  const user = data.user || data;
  Store.set('session', user);
}
function clearSession() {
  localStorage.removeItem('flixora_session');
  localStorage.removeItem('flixora_token');
}
function signOut() {
  clearSession();
  showToast('Signed out successfully.', 'info');
  setTimeout(() => navigate('index.html'), 600);
}

// ── Auth-aware nav ────────────────────────────────────────
function updateNavForAuth() {
  const session = getSession();
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;

  if (session && session.id) {
    const initial = (session.username || session.name || session.email || '?')[0].toUpperCase();
    navActions.innerHTML = `
      <a href="create-competition.html" class="btn btn-outline btn-sm">
        <svg data-lucide="plus-circle"></svg> Host
      </a>
      <div style="display:flex;align-items:center;gap:10px;">
        <!-- Notifications Bell -->
        <div class="notification-dropdown-container" style="position:relative;">
          <button class="btn btn-ghost btn-sm" id="nav-notifications-bell" style="gap:4px;padding:6px 10px;position:relative;" title="Notifications">
            <svg data-lucide="bell"></svg>
            <span class="notification-badge" id="nav-notifications-badge" style="display:none;position:absolute;top:2px;right:2px;background:var(--red);border-radius:50%;width:8px;height:8px;"></span>
          </button>
          <div class="notification-dropdown" id="nav-notifications-dropdown" style="display:none;position:absolute;top:100%;right:0;width:300px;background:rgba(17,22,39,0.98);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--glass-border);border-radius:var(--radius-md);margin-top:8px;padding:12px;box-shadow:var(--shadow-lg);z-index:1100;">
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--glass-border);padding-bottom:8px;margin-bottom:8px;">
              <span style="font-weight:600;font-size:0.88rem;">Notifications</span>
              <button onclick="handleMarkAllReadNav(event)" style="font-size:0.75rem;background:none;border:none;color:var(--purple-light);cursor:pointer;padding:0;font-weight:500;">Mark all read</button>
            </div>
            <div id="nav-notifications-list" style="max-height:240px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;text-align:left;">
              <div style="text-align:center;padding:12px;color:var(--text-3);font-size:0.8rem;">No new notifications</div>
            </div>
            <div style="text-align:center;border-top:1px solid var(--glass-border);padding-top:8px;margin-top:8px;">
              <a href="notifications.html" style="font-size:0.8rem;color:var(--purple-light);font-weight:600;">View All Notifications</a>
            </div>
          </div>
        </div>

        <a href="profile.html?id=${session.id}" style="display:flex;align-items:center;gap:8px;text-decoration:none;" title="View Profile">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--purple),#7dd3fc);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.82rem;color:#fff;flex-shrink:0;cursor:pointer;transition:box-shadow 0.2s;" onmouseover="this.style.boxShadow='0 0 0 2px var(--purple-light)'" onmouseout="this.style.boxShadow='none'">${initial}</div>
        </a>
        <a href="settings.html" class="btn btn-ghost btn-sm" style="gap:4px;padding:6px 10px;" title="Settings">
          <svg data-lucide="settings"></svg>
        </a>
        <button class="btn btn-ghost btn-sm" onclick="signOut()" style="gap:4px;">
          <svg data-lucide="log-out"></svg> Sign Out
        </button>
      </div>`;

    setupNotificationBell();
  } else {
    // Keep default nav — ensure Host + Sign In are shown
    navActions.innerHTML = `
      <a href="create-competition.html" class="btn btn-outline btn-sm">
        <svg data-lucide="plus-circle"></svg> Host
      </a>
      <a href="login.html" class="btn btn-primary btn-sm">
        <svg data-lucide="log-in"></svg> Sign In
      </a>`;
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ── Profile link helper ───────────────────────────────────
function profileLink(userId, displayName) {
  return `<a href="profile.html?id=${userId}" style="color:inherit;text-decoration:none;" onmouseover="this.style.color='var(--purple-light)'" onmouseout="this.style.color='inherit'">${displayName}</a>`;
}

// ── Tab switcher ──────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tabs').forEach(tabGroup => {
    const buttons = tabGroup.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll(`.tab-panel[data-tab="${target}"]`).forEach(p => p.classList.add('active'));
        document.querySelectorAll(`.tab-panel:not([data-tab="${target}"])`).forEach(p => p.classList.remove('active'));
      });
    });
    if (buttons.length > 0) buttons[0].click();
  });
}

// ── Nav scroll effect ─────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 10);
});

// ── Video Embed Utilities ─────────────────────────────────
function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function getVimeoId(url) {
  if (!url) return null;
  const regExp = /vimeo\.com\/(?:video\/)?([0-9]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

function getVideoThumbnail(url) {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  const vimId = getVimeoId(url);
  if (vimId) {
    // Return a default gradient/play button card for Vimeo (since Vimeo API is async)
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%238b5cf6"/><stop offset="100%" stop-color="%233b82f6"/></linearGradient></defs><rect width="300" height="200" fill="url(%23g)"/><polygon points="130,75 180,100 130,125" fill="%23fff"/></svg>`;
  }
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%231e1e2f"/><circle cx="150" cy="100" r="30" fill="%238b5cf6" opacity="0.8"/><polygon points="142,88 165,100 142,112" fill="%23fff"/></svg>`;
}

function getVideoEmbed(url) {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }
  const vimId = getVimeoId(url);
  if (vimId) {
    return `<iframe src="https://player.vimeo.com/video/${vimId}?autoplay=1&badge=0&autopause=0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }
  return `<div class="empty-state" style="padding:20px;"><div class="icon"><svg data-lucide="alert-triangle"></svg></div><p>Unsupported video format. <a href="${url}" target="_blank">Open directly</a></p></div>`;
}

// Helper to toggle inline video player in entry list
function toggleInlinePlayer(entryId, url) {
  const containerId = `video-player-${entryId}`;
  let container = document.getElementById(containerId);

  if (container) {
    // If already open, close it
    container.remove();
    return;
  }

  // Close any other open players first to avoid clutter
  document.querySelectorAll('.video-player-container').forEach(el => el.remove());

  // Insert player container below the entry card body (or inline)
  const entryCard = document.getElementById(`entry-card-${entryId}`);
  if (!entryCard) return;

  container = document.createElement('div');
  container.id = containerId;
  container.className = 'video-player-container';
  container.innerHTML = getVideoEmbed(url);

  // Insert right before the footer
  const footer = entryCard.querySelector('.entry-footer');
  if (footer) {
    entryCard.insertBefore(container, footer);
  } else {
    entryCard.appendChild(container);
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ── Init on load ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  initTabs();
  updateNavForAuth();

  // Dynamic mobile menu injection & handling
  const navInner = document.querySelector('.nav-inner');
  const navLinks = document.querySelector('.nav-links');

  if (navInner && navLinks) {
    // Create hamburger button if it doesn't exist
    if (!document.getElementById('nav-hamburger')) {
      const hamburger = document.createElement('button');
      hamburger.id = 'nav-hamburger';
      hamburger.className = 'nav-hamburger';
      hamburger.setAttribute('aria-label', 'Toggle menu');
      hamburger.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`;
      
      // Insert right after the logo
      const logo = navInner.querySelector('.nav-logo');
      if (logo) {
        logo.after(hamburger);
      } else {
        navInner.prepend(hamburger);
      }

      hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        navLinks.classList.toggle('active');
        // Toggle hamburger icon between menu and X
        if (navLinks.classList.contains('active')) {
          hamburger.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>`;
        } else {
          hamburger.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`;
        }
      });

      // Close menu if clicking outside
      document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
          navLinks.classList.remove('active');
          hamburger.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`;
        }
      });
    }
  }
});

// ── Notifications Helper Implementation ──────────────────
let notificationPollInterval = null;

function setupNotificationBell() {
  const bell = document.getElementById('nav-notifications-bell');
  const dropdown = document.getElementById('nav-notifications-dropdown');
  if (!bell || !dropdown) return;

  // Toggle dropdown
  bell.addEventListener('click', (e) => {
    e.stopPropagation();
    const isShowing = dropdown.style.display === 'block';
    dropdown.style.display = isShowing ? 'none' : 'block';
    if (!isShowing) {
      refreshNotificationsNav();
    }
  });

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && !bell.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  // Initial fetch & setup polling (every 60s)
  refreshNotificationsNav();
  clearInterval(notificationPollInterval);
  notificationPollInterval = setInterval(refreshNotificationsNav, 60000);
}

async function refreshNotificationsNav() {
  const badge = document.getElementById('nav-notifications-badge');
  const list = document.getElementById('nav-notifications-list');
  if (!badge || !list) return;

  try {
    const { notifications, unreadCount } = await API.getNotifications();

    // Show/hide unread badge
    if (unreadCount > 0) {
      badge.style.display = 'block';
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      // Add text styling if unreadCount > 0
      badge.style.width = '14px';
      badge.style.height = '14px';
      badge.style.fontSize = '9px';
      badge.style.fontWeight = '700';
      badge.style.lineHeight = '14px';
      badge.style.textAlign = 'center';
      badge.style.color = '#fff';
      badge.style.top = '-2px';
      badge.style.right = '-2px';
    } else {
      badge.style.display = 'none';
    }

    if (!notifications || notifications.length === 0) {
      list.innerHTML = `<div style="text-align:center;padding:12px;color:var(--text-3);font-size:0.8rem;">No notifications yet</div>`;
      return;
    }

    // List top 5 notifications
    const recent = notifications.slice(0, 5);
    list.innerHTML = recent.map(notif => {
      const typeIcons = {
        submission: 'video',
        vote: 'thumbs-up',
        results: 'award'
      };
      const icon = typeIcons[notif.type] || 'bell';
      const readStyle = notif.read ? 'opacity: 0.6;' : 'font-weight: 500; border-left: 2px solid var(--purple);';

      return `
        <div onclick="handleNotificationClickNav('${notif.id}', '${notif.link || '#'}')" style="padding:8px;border-radius:var(--radius-sm);background:rgba(255,255,255,0.02);border-bottom:1px solid rgba(255,255,255,0.03);cursor:pointer;${readStyle} transition:background var(--t);display:flex;align-items:flex-start;gap:8px;" onmouseover="this.style.background='var(--glass-2)'" onmouseout="this.style.background='rgba(255,255,255,0.02)'">
          <div style="background:var(--purple-dim);color:var(--purple-light);padding:4px;border-radius:4px;display:flex;align-items:center;justify-content:center;margin-top:2px;">
            <svg data-lucide="${icon}" style="width:13px;height:13px;"></svg>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.78rem;color:var(--text);margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${notif.title}</div>
            <div style="font-size:0.72rem;color:var(--text-3);line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${notif.message || ''}</div>
          </div>
        </div>`;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons({ el: list });
  } catch (err) {
    console.error('Failed to refresh notifications navigation:', err);
  }
}

async function handleMarkAllReadNav(e) {
  e.stopPropagation();
  try {
    await API.markAllNotificationsRead();
    showToast('All notifications marked as read', 'success');
    refreshNotificationsNav();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleNotificationClickNav(id, link) {
  try {
    await API.markNotificationRead(id);
    if (link && link !== '#') {
      navigate(link);
    } else {
      refreshNotificationsNav();
    }
  } catch (err) {
    console.error('Failed to mark notification read:', err);
    if (link && link !== '#') navigate(link);
  }
}


