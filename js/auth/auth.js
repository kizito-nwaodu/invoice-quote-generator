/**
 * InvoiceMaster Pro — Authentication & Organization Manager
 *
 * Client-side auth layer with:
 *   - User account registration & login (localStorage-based, ready for real backend swap)
 *   - Multi-organization workspaces (each org gets its own namespaced data)
 *   - Session management with expiry
 *   - Org switching (users can belong to multiple orgs)
 *   - Organization deletion & full Account deletion
 */

const AUTH_PREFIX = 'im_auth_';
const KEYS = {
  ACCOUNTS: `${AUTH_PREFIX}accounts`,        // All user accounts
  ORGS: `${AUTH_PREFIX}orgs`,                // All organizations
  MEMBERSHIPS: `${AUTH_PREFIX}memberships`,  // User <-> Org relationships
  SESSION: `${AUTH_PREFIX}session`,          // Active session
  ACTIVE_ORG: `${AUTH_PREFIX}active_org`,   // Currently selected org ID
};

// ----- Low-level helpers -----

function readKey(key, def = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return def;
    return JSON.parse(raw);
  } catch { return def; }
}

function writeKey(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch { return false; }
}

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 8)}`;
}

/** Minimal password hash (SHA-256 via SubtleCrypto is async; use sync XOR-based for demo) */
function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `im_pw_${Math.abs(hash).toString(16)}_${password.length}`;
}

// ----- Account Registry -----

function getAccounts() {
  return readKey(KEYS.ACCOUNTS, {});
}

function saveAccounts(accounts) {
  writeKey(KEYS.ACCOUNTS, accounts);
}

function getOrgs() {
  return readKey(KEYS.ORGS, {});
}

function saveOrgs(orgs) {
  writeKey(KEYS.ORGS, orgs);
}

function getMemberships() {
  return readKey(KEYS.MEMBERSHIPS, {});
}

function saveMemberships(m) {
  writeKey(KEYS.MEMBERSHIPS, m);
}

// ----- Session -----

export const Session = {
  get() {
    const s = readKey(KEYS.SESSION);
    if (!s) return null;
    // Check expiry (7 days)
    if (Date.now() > s.expiresAt) {
      this.clear();
      return null;
    }
    return s;
  },

  set(userId, orgId) {
    const session = {
      userId,
      orgId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    writeKey(KEYS.SESSION, session);
    writeKey(KEYS.ACTIVE_ORG, orgId);
    return session;
  },

  clear() {
    localStorage.removeItem(KEYS.SESSION);
  },

  isLoggedIn() {
    return this.get() !== null;
  }
};

// ----- Auth API -----

export const Auth = {
  /**
   * Register a new user account.
   * Automatically creates a personal organization for the user.
   * @returns {{ success: boolean, error?: string, userId?: string, orgId?: string }}
   */
  register({ name, email, password, orgName }) {
    if (!name || name.trim().length < 2) return { success: false, error: 'Full name must be at least 2 characters.' };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { success: false, error: 'Please enter a valid email address.' };
    if (!password || password.length < 8) return { success: false, error: 'Password must be at least 8 characters.' };
    if (!orgName || orgName.trim().length < 2) return { success: false, error: 'Organization name must be at least 2 characters.' };

    const accounts = getAccounts();
    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existing = Object.values(accounts).find(a => a.email === normalizedEmail);
    if (existing) return { success: false, error: 'An account with this email already exists.' };

    // Create user account
    const userId = `usr_${uid()}`;
    const account = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      avatar: name.trim().charAt(0).toUpperCase(),
      createdAt: Date.now(),
    };
    accounts[userId] = account;
    saveAccounts(accounts);

    // Create personal organization
    const orgId = `org_${uid()}`;
    const orgs = getOrgs();
    orgs[orgId] = {
      id: orgId,
      name: orgName.trim(),
      slug: orgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      ownerId: userId,
      plan: 'free',
      createdAt: Date.now(),
      memberCount: 1,
      logoColor: _pickOrgColor(orgId),
    };
    saveOrgs(orgs);

    // Create membership
    const memberships = getMemberships();
    if (!memberships[userId]) memberships[userId] = [];
    memberships[userId].push({ orgId, role: 'owner', joinedAt: Date.now() });
    saveMemberships(memberships);

    // Start session
    Session.set(userId, orgId);

    return { success: true, userId, orgId };
  },

  /**
   * Log in an existing user.
   * @returns {{ success: boolean, error?: string }}
   */
  login({ email, password, orgId = null }) {
    const accounts = getAccounts();
    const normalizedEmail = email.trim().toLowerCase();
    const user = Object.values(accounts).find(a => a.email === normalizedEmail);

    if (!user) return { success: false, error: 'No account found with that email address.' };
    if (user.passwordHash !== hashPassword(password)) return { success: false, error: 'Incorrect password. Please try again.' };

    // Determine org to log into
    const memberships = getMemberships();
    const userMemberships = memberships[user.id] || [];
    if (userMemberships.length === 0) return { success: false, error: 'This account has no organizations. Please contact support.' };

    const targetOrgId = orgId || readKey(KEYS.ACTIVE_ORG) || userMemberships[0].orgId;
    const validMembership = userMemberships.find(m => m.orgId === targetOrgId);
    const resolvedOrgId = validMembership ? targetOrgId : userMemberships[0].orgId;

    Session.set(user.id, resolvedOrgId);
    return { success: true, userId: user.id, orgId: resolvedOrgId };
  },

  /**
   * Log out current user.
   */
  logout() {
    Session.clear();
  },

  /**
   * Get the currently logged-in user account.
   */
  currentUser() {
    const session = Session.get();
    if (!session) return null;
    const accounts = getAccounts();
    return accounts[session.userId] || null;
  },

  /**
   * Get all organizations the current user belongs to.
   */
  currentUserOrgs() {
    const session = Session.get();
    if (!session) return [];
    const memberships = getMemberships();
    const userMemberships = memberships[session.userId] || [];
    const orgs = getOrgs();
    return userMemberships.map(m => ({
      ...orgs[m.orgId],
      role: m.role,
      joinedAt: m.joinedAt,
    })).filter(Boolean);
  },

  /**
   * Get the active organization.
   */
  currentOrg() {
    const session = Session.get();
    if (!session) return null;
    const orgs = getOrgs();
    return orgs[session.orgId] || null;
  },

  /**
   * Switch the active organization.
   */
  switchOrg(orgId) {
    const session = Session.get();
    if (!session) return false;
    const memberships = getMemberships();
    const userMemberships = memberships[session.userId] || [];
    const hasAccess = userMemberships.some(m => m.orgId === orgId);
    if (!hasAccess) return false;
    Session.set(session.userId, orgId);
    return true;
  },

  /**
   * Create an additional organization for the current user.
   */
  createOrg({ name }) {
    const session = Session.get();
    if (!session) return { success: false, error: 'Not logged in.' };
    if (!name || name.trim().length < 2) return { success: false, error: 'Organization name must be at least 2 characters.' };

    const orgId = `org_${uid()}`;
    const orgs = getOrgs();
    orgs[orgId] = {
      id: orgId,
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      ownerId: session.userId,
      plan: 'free',
      createdAt: Date.now(),
      memberCount: 1,
      logoColor: _pickOrgColor(orgId),
    };
    saveOrgs(orgs);

    const memberships = getMemberships();
    if (!memberships[session.userId]) memberships[session.userId] = [];
    memberships[session.userId].push({ orgId, role: 'owner', joinedAt: Date.now() });
    saveMemberships(memberships);

    return { success: true, orgId };
  },

  /**
   * Delete an organization by ID.
   * Cleans up all namespaced localStorage records for that organization,
   * updates memberships, and auto-switches to another workspace.
   * @param {string} orgId
   * @returns {{ success: boolean, error?: string, remainingOrgsCount: number }}
   */
  deleteOrg(orgId) {
    const session = Session.get();
    if (!session) return { success: false, error: 'Not logged in.' };

    const orgs = getOrgs();
    if (!orgs[orgId]) return { success: false, error: 'Organization not found.' };

    const memberships = getMemberships();
    const userMemberships = memberships[session.userId] || [];
    const isMember = userMemberships.some(m => m.orgId === orgId);
    if (!isMember) return { success: false, error: 'Access denied.' };

    // 1. Remove all namespaced data for this organization
    const prefix = `invoicemaster_v1_${orgId}_`;
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // 2. Remove org from orgs registry
    delete orgs[orgId];
    saveOrgs(orgs);

    // 3. Remove membership for all users
    Object.keys(memberships).forEach(uid => {
      memberships[uid] = memberships[uid].filter(m => m.orgId !== orgId);
    });
    saveMemberships(memberships);

    // 4. Update session if active org was deleted
    const remaining = memberships[session.userId] || [];
    if (session.orgId === orgId) {
      if (remaining.length > 0) {
        Session.set(session.userId, remaining[0].orgId);
      } else {
        // Create a fallback workspace for the user
        const newOrgId = `org_${uid()}`;
        const user = getAccounts()[session.userId];
        const defaultName = `${user?.name || 'Personal'} Workspace`;
        orgs[newOrgId] = {
          id: newOrgId,
          name: defaultName,
          slug: defaultName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          ownerId: session.userId,
          plan: 'free',
          createdAt: Date.now(),
          memberCount: 1,
          logoColor: _pickOrgColor(newOrgId),
        };
        saveOrgs(orgs);
        memberships[session.userId] = [{ orgId: newOrgId, role: 'owner', joinedAt: Date.now() }];
        saveMemberships(memberships);
        Session.set(session.userId, newOrgId);
      }
    }

    return { success: true, remainingOrgsCount: remaining.length };
  },

  /**
   * Delete the user's entire account, credentials, and all owned organization workspaces.
   * Completely logs the user out.
   * @returns {{ success: boolean }}
   */
  deleteAccount() {
    const session = Session.get();
    if (!session) return { success: false, error: 'Not logged in.' };

    const userId = session.userId;
    const memberships = getMemberships();
    const userMemberships = memberships[userId] || [];
    const orgs = getOrgs();

    // 1. Delete all orgs owned by user and their data
    userMemberships.forEach(m => {
      const org = orgs[m.orgId];
      if (org && org.ownerId === userId) {
        const prefix = `invoicemaster_v1_${m.orgId}_`;
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        delete orgs[m.orgId];
      }
    });
    saveOrgs(orgs);

    // 2. Remove user memberships
    delete memberships[userId];
    saveMemberships(memberships);

    // 3. Remove user account
    const accounts = getAccounts();
    delete accounts[userId];
    saveAccounts(accounts);

    // 4. Clear session
    Session.clear();

    return { success: true };
  },

  /**
   * Update the current user's profile.
   */
  updateProfile({ name }) {
    const session = Session.get();
    if (!session) return false;
    const accounts = getAccounts();
    if (!accounts[session.userId]) return false;
    if (name && name.trim().length >= 2) {
      accounts[session.userId].name = name.trim();
      accounts[session.userId].avatar = name.trim().charAt(0).toUpperCase();
    }
    saveAccounts(accounts);
    return true;
  },

  /**
   * Update the current organization's details.
   */
  updateOrg({ name }) {
    const session = Session.get();
    if (!session) return false;
    const orgs = getOrgs();
    if (!orgs[session.orgId]) return false;
    if (name && name.trim().length >= 2) {
      orgs[session.orgId].name = name.trim();
    }
    saveOrgs(orgs);
    return true;
  },

  /**
   * Returns the data namespace prefix for the active org.
   * All app data (documents, customers, products) is stored under this prefix.
   */
  getDataPrefix() {
    const session = Session.get();
    if (!session) return 'invoicemaster_v1_';
    return `invoicemaster_v1_${session.orgId}_`;
  },
};

// ----- Internal helpers -----

const ORG_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#0ea5e9', '#3b82f6',
];

function _pickOrgColor(orgId) {
  let hash = 0;
  for (let i = 0; i < orgId.length; i++) {
    hash = ((hash << 5) - hash) + orgId.charCodeAt(i);
    hash |= 0;
  }
  return ORG_COLORS[Math.abs(hash) % ORG_COLORS.length];
}
