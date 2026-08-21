/**
 * Auth UI — Login, Register, Org Switcher, User Menu Modals
 * All UI logic for authentication flows, rendered as overlays.
 */

import { Auth, Session } from './auth.js';

// ---- Public API ----

export const AuthUI = {
  /**
   * Show auth gate if user is not logged in.
   * Calls onSuccess() when the user is authenticated.
   */
  guard(onSuccess) {
    if (Session.isLoggedIn()) {
      onSuccess();
      return;
    }
    _showAuthModal(onSuccess);
  },

  /**
   * Show the org switcher / user menu popover.
   */
  showUserMenu(anchorEl, onOrgSwitch) {
    _showUserMenu(anchorEl, onOrgSwitch);
  },

  /**
   * Show the "create new organization" modal.
   */
  showCreateOrgModal(onCreated) {
    _showCreateOrgModal(onCreated);
  },

  /**
   * Render the sidebar org badge (name + avatar).
   */
  getSidebarOrgBadgeHTML() {
    const user = Auth.currentUser();
    const org = Auth.currentOrg();
    if (!user || !org) return '';

    const initials = org.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    return `
      <button type="button" id="btn-user-menu" class="org-badge-btn" title="Switch organization or sign out">
        <div class="org-avatar" style="background: ${org.logoColor};">${initials}</div>
        <div class="org-badge-info">
          <div class="org-badge-name">${_esc(org.name)}</div>
          <div class="org-badge-user">${_esc(user.name)}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
      </button>
    `;
  }
};

// ---- Auth Modal (Login / Register) ----

function _showAuthModal(onSuccess) {
  const overlay = document.createElement('div');
  overlay.id = 'auth-overlay';
  overlay.className = 'auth-overlay';
  overlay.innerHTML = _buildAuthModalHTML('login');
  document.body.appendChild(overlay);

  _bindAuthModal(overlay, onSuccess);
}

function _buildAuthModalHTML(mode) {
  const isLogin = mode === 'login';
  return `
    <div class="auth-card">
      <div class="auth-card-header">
        <div class="auth-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
        </div>
        <h1 class="auth-title">${isLogin ? 'Welcome back' : 'Create your account'}</h1>
        <p class="auth-subtitle">${isLogin ? 'Sign in to your InvoiceMaster workspace' : 'Start invoicing professionally in seconds'}</p>
      </div>

      <div class="auth-tabs" id="auth-tabs">
        <button type="button" class="auth-tab ${isLogin ? 'active' : ''}" data-tab="login">Sign In</button>
        <button type="button" class="auth-tab ${!isLogin ? 'active' : ''}" data-tab="register">Create Account</button>
      </div>

      <!-- LOGIN FORM -->
      <form id="auth-login-form" class="auth-form ${isLogin ? '' : 'hidden'}">
        <div class="auth-error" id="login-error" style="display:none;"></div>
        <div class="auth-field">
          <label for="login-email">Email address</label>
          <input type="email" id="login-email" autocomplete="email" placeholder="you@company.com" required>
        </div>
        <div class="auth-field">
          <label for="login-password">Password</label>
          <input type="password" id="login-password" autocomplete="current-password" placeholder="••••••••" required>
        </div>
        <button type="submit" class="auth-btn-primary" id="btn-login">
          <span class="auth-btn-label">Sign In</span>
          <span class="auth-btn-spinner hidden"></span>
        </button>
        <div class="auth-divider"><span>or continue with demo</span></div>
        <button type="button" class="auth-btn-secondary" id="btn-demo-login">
          ✨ Try Demo (no account needed)
        </button>
      </form>

      <!-- REGISTER FORM -->
      <form id="auth-register-form" class="auth-form ${!isLogin ? '' : 'hidden'}">
        <div class="auth-error" id="register-error" style="display:none;"></div>
        <div class="auth-field-row">
          <div class="auth-field">
            <label for="reg-name">Full name</label>
            <input type="text" id="reg-name" autocomplete="name" placeholder="Alex Johnson" required>
          </div>
          <div class="auth-field">
            <label for="reg-org">Organization name</label>
            <input type="text" id="reg-org" placeholder="Acme Studio" required>
          </div>
        </div>
        <div class="auth-field">
          <label for="reg-email">Work email</label>
          <input type="email" id="reg-email" autocomplete="email" placeholder="alex@acmestudio.com" required>
        </div>
        <div class="auth-field">
          <label for="reg-password">Password <span class="auth-hint">min. 8 characters</span></label>
          <input type="password" id="reg-password" autocomplete="new-password" placeholder="Create a strong password" required>
        </div>
        <div class="auth-field">
          <label for="reg-confirm">Confirm password</label>
          <input type="password" id="reg-confirm" autocomplete="new-password" placeholder="Repeat your password" required>
        </div>
        <button type="submit" class="auth-btn-primary" id="btn-register">
          <span class="auth-btn-label">Create Free Account</span>
          <span class="auth-btn-spinner hidden"></span>
        </button>
        <p class="auth-legal">By creating an account, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</p>
      </form>
    </div>
  `;
}

