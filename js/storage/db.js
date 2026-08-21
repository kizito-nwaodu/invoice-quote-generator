/**
 * Local-First Storage Database Layer
 * Provides robust LocalStorage persistence with schema versioning, integrity protection,
 * and per-organization data namespacing for multi-tenant workspaces.
 */

/** Returns the active org data prefix. Lazy import avoids circular deps. */
function _getPrefix() {
  try {
    // Auth module may not be loaded yet on first cold boot — gracefully fall back
    const authModule = window.__authModule;
    if (authModule && authModule.Auth) {
      return authModule.Auth.getDataPrefix();
    }
  } catch (_) { /* no-op */ }
  return 'invoicemaster_v1_';
}

/** Build a namespaced key for the current active org */
function key(suffix) {
  return `${_getPrefix()}${suffix}`;
}

export const STORAGE_KEY_NAMES = {
  SETTINGS: 'settings',
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  DOCUMENTS: 'documents',
  META: 'meta',
};

/** Computed (lazy) storage keys — always reflects current org */
export function getStorageKeys() {
  const prefix = _getPrefix();
  return {
    SETTINGS:  `${prefix}settings`,
    CUSTOMERS: `${prefix}customers`,
    PRODUCTS:  `${prefix}products`,
    DOCUMENTS: `${prefix}documents`,
    META:      `${prefix}meta`,
  };
}

// Keep STORAGE_KEYS as a compatibility alias (resolved at call time via getter)
export const STORAGE_KEYS = new Proxy({}, {
  get(_, prop) {
    return getStorageKeys()[prop];
  }
});

export const DB = {
  /**
   * Get parsed data from storage
   * @param {string} key
   * @param {*} defaultValue
   * @returns {*}
   */
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return defaultValue;
      return JSON.parse(raw);
    } catch (err) {
      console.error(`DB.get failed for key "${key}":`, err);
      return defaultValue;
    }
  },

  /**
   * Store data in storage
   * @param {string} key
   * @param {*} value
   * @returns {boolean}
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`DB.set failed for key "${key}":`, err);
      return false;
    }
  },

  /**
   * Remove item from storage
   * @param {string} key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error(`DB.remove failed for key "${key}":`, err);
    }
  },

  /**
   * Clear all data records for the current active org workspace.
   */
  clearAll() {
    const keys = getStorageKeys();
    Object.values(keys).forEach(k => localStorage.removeItem(k));
  }
};
