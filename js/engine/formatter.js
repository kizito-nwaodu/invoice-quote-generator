/**
 * Currency, Date, String Formatting, and Security Sanitization Utilities
 */

export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2, position: 'before' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2, position: 'before' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2, position: 'before' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', decimals: 2, position: 'before' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2, position: 'before' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2, position: 'before' },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', decimals: 2, position: 'before' },
  CHF: { code: 'CHF', symbol: 'CHF ', name: 'Swiss Franc', decimals: 2, position: 'before' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0, position: 'before' },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', decimals: 2, position: 'before' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2, position: 'before' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2, position: 'before' },
  SEK: { code: 'SEK', symbol: ' kr', name: 'Swedish Krona', decimals: 2, position: 'after' },
  DKK: { code: 'DKK', symbol: ' kr', name: 'Danish Krone', decimals: 2, position: 'after' },
  NOK: { code: 'NOK', symbol: ' kr', name: 'Norwegian Krone', decimals: 2, position: 'after' },
  BRL: { code: 'BRL', symbol: 'R$ ', name: 'Brazilian Real', decimals: 2, position: 'before' }
};

/**
 * Format a number as currency
 * @param {number|string} amount 
 * @param {string} currencyCode 
 * @param {boolean} showCode 
 * @returns {string} Formatted string, e.g. "$1,250.00"
 */
export function formatCurrency(amount, currencyCode = 'USD', showCode = false) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const curr = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const decimals = curr.decimals;

  // Format with thousands separator
  const parts = Math.abs(num).toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formattedNumber = parts.join('.');
  
  const sign = num < 0 ? '-' : '';
  let result = '';

  if (curr.position === 'after') {
    result = `${sign}${formattedNumber}${curr.symbol}`;
  } else {
    result = `${sign}${curr.symbol}${formattedNumber}`;
  }

  if (showCode) {
    result = `${result} (${curr.code})`;
  }

  return result;
}

/**
 * Formats a Date object or ISO string to a human-readable date
 * @param {string|Date} dateVal 
 * @param {string} format - 'short' | 'medium' | 'long' | 'input'
 * @returns {string}
 */
export function formatDate(dateVal, format = 'medium') {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);

  if (format === 'input') {
    // Returns YYYY-MM-DD for <input type="date">
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const options = {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' }
  }[format] || { year: 'numeric', month: 'short', day: 'numeric' };

  return d.toLocaleDateString(undefined, options);
}

/**
 * Returns today's date formatted as YYYY-MM-DD for inputs
 * @returns {string}
 */
export function getTodayDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Adds days to a date string and returns YYYY-MM-DD
 * @param {string} dateStr 
 * @param {number} days 
 * @returns {string}
 */
export function addDays(dateStr, days = 0) {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setDate(d.getDate() + parseInt(days, 10));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Formats sequential document numbers (e.g. "INV-00042")
 * @param {string} prefix 
 * @param {number} counter 
 * @param {number} padLength 
 * @returns {string}
 */
export function formatDocNumber(prefix = 'INV-', counter = 1, padLength = 5) {
  const numStr = String(counter).padStart(padLength, '0');
  return `${prefix}${numStr}`;
}

/**
 * Parses and extracts counter number from formatted doc string
 * @param {string} docNumber - e.g. "INV-0042"
 * @returns {number|null}
 */
export function parseDocNumberCounter(docNumber) {
  if (!docNumber) return null;
  const match = docNumber.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Defensive Security: Escapes raw untrusted input to prevent Stored XSS injection.
 * @param {string} str 
 * @returns {string}
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Defensive Security: Sanitizes external URLs to prevent javascript: pseudo-protocols.
 * @param {string} url 
 * @returns {string}
 */
export function sanitizeURL(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:|tel:|data:image\/)/i.test(trimmed)) {
    return trimmed;
  }
  // Auto-prepend https if domain-like
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return '';
}