function _bindAuthModal(overlay, onSuccess) {
  const loginForm  = overlay.querySelector('#auth-login-form');
  const regForm    = overlay.querySelector('#auth-register-form');
  const loginErr   = overlay.querySelector('#login-error');
  const regErr     = overlay.querySelector('#register-error');

  // Tab switching
  overlay.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.tab;
      overlay.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === mode));
      loginForm.classList.toggle('hidden', mode !== 'login');
      regForm.classList.toggle('hidden', mode !== 'register');
      loginErr.style.display = 'none';
      regErr.style.display = 'none';
    });
  });

  // Login submit
  loginForm?.addEventListener('submit', e => {
    e.preventDefault();
    loginErr.style.display = 'none';
    const email    = loginForm.querySelector('#login-email')?.value || '';
    const password = loginForm.querySelector('#login-password')?.value || '';
    _setLoading(loginForm, true);

    setTimeout(() => {
      const result = Auth.login({ email, password });
      _setLoading(loginForm, false);
      if (result.success) {
        _removeOverlay(overlay);
        onSuccess();
      } else {
        loginErr.textContent = result.error;
        loginErr.style.display = 'flex';
      }
    }, 400);
  });

  // Register submit
  regForm?.addEventListener('submit', e => {
    e.preventDefault();
    regErr.style.display = 'none';
    const name     = regForm.querySelector('#reg-name')?.value || '';
    const orgName  = regForm.querySelector('#reg-org')?.value || '';
    const email    = regForm.querySelector('#reg-email')?.value || '';
    const password = regForm.querySelector('#reg-password')?.value || '';
    const confirm  = regForm.querySelector('#reg-confirm')?.value || '';

    if (password !== confirm) {
      regErr.textContent = 'Passwords do not match.';
      regErr.style.display = 'flex';
      return;
    }
    _setLoading(regForm, true);

    setTimeout(() => {
      const result = Auth.register({ name, email, password, orgName });
      _setLoading(regForm, false);
      if (result.success) {
        _removeOverlay(overlay);
        onSuccess();
      } else {
        regErr.textContent = result.error;
        regErr.style.display = 'flex';
      }
    }, 400);
  });

  // Demo login
  overlay.querySelector('#btn-demo-login')?.addEventListener('click', () => {
    // Auto-register a demo account
    const ts = Date.now().toString(36);
    const result = Auth.register({
      name: 'Demo User',
      email: `demo_${ts}@invoicemaster.app`,
      password: `demo_${ts}_pw`,
      orgName: 'My Business'
    });
    if (result.success) {
      _removeOverlay(overlay);
      onSuccess();
    }
  });
}

// ---- User Menu Popover ----

