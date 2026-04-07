// Determine base URL dynamically depending on whether we're on Vercel or localhost
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
const API_BASE_URL = isLocalhost ? 'http://localhost:3000/api' : '/api';

// Utility for making authenticated fetch requests
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('steamjek_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || 'Request failed', 'e');
      throw new Error(data.message || 'Request failed'); // Throw so caller knows it failed
    }

    return data;
  } catch (err) {
    if (!err.message || err.message === 'Failed to fetch') {
      showToast('Network error. Is the backend running?', 'e');
    }
    throw err;
  }
}

// Global Auth State Management
const Auth = {
  login: async (email, password) => {
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data && data.token) {
        localStorage.setItem('steamjek_token', data.token);
        localStorage.setItem('steamjek_user', JSON.stringify(data.user));
        updateSidebarUser();
        return data;
      }
    } catch (err) {
      return null; // Return null on failure instead of crashing the app silently
    }
  },
  
  register: async (name, email, password, address) => {
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, address }),
      });
      return data;
    } catch (err) {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('steamjek_token');
    localStorage.removeItem('steamjek_user');
    window.location.href = 'page1_store.html';
  },

  getUser: () => {
    const userStr = localStorage.getItem('steamjek_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  refreshUser: async () => {
    if (!Auth.isAuthenticated()) return null;
    try {
      const user = await apiFetch('/auth/profile');
      if (user) {
        localStorage.setItem('steamjek_user', JSON.stringify(user));
        updateSidebarUser();
      }
      return user;
    } catch(err) {
      return null;
    }
  },

  isAuthenticated: () => !!localStorage.getItem('steamjek_token'),

  // --- GLOBAL AUTH MODAL METHODS ---
  showModal: () => {
    const overlay = document.getElementById('g-auth-overlay');
    if (overlay) overlay.style.display = 'flex';
  },

  closeModal: () => {
    const overlay = document.getElementById('g-auth-overlay');
    if (overlay) overlay.style.display = 'none';
  },

  switchTab: (tab) => {
    document.getElementById('g-tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('g-tab-register').classList.toggle('active', tab === 'register');
    document.getElementById('g-login-form').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('g-register-form').style.display = tab === 'register' ? 'block' : 'none';
  },

  handleLoginSubmit: async (e) => {
    e.preventDefault();
    const email = document.getElementById('g-login-email').value;
    const pass = document.getElementById('g-login-password').value;
    const res = await Auth.login(email, pass);
    if (res) {
      Auth.closeModal();
      showToast('Successfully logged in!', 's');
      document.getElementById('g-login-password').value = '';
      setTimeout(() => {
        if (window.initPage) { window.initPage(); } else { window.location.reload(); }
      }, 500);
    }
  },

  handleRegisterSubmit: async (e) => {
    e.preventDefault();
    const name = document.getElementById('g-reg-username').value;
    const email = document.getElementById('g-reg-email').value;
    const pass = document.getElementById('g-reg-password').value;
    const addr = document.getElementById('g-reg-address').value;
    const res = await Auth.register(name, email, pass, addr);
    if (res) {
      showToast('Account created! Logging in...', 's');
      const loginRes = await Auth.login(email, pass);
      if (loginRes) {
        Auth.closeModal();
        if (window.initPage) window.initPage();
        else window.location.reload();
      }
    }
  }
};

// Updates the sidebar user pill with real user data
function updateSidebarUser() {
  const user = Auth.getUser();
  const pill = document.getElementById('user-context');
  if (!pill) return;

  if (user) {
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    // Fetch latest balance from backend if possible, or use local
    pill.innerHTML = `
      <div class="user-pill" style="cursor:pointer" onclick="Auth.logout()">
        <div class="u-av">${initials}</div>
        <div>
          <div class="u-name">${user.name}</div>
          <div class="u-bal">$${parseFloat(user.balance || 0).toFixed(2)}</div>
        </div>
      </div>`;
  } else {
    pill.innerHTML = `
      <div class="user-pill" style="cursor:pointer" onclick="Auth.showModal()">
        <div class="u-av">?</div>
        <div>
          <div class="u-name">Not Logged In</div>
          <div class="u-bal">Click to login</div>
        </div>
      </div>`;
  }
}

// Global Toast Utility
function showToast(msg, type = 'i') {
  let container = document.getElementById('toasts');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toasts';
    container.className = 'toasts';
    document.body.appendChild(container);
  }
  
  const el = document.createElement('div');
  el.className = `tst ${type}`;
  let icon = 'ℹ️';
  if (type === 's') icon = '✅';
  if (type === 'r') icon = '🗑️';
  if (type === 'e') icon = '❌'; 
  
  el.innerHTML = `<span>${icon}</span>${msg}`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// Updates Cart and Wishlist badges across the sidebar and topbar
async function updateBadges() {
  if (!Auth.isAuthenticated()) return;

  try {
    // We could fetch both in parallel
    const [cart, wish] = await Promise.all([
      apiFetch('/cart').catch(() => []),
      apiFetch('/wishlist').catch(() => [])
    ]);

    if (cart) {
      const cartCounts = document.querySelectorAll('.cart-dot, #cart-count, #cart-badge, #cart-badge-top');
      cartCounts.forEach(el => el.textContent = cart.length);
      // Also update sidebar cart badge if exists
      const sbCart = document.querySelector('a[href="page3_cart.html"] .nav-badge');
      if (sbCart) sbCart.textContent = cart.length;
    }

    if (wish) {
      const wishCounts = document.querySelectorAll('#nb, #wish-count');
      wishCounts.forEach(el => el.textContent = wish.length);
      // Also update sidebar wishlist badge if exists
      const sbWish = document.querySelector('a[href="page5_wishlist.html"] .nav-badge');
      if (sbWish) sbWish.textContent = wish.length;
    }
  } catch (err) {
    console.error("Error updating badges:", err);
  }
}

// Marketplace API Functions
const Marketplace = {
  getListings: () => apiFetch('/market/listings'),
  getMyItems: () => apiFetch('/market/my-items'),
  getMyListings: () => apiFetch('/market/my-listings'),
  createListing: (item_type_id, quantity, price) => apiFetch('/market/listings', {
    method: 'POST',
    body: JSON.stringify({ item_type_id, quantity, price })
  }),
  buyItem: (listingId) => apiFetch(`/market/buy/${listingId}`, {
    method: 'POST'
  })
};

// Library & Download API Functions
const Library = {
  getPurchases: () => apiFetch('/purchases'),
  downloadGame: async (gameId) => {
    const token = localStorage.getItem('steamjek_token');
    const resp = await fetch(`${API_BASE_URL}/games/${gameId}/download`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resp.ok) {
      showToast('Download failed', 'e');
      return false;
    }
    const blob = await resp.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game_${gameId}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    return true;
  }
};

// Point Shop API Functions
const PointShop = {
  getPoints:    () => apiFetch('/points'),
  getRewards:   () => apiFetch('/points/rewards'),
  getMyRewards: () => apiFetch('/points/my-rewards'),
  redeemReward: (rewardId) => apiFetch(`/points/redeem/${rewardId}`, { method: 'POST' }),
  equipReward:  (rewardId) => apiFetch(`/points/equip/${rewardId}`,  { method: 'POST' })
};

// Community Hub API Functions
const Community = {
  getThreads:   (gameId, q, tag) => {
    const params = new URLSearchParams({ game_id: gameId });
    if (q)   params.set('q',   q);
    if (tag && tag !== 'All') params.set('tag', tag);
    return apiFetch(`/community/threads?${params}`);
  },
  getThread:    (threadId) => apiFetch(`/community/threads/${threadId}`),
  createThread: (payload)  => apiFetch('/community/threads',             { method: 'POST', body: JSON.stringify(payload) }),
  getReplies:   (threadId) => apiFetch(`/community/threads/${threadId}/replies`),
  createReply:  (threadId, content) => apiFetch(`/community/threads/${threadId}/replies`, { method: 'POST', body: JSON.stringify({ content }) }),
  likeThread:   (threadId) => apiFetch(`/community/threads/${threadId}/like`, { method: 'POST' })
};

// Auto update sidebar and badges on every page that includes this script
document.addEventListener('DOMContentLoaded', () => {
  updateSidebarUser();
  updateBadges();
});
function injectAuthModal() {
  if (document.getElementById('g-auth-overlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'g-modal-overlay';
  overlay.id = 'g-auth-overlay';
  overlay.innerHTML = `
    <div class="g-modal">
      <div class="g-modal-head">
        <h3 class="g-modal-title" id="auth-title">Welcome to SteamJek</h3>
        <button class="g-close-btn" onclick="Auth.closeModal()">✕</button>
      </div>
      <div class="g-modal-body">
        <div class="g-auth-tabs">
          <div class="g-auth-tab active" id="g-tab-login" onclick="Auth.switchTab('login')">Login</div>
          <div class="g-auth-tab" id="g-tab-register" onclick="Auth.switchTab('register')">Register</div>
        </div>
        <form id="g-login-form" onsubmit="Auth.handleLoginSubmit(event)">
          <div class="g-form-group">
            <label class="g-form-label">Email</label>
            <input type="email" class="g-form-input" id="g-login-email" required>
          </div>
          <div class="g-form-group">
            <label class="g-form-label">Password</label>
            <input type="password" class="g-form-input" id="g-login-password" required>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: 10px;">Login</button>
        </form>
        <form id="g-register-form" style="display: none;" onsubmit="Auth.handleRegisterSubmit(event)">
          <div class="g-form-group">
            <label class="g-form-label">Username</label>
            <input type="text" class="g-form-input" id="g-reg-username" required>
          </div>
          <div class="g-form-group">
            <label class="g-form-label">Email</label>
            <input type="email" class="g-form-input" id="g-reg-email" required>
          </div>
          <div class="g-form-group">
            <label class="g-form-label">Password</label>
            <input type="password" class="g-form-input" id="g-reg-password" required>
          </div>
           <div class="g-form-group">
            <label class="g-form-label">Address</label>
            <input type="text" class="g-form-input" id="g-reg-address" required>
          </div>
          <button type="submit" class="btn btn-purple" style="width: 100%; justify-content: center; margin-top: 10px;">Create Account</button>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes modalOverlayFade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes modalPop { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .g-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; z-index: 9999; animation: modalOverlayFade 0.25s ease; }
    .g-modal { background: var(--panel, #131b2e); border: 1px solid var(--border, #1e2d4a); border-radius: 16px; width: 100%; max-width: 400px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); animation: modalPop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .g-modal-head { padding: 20px 24px; border-bottom: 1px solid var(--border, #1e2d4a); display: flex; align-items: center; justify-content: space-between; }
    .g-modal-title { font-family: var(--fw, 'Rajdhani'), sans-serif; font-size: 20px; font-weight: 700; color: #fff; margin:0;}
    .g-close-btn { background: none; border: none; color: var(--muted, #64748b); cursor: pointer; font-size: 16px; transition: color 0.2s; }
    .g-close-btn:hover { color: #fff; }
    .g-modal-body { padding: 24px; }
    .g-auth-tabs { display: flex; gap: 4px; background: var(--bg2, #0c0f1a); padding: 4px; border-radius: 8px; margin-bottom: 24px; }
    .g-auth-tab { flex: 1; padding: 8px 0; text-align: center; font-size: 14px; font-weight: 600; color: var(--muted2, #94a3b8); cursor: pointer; border-radius: 6px; transition: all 0.2s; }
    .g-auth-tab.active { background: var(--panel2, #1a2540); color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .g-form-group { margin-bottom: 16px; }
    .g-form-label { display: block; font-size: 12px; font-weight: 600; color: var(--muted, #64748b); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .g-form-input { width: 100%; background: var(--bg2, #0c0f1a); border: 1px solid var(--border, #1e2d4a); border-radius: 8px; padding: 10px 14px; color: var(--text, #e2e8f0); font-family: var(--fm, 'JetBrains Mono'); font-size: 14px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
    .g-form-input:focus { border-color: var(--accent, #00d4ff); }
    .btn-purple { background: var(--accent2, #7c3aed); color: #fff; display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: 8px; border: none; cursor: pointer; font-family: var(--fb, 'Exo 2'); font-size: 13px; font-weight: 600; transition: all .2s; }
    .btn-purple:hover { background: #8b5cf6; box-shadow: 0 0 20px rgba(124, 58, 237, 0.3); }
    
    /* OVERRIDE GLOBAL TOASTS TO BOTTOM RIGHT ABOVE EVERYTHING */
    .toasts { position: fixed !important; bottom: 24px !important; right: 24px !important; left: auto !important; top: auto !important; z-index: 999999 !important; display: flex !important; flex-direction: column !important; gap: 8px !important; pointer-events: none; }
    .toasts .tst { animation: toastSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards !important; pointer-events: all; }
    @keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  `;
  document.head.appendChild(style);
}
window.addEventListener('DOMContentLoaded', injectAuthModal);


// Inject hamburger icon and responsive sidebar toggle logic
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.innerHTML = `
    .layout {
      position: relative;
      overflow-x: hidden; /* Avoid horizontal scroll during animations */
    }
    .sidebar { 
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
      z-index: 200 !important; 
      position: fixed;
      top: 0; left: 0; bottom: 0;
      width: 230px;
    }
    .main { 
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
      min-width: 0; /* CRITICAL: Allows grid/flexbox to squeeze properly */
      flex: 1;
      margin-left: 230px;
      box-sizing: border-box;
    }
    
    /* Desktop toggle */
    .layout.sidebar-hidden .sidebar {
      transform: translateX(-100%);
    }
    .layout.sidebar-hidden .main {
      margin-left: 0;
    }

    /* Mobile handling */
    @media (max-width: 800px) {
      .sidebar {
        transform: translateX(-100%);
      }
      .main {
        margin-left: 0 !important; /* Main always full width */
      }
      .layout.sidebar-active .sidebar {
        transform: translateX(0);
        box-shadow: 4px 0 20px rgba(0,0,0,0.6);
      }
      /* Semi-transparent overlay backdrop for mobile when active */
      .layout.sidebar-active::before {
        content: "";
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.5);
        z-index: 150;
      }
    }

    .hamburger-btn {
      background: none;
      border: none;
      color: var(--text, #fff);
      font-size: 24px;
      cursor: pointer;
      margin-right: 15px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    }
    .hamburger-btn:hover {
      color: var(--accent, #00d4ff);
    }
  `;
  document.head.appendChild(style);

  const topbar = document.querySelector('.topbar');
  const sidebar = document.querySelector('.sidebar');
  const main = document.querySelector('.main');
  let layout = document.querySelector('.layout');

  if (topbar && sidebar && main) {
    if (!layout) { layout = document.body; } // Fallback

    const titleDiv = topbar.querySelector('.tb-title');
    const hamburger = document.createElement('button');
    hamburger.innerHTML = '☰';
    hamburger.className = 'hamburger-btn';
    
    hamburger.onclick = () => {
      const isMobile = window.innerWidth <= 800;
      if (isMobile) {
        layout.classList.toggle('sidebar-active');
        layout.classList.remove('sidebar-hidden');
      } else {
        layout.classList.toggle('sidebar-hidden');
        layout.classList.remove('sidebar-active');
      }
    };
    
    // Close sidebar on mobile when clicking the main content area overlay
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 800 && layout.classList.contains('sidebar-active')) {
         if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
           layout.classList.remove('sidebar-active');
         }
      }
    });

    if (titleDiv) {
      const wrap = document.createElement('div');
      wrap.style.display = 'flex';
      wrap.style.alignItems = 'center';
      titleDiv.parentNode.insertBefore(wrap, titleDiv);
      wrap.appendChild(hamburger);
      wrap.appendChild(titleDiv);
    } else {
      topbar.insertBefore(hamburger, topbar.firstChild);
    }
  }
});
