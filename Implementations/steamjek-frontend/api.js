const API_BASE_URL = 'http://localhost:3000/api';

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
      return null;
    }

    return data;
  } catch (err) {
    showToast('Network error. Is the backend running?', 'e');
    return null;
  }
}

// Global Auth State Management
const Auth = {
  login: async (email, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data) {
      localStorage.setItem('steamjek_token', data.token);
      localStorage.setItem('steamjek_user', JSON.stringify(data.user));
      // Trigger sidebar update
      updateSidebarUser();
    }
    return data;
  },
  
  register: async (name, email, password, address) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, address }),
    });
    return data;
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
    const user = await apiFetch('/auth/profile');
    if (user) {
      localStorage.setItem('steamjek_user', JSON.stringify(user));
      updateSidebarUser();
    }
    return user;
  },

  isAuthenticated: () => !!localStorage.getItem('steamjek_token')
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
      <div class="user-pill" style="cursor:pointer" onclick="location.href='page7_profile.html'">
        <div class="u-av">${initials}</div>
        <div>
          <div class="u-name">${user.name}</div>
          <div class="u-bal">$${parseFloat(user.balance || 0).toFixed(2)}</div>
        </div>
      </div>`;
  } else {
    pill.innerHTML = `
      <a href="page1_store.html" class="user-pill" style="cursor:pointer">
        <div class="u-av">?</div>
        <div>
          <div class="u-name">Not Logged In</div>
          <div class="u-bal">Click to login</div>
        </div>
      </a>`;
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
      const cartCounts = document.querySelectorAll('.cart-dot, #cart-count, #cart-badge');
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
  
  isInstalled: async (gameId) => {
    try {
      if (typeof window.require === 'function') {
        const { ipcRenderer } = window.require('electron');
        return await ipcRenderer.invoke('game:check-installed', gameId);
      }
    } catch (e) { console.error(e); }
    return localStorage.getItem(`installed_${gameId}`) === 'true';
  },

  downloadGame: async (gameId, title) => {
    try {
      const token = localStorage.getItem('steamjek_token');
      const resp = await fetch(`${API_BASE_URL}/games/${gameId}/download`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/plain'
        }
      });
      
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ message: 'Download failed' }));
        showToast(errData.message || 'Download failed', 'e');
        return false;
      }

      const content = await resp.text();

      // Use Electron IPC for real saving if available
      if (typeof window.require === 'function') {
        const { ipcRenderer } = window.require('electron');
        const res = await ipcRenderer.invoke('game:download', { gameId, title, content });
        return res.success;
      }

      // Fallback for browser/legacy
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      console.error('Download logic error:', err);
      showToast('Download error', 'e');
      return false;
    }
  },

  deleteGame: async (gameId) => {
    try {
      if (typeof window.require === 'function') {
        const { ipcRenderer } = window.require('electron');
        const res = await ipcRenderer.invoke('game:delete', gameId);
        return res.success;
      }
    } catch (e) {
      console.error('Real file deletion failed:', e);
    }
    return true; // Fallback
  },

  getGamesFolder: async () => {
    try {
      if (typeof window.require === 'function') {
        const { ipcRenderer } = window.require('electron');
        return await ipcRenderer.invoke('game:get-path');
      }
    } catch (e) { console.error(e); }
    return 'Managed Folder';
  },

  openGamesFolder: async () => {
    try {
      if (typeof window.require === 'function') {
        const { ipcRenderer } = window.require('electron');
        await ipcRenderer.invoke('game:open-folder');
      }
    } catch (e) { console.error(e); }
  }
};

// Auto update sidebar and badges on every page that includes this script
document.addEventListener('DOMContentLoaded', () => {
  updateSidebarUser();
  updateBadges();
});