function _showUserMenu(anchorEl, onOrgSwitch) {
  // Remove any existing menu
  document.getElementById('user-menu-popover')?.remove();

  const user  = Auth.currentUser();
  const org   = Auth.currentOrg();
  const orgs  = Auth.currentUserOrgs();

  if (!user || !org) return;

  const popover = document.createElement('div');
  popover.id = 'user-menu-popover';
  popover.className = 'user-menu-popover';

  const orgListHTML = orgs.map(o => {
    const initials = o.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const isActive = o.id === org.id;
    return `
      <button type="button" class="user-menu-org-item ${isActive ? 'active' : ''}" data-org-id="${o.id}">
        <div class="org-avatar-sm" style="background:${o.logoColor};">${initials}</div>
        <div class="user-menu-org-info">
          <div class="user-menu-org-name">${_esc(o.name)}</div>
          <div class="user-menu-org-role">${o.role} · ${o.plan === 'free' ? 'Free plan' : 'Pro plan'}</div>
        </div>
        ${isActive ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3"><path d="m5 13 4 4L19 7"/></svg>' : ''}
      </button>
    `;
  }).join('');

  popover.innerHTML = `
    <div class="user-menu-header">
      <div class="user-menu-avatar" style="background:${org.logoColor};">${user.avatar || user.name[0].toUpperCase()}</div>
      <div>
        <div class="user-menu-name">${_esc(user.name)}</div>
        <div class="user-menu-email">${_esc(user.email)}</div>
      </div>
    </div>
    <div class="user-menu-section-label">Your Organizations</div>
    <div class="user-menu-orgs">${orgListHTML}</div>
    <div class="user-menu-divider"></div>
    <button type="button" class="user-menu-action" id="btn-manage-orgs">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
      Manage Workspaces & Account
    </button>
    <button type="button" class="user-menu-action" id="btn-create-org">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
      New Organization
    </button>
    <button type="button" class="user-menu-action" id="btn-sign-out">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
      Sign Out
    </button>
  `;

  document.body.appendChild(popover);

  // Position below anchor
  const rect = anchorEl.getBoundingClientRect();
  popover.style.left = `${rect.left}px`;
  popover.style.top  = `${rect.bottom + 8}px`;
  popover.style.width = `${Math.max(rect.width, 240)}px`;

  // Org switch
  popover.querySelectorAll('.user-menu-org-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const orgId = btn.dataset.orgId;
      if (orgId !== org.id) {
        Auth.switchOrg(orgId);
        popover.remove();
        if (typeof onOrgSwitch === 'function') onOrgSwitch(orgId);
      } else {
        popover.remove();
      }
    });
  });

  // Manage orgs / account
  popover.querySelector('#btn-manage-orgs')?.addEventListener('click', () => {
    popover.remove();
    window.location.hash = '#/settings';
    setTimeout(() => {
      const accTabBtn = document.querySelector('.segment-btn[data-tab="account"]');
      if (accTabBtn) accTabBtn.click();
    }, 100);
  });

  // Create org
  popover.querySelector('#btn-create-org')?.addEventListener('click', () => {
    popover.remove();
    _showCreateOrgModal((newOrgId) => {
      Auth.switchOrg(newOrgId);
      if (typeof onOrgSwitch === 'function') onOrgSwitch(newOrgId);
    });
  });

  // Sign out
  popover.querySelector('#btn-sign-out')?.addEventListener('click', () => {
    Auth.logout();
    popover.remove();
    window.location.reload();
  });

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!popover.contains(e.target) && e.target !== anchorEl && !anchorEl.contains(e.target)) {
        popover.remove();
        document.removeEventListener('click', handler);
      }
    });
  }, 50);
}

// ---- Create Org Modal ----

function _showCreateOrgModal(onCreated) {
  const overlay = document.createElement('div');
  overlay.className = 'auth-overlay';

  overlay.innerHTML = `
    <div class="auth-card" style="max-width:400px;">
      <div class="auth-card-header">
        <h1 class="auth-title">New Organization</h1>
        <p class="auth-subtitle">Create a separate workspace for a different business or team.</p>
      </div>
      <form id="create-org-form" class="auth-form">
        <div class="auth-error" id="create-org-error" style="display:none;"></div>
        <div class="auth-field">
          <label for="new-org-name">Organization Name</label>
          <input type="text" id="new-org-name" placeholder="e.g. My Consulting LLC" required>
        </div>
        <button type="submit" class="auth-btn-primary">Create Organization</button>
        <button type="button" class="auth-btn-secondary" id="btn-cancel-org">Cancel</button>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  const form = overlay.querySelector('#create-org-form');
  const err  = overlay.querySelector('#create-org-error');

  form?.addEventListener('submit', e => {
    e.preventDefault();
    err.style.display = 'none';
    const name = form.querySelector('#new-org-name')?.value || '';
    const result = Auth.createOrg({ name });
    if (result.success) {
      _removeOverlay(overlay);
      if (typeof onCreated === 'function') onCreated(result.orgId);
    } else {
      err.textContent = result.error;
      err.style.display = 'flex';
    }
  });

  overlay.querySelector('#btn-cancel-org')?.addEventListener('click', () => _removeOverlay(overlay));
}

// ---- Helpers ----

function _setLoading(form, loading) {
  const label   = form.querySelector('.auth-btn-label');
  const spinner = form.querySelector('.auth-btn-spinner');
  const btn     = form.querySelector('button[type="submit"]');
  if (btn) btn.disabled = loading;
  label?.classList.toggle('hidden', loading);
  spinner?.classList.toggle('hidden', !loading);
}

function _removeOverlay(overlay) {
  overlay.classList.add('auth-overlay-exit');
  setTimeout(() => overlay.remove(), 300);
}

function _esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
