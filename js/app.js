/**
 * Core Application Controller & Router
 * Enhanced with multi-channel document sharing (WhatsApp, Email, Public Link), public viewer, and direct invoice/quote navigation.
 */

import { DashboardView } from './views/dashboard.js';
import { DocumentsView } from './views/documents.js';
import { EditorView } from './views/editor.js';
import { PreviewView } from './views/preview.js';
import { PublicView } from './views/public-view.js';
import { CustomersView } from './views/customers.js';
import { ProductsView } from './views/products.js';
import { SettingsView } from './views/settings.js';
import { TestsView } from './views/tests-view.js';
import { OnboardingWizard } from './views/onboarding.js';
import { CustomerRepo, ProductRepo, DocumentRepo, SettingsRepo } from './storage/repository.js';
import { validateCustomer, validateProduct } from './engine/validator.js';
import { formatCurrency, formatDate, getTodayDateString, escapeHTML, sanitizeURL } from './engine/formatter.js';
import { calculateDocument } from './engine/calculation.js';
import { PDFExport } from './export/pdf.js';
import { getIcon } from '../assets/icons.js';
import { Auth, Session } from './auth/auth.js';
import { AuthUI } from './auth/auth-ui.js';

// Expose auth module globally so db.js can resolve org namespaces
window.__authModule = { Auth };

class App {
  constructor() {
    window.app = this;
    this.viewport = document.getElementById('app-viewport');
    this.toastContainer = document.getElementById('toast-container');
    this.currentRoute = '';
    
    this.initTheme();
    this.initGlobalEvents();
    
    // Check if opening a public client link (e.g. #/view/doc_123)
    if (window.location.hash.startsWith('#/view/')) {
      this.initRouter();
    } else {
      // Auth guard — show login if user is not authenticated
      AuthUI.guard(() => {
        this.initRouter();
        this.renderOrgBadge();
        this.checkOnboarding();
      });
    }
  }

  initTheme() {
    const savedTheme = localStorage.getItem('invoicemaster_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('invoicemaster_theme', next);
    this.showToast('Theme Updated', `Switched to ${next} mode`, 'info');
  }

  checkOnboarding() {
    const settings = SettingsRepo.get();
    if (!settings.isOnboarded && !settings.isDemoLoaded) {
      OnboardingWizard.show(() => {
        this.navigate();
      });
    }
  }

  /** Render the org badge / user menu in the sidebar */
  renderOrgBadge() {
    const badgeContainer = document.getElementById('sidebar-org-badge');
    if (badgeContainer) {
      badgeContainer.innerHTML = AuthUI.getSidebarOrgBadgeHTML();
      badgeContainer.querySelector('#btn-user-menu')?.addEventListener('click', (e) => {
        AuthUI.showUserMenu(e.currentTarget, (newOrgId) => {
          this.renderOrgBadge();
          this.showToast('Workspace Switched', `Switched to ${Auth.currentOrg()?.name || 'new workspace'}`, 'success');
          this.checkOnboarding();
          this.navigate();
        });
      });
    }

    // Topbar user avatar widget
    const topbarWidget = document.getElementById('topbar-user-widget');
    if (topbarWidget) {
      const user = Auth.currentUser();
      const org  = Auth.currentOrg();
      if (user && org) {
        const initials = (org.name || 'MB').split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || 'MB';
        topbarWidget.innerHTML = `
          <button type="button" id="btn-topbar-user" title="Account: ${escapeHTML(user.name || 'User')}" style="
            display:flex; align-items:center; gap:7px; background:transparent; border:none;
            cursor:pointer; padding:5px 8px; border-radius:8px; font-family:inherit;
            transition:background 0.15s;
          " onmouseover="this.style.background='var(--bg-surface-subtle)'" onmouseout="this.style.background='transparent'">
            <div style="width:30px;height:30px;border-radius:8px;background:${org.logoColor || '#2563eb'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;">${initials}</div>
            <span style="font-size:12.5px;font-weight:600;color:var(--text-secondary);">${escapeHTML((user.name || 'User').split(' ')[0] || 'User')}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        `;
        topbarWidget.querySelector('#btn-topbar-user')?.addEventListener('click', (e) => {
          AuthUI.showUserMenu(e.currentTarget, (newOrgId) => {
            this.renderOrgBadge();
            this.showToast('Workspace Switched', `Switched to ${Auth.currentOrg()?.name || 'new workspace'}`, 'success');
            this.checkOnboarding();
            this.navigate();
          });
        });
      }
    }
  }

  initRouter() {
    window.addEventListener('hashchange', () => this.navigate());
    if (!window.location.hash) {
      window.location.hash = '#/dashboard';
    } else {
      this.navigate();
    }
  }

  initGlobalEvents() {
    document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
      this.toggleTheme();
    });

    const mobileBtn = document.getElementById('btn-mobile-menu');
    const sidebar = document.querySelector('.app-sidebar');
    mobileBtn?.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        sidebar?.classList.toggle('open');
      } else {
        sidebar?.classList.toggle('collapsed');
      }
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 900) {
          sidebar?.classList.remove('open');
        }
      });
    });

    // Topbar new document button
    document.getElementById('btn-topbar-new-doc')?.addEventListener('click', () => {
      window.location.hash = '#/invoices/new';
    });

    // Global Search keyboard shortcut '/'
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const s = document.getElementById('global-search');
        if (s) {
          s.focus();
          s.select();
        }
      }
    });

    // Global search input
    document.getElementById('global-search')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = e.target.value.trim();
        if (q) {
          window.location.hash = '#/documents';
          setTimeout(() => {
            const input = document.getElementById('doc-search-input');
            if (input) {
              input.value = q;
              input.dispatchEvent(new Event('input'));
            }
          }, 100);
        }
      }
    });
  }

  navigate() {
    const hash = window.location.hash.slice(1) || '/dashboard';
    this.currentRoute = hash;

    const appRoot = document.getElementById('app');

    // Public Viewer Check
    if (hash.startsWith('/view/')) {
      appRoot?.classList.add('public-mode');
      const docId = hash.replace('/view/', '');
      PublicView.render(this.viewport, docId);
      this.viewport.scrollTop = 0;
      return;
    } else {
      appRoot?.classList.remove('public-mode');
    }

    // Auth gate for private workspace routes
    if (!Session.isLoggedIn()) {
      AuthUI.guard(() => {
        this.renderOrgBadge();
        this.navigate();
      });
      return;
    }

    // Update active nav links (All Documents handles /documents, /invoices, /quotes)
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href')?.slice(1);
      if (href && (hash === href || (href === '/documents' && (hash === '/invoices' || hash === '/quotes' || hash === '/documents')))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update sidebar quick action buttons state
    const btnNewInv = document.getElementById('nav-btn-new-invoice');
    const btnNewQuo = document.getElementById('nav-btn-new-quote');
    if (btnNewInv) {
      if (hash === '/invoices/new') {
        btnNewInv.style.boxShadow = '0 0 0 2px #ffffff, 0 0 0 4px #2563eb';
      } else {
        btnNewInv.style.boxShadow = 'none';
      }
    }
    if (btnNewQuo) {
      if (hash === '/quotes/new') {
        btnNewQuo.style.background = 'rgba(37, 99, 235, 0.3)';
        btnNewQuo.style.color = '#ffffff';
        btnNewQuo.style.border = '1px solid #3b82f6';
      } else {
        btnNewQuo.style.background = 'rgba(255,255,255,0.06)';
        btnNewQuo.style.color = '#cbd5e1';
        btnNewQuo.style.border = 'none';
      }
    }

    // Route matching
    try {
      if (hash === '/dashboard') {
        DashboardView.render(this.viewport);
      } else if (hash === '/invoices') {
        DocumentsView.render(this.viewport, 'invoice');
      } else if (hash === '/quotes') {
        DocumentsView.render(this.viewport, 'quote');
      } else if (hash === '/documents') {
        DocumentsView.render(this.viewport, 'all');
      } else if (hash === '/invoices/new') {
        EditorView.render(this.viewport, null, 'invoice');
      } else if (hash === '/quotes/new') {
        EditorView.render(this.viewport, null, 'quote');
      } else if (hash.startsWith('/documents/') && hash.endsWith('/edit')) {
        const parts = hash.split('/');
        const docId = parts[2];
        EditorView.render(this.viewport, docId);
      } else if (hash.startsWith('/editor/')) {
        const docId = hash.replace('/editor/', '');
        EditorView.render(this.viewport, docId);
      } else if (hash.startsWith('/documents/') && hash.endsWith('/preview')) {
        const parts = hash.split('/');
        const docId = parts[2];
        PreviewView.render(this.viewport, docId);
      } else if (hash.startsWith('/preview/')) {
        const docId = hash.replace('/preview/', '');
        PreviewView.render(this.viewport, docId);
      } else if (hash === '/customers') {
        CustomersView.render(this.viewport);
      } else if (hash === '/products') {
        ProductsView.render(this.viewport);
      } else if (hash === '/settings') {
        SettingsView.render(this.viewport);
      } else if (hash === '/tests') {
        TestsView.render(this.viewport);
      } else {
        DashboardView.render(this.viewport);
      }
    } catch (renderError) {
      console.error('View Render Error:', renderError);
      this.viewport.innerHTML = `
        <div style="padding: 40px 20px; text-align: center; max-width: 600px; margin: 40px auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">⚠️</div>
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">Notice</h2>
          <p style="color: #64748b; font-size: 13.5px; margin-bottom: 20px;">${escapeHTML(renderError.message || 'An unexpected state occurred while rendering.')}</p>
          <button onclick="window.location.hash='#/dashboard'; window.location.reload();" class="btn btn-primary btn-sm">Reload Dashboard</button>
        </div>
      `;
    }

    this.viewport.scrollTop = 0;
  }

  showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = getIcon('checkCircle');
    if (type === 'error') iconSvg = getIcon('alertCircle');
    if (type === 'warning') iconSvg = getIcon('alertCircle');

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-content">
        <div class="toast-title">${escapeHTML(title)}</div>
        <div class="toast-message">${escapeHTML(message)}</div>
      </div>
      <button class="toast-close">${getIcon('x')}</button>
    `;

    this.toastContainer.appendChild(toast);

    toast.querySelector('.toast-close')?.addEventListener('click', () => {
      toast.remove();
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // --- Modals ---

  showCustomerModal(customerId = null, callback = null) {
    const cust = customerId ? CustomerRepo.getById(customerId) : null;
    const modalEl = document.createElement('div');
    modalEl.className = 'modal-overlay active';

    modalEl.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">${cust ? 'Edit Customer' : 'Add New Customer'}</h3>
          <button class="btn btn-subtle btn-sm btn-icon-only modal-close">${getIcon('x')}</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Customer / Client Name</label>
              <input type="text" id="m-cust-name" class="form-control" value="${escapeHTML(cust?.name || '')}" placeholder="e.g. Sarah Jenkins">
            </div>
            <div class="form-group">
              <label class="form-label">Company Name</label>
              <input type="text" id="m-cust-company" class="form-control" value="${escapeHTML(cust?.company || '')}" placeholder="e.g. Acme Corp Ltd.">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="m-cust-email" class="form-control" value="${escapeHTML(cust?.email || '')}" placeholder="client@example.com">
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="text" id="m-cust-phone" class="form-control" value="${escapeHTML(cust?.phone || '')}" placeholder="+1 (555) 000-0000">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Billing Address</label>
            <textarea id="m-cust-address" class="form-control" placeholder="123 Street Name, Suite 100&#10;City, State 12345">${escapeHTML(cust?.address || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Tax / VAT ID Number</label>
            <input type="text" id="m-cust-tax" class="form-control" value="${escapeHTML(cust?.taxNumber || '')}" placeholder="e.g. VAT-12345678">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
          <button type="button" id="btn-save-cust-modal" class="btn btn-primary">Save Customer</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    const closeModal = () => modalEl.remove();
    modalEl.querySelector('.modal-close')?.addEventListener('click', closeModal);
    modalEl.querySelector('.modal-cancel')?.addEventListener('click', closeModal);

    modalEl.querySelector('#btn-save-cust-modal')?.addEventListener('click', () => {
      const data = {
        id: cust?.id,
        name: modalEl.querySelector('#m-cust-name')?.value || '',
        company: modalEl.querySelector('#m-cust-company')?.value || '',
        email: modalEl.querySelector('#m-cust-email')?.value || '',
        phone: modalEl.querySelector('#m-cust-phone')?.value || '',
        address: modalEl.querySelector('#m-cust-address')?.value || '',
        taxNumber: modalEl.querySelector('#m-cust-tax')?.value || '',
        notes: modalEl.querySelector('#m-cust-notes')?.value || ''
      };

      const validation = validateCustomer(data);
      if (!validation.isValid) {
        this.showToast('Validation Error', validation.errors[0], 'error');
        return;
      }

      const saved = CustomerRepo.save(data);
      this.showToast('Customer Saved', `Saved ${saved.name}`, 'success');
      closeModal();
      if (typeof callback === 'function') callback(saved);
    });
  }

  showProductModal(productId = null, callback = null) {
    const prod = productId ? ProductRepo.getById(productId) : null;
    const settings = SettingsRepo.get();
    const modalEl = document.createElement('div');
    modalEl.className = 'modal-overlay active';

    modalEl.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">${prod ? 'Edit Item' : 'Add Catalog Item'}</h3>
          <button class="btn btn-subtle btn-sm btn-icon-only modal-close">${getIcon('x')}</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Item Name / Title</label>
              <input type="text" id="m-prod-name" class="form-control" value="${escapeHTML(prod?.name || '')}" placeholder="e.g. Website Design & UI Kit">
            </div>
            <div class="form-group">
              <label class="form-label">SKU / Item Code</label>
              <input type="text" id="m-prod-sku" class="form-control" value="${escapeHTML(prod?.sku || '')}" placeholder="e.g. SRV-001">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Detailed Description</label>
            <textarea id="m-prod-desc" class="form-control" rows="2" placeholder="Full scope or product details...">${escapeHTML(prod?.description || '')}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Unit Price</label>
              <input type="number" step="0.01" min="0" id="m-prod-price" class="form-control" value="${prod?.unitPrice !== undefined ? prod.unitPrice : ''}" placeholder="0.00">
            </div>
            <div class="form-group">
              <label class="form-label">Unit of Measure</label>
              <input type="text" id="m-prod-unit" class="form-control" value="${escapeHTML(prod?.unit || 'hrs')}" placeholder="e.g. hrs, pcs, mo">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
          <button type="button" id="btn-save-prod-modal" class="btn btn-primary">Save Item</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    const closeModal = () => modalEl.remove();
    modalEl.querySelector('.modal-close')?.addEventListener('click', closeModal);
    modalEl.querySelector('.modal-cancel')?.addEventListener('click', closeModal);

    modalEl.querySelector('#btn-save-prod-modal')?.addEventListener('click', () => {
      const data = {
        id: prod?.id,
        name: modalEl.querySelector('#m-prod-name')?.value || '',
        sku: modalEl.querySelector('#m-prod-sku')?.value || '',
        description: modalEl.querySelector('#m-prod-desc')?.value || '',
        unitPrice: parseFloat(modalEl.querySelector('#m-prod-price')?.value) || 0,
        unit: modalEl.querySelector('#m-prod-unit')?.value || 'item'
      };

      const validation = validateProduct(data);
      if (!validation.isValid) {
        this.showToast('Validation Error', validation.errors[0], 'error');
        return;
      }

      const saved = ProductRepo.save(data);
      this.showToast('Item Saved', `Saved ${saved.name}`, 'success');
      closeModal();
      if (typeof callback === 'function') callback(saved);
    });
  }

  showPaymentModal(invoiceId, callback = null) {
    const inv = DocumentRepo.getById(invoiceId);
    if (!inv) return;
    const settings = SettingsRepo.get();
    const calc = calculateDocument(inv, settings);
    const docCurrency = inv.currency || settings.currency || 'USD';

    const modalEl = document.createElement('div');
    modalEl.className = 'modal-overlay active';

    modalEl.innerHTML = `
      <div class="modal-card" style="max-width: 480px;">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Record Payment</h3>
            <div style="font-size: 12px; color: var(--text-secondary);">Invoice ${escapeHTML(inv.number)} • Balance: ${formatCurrency(calc.balanceDue, docCurrency)}</div>
          </div>
          <button class="btn btn-subtle btn-sm btn-icon-only modal-close">${getIcon('x')}</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label required">Payment Amount (${docCurrency})</label>
            <input type="number" step="0.01" min="0.01" max="${calc.balanceDue}" id="m-pay-amount" class="form-control" value="${calc.balanceDue}">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Payment Date</label>
              <input type="date" id="m-pay-date" class="form-control" value="${getTodayDateString()}">
            </div>
            <div class="form-group">
              <label class="form-label">Payment Method</label>
              <select id="m-pay-method" class="form-control">
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit Card">Credit Card / Stripe</option>
                <option value="Cash">Cash</option>
                <option value="PayPal">PayPal</option>
                <option value="Check">Check</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Reference / Transaction ID</label>
            <input type="text" id="m-pay-ref" class="form-control" placeholder="e.g. TXN-9847193">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
          <button type="button" id="btn-save-payment" class="btn btn-primary">Confirm Payment</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    const closeModal = () => modalEl.remove();
    modalEl.querySelector('.modal-close')?.addEventListener('click', closeModal);
    modalEl.querySelector('.modal-cancel')?.addEventListener('click', closeModal);

    modalEl.querySelector('#btn-save-payment')?.addEventListener('click', () => {
      const amount = parseFloat(modalEl.querySelector('#m-pay-amount')?.value);
      if (isNaN(amount) || amount <= 0) {
        this.showToast('Validation Error', 'Payment amount must be greater than 0.', 'error');
        return;
      }

      const paymentData = {
        amount,
        date: modalEl.querySelector('#m-pay-date')?.value || getTodayDateString(),
        method: modalEl.querySelector('#m-pay-method')?.value || 'Bank Transfer',
        reference: modalEl.querySelector('#m-pay-ref')?.value || ''
      };

      DocumentRepo.recordPayment(invoiceId, paymentData);
      this.showToast('Payment Recorded', `Recorded ${formatCurrency(amount, docCurrency)} against ${inv.number}`, 'success');
      closeModal();
      if (typeof callback === 'function') callback();
    });
  }

  /**
   * Comprehensive Multi-Channel Sharing Modal
   * Supports WhatsApp (pick contact or direct), Email, Self-Contained Public Web Link, and PDF attachments.
   */
  showShareModal(docId) {
    const doc = DocumentRepo.getById(docId);
    if (!doc) return;
    const settings = SettingsRepo.get();
    const calc = calculateDocument(doc, settings);
    const docCurrency = doc.currency || settings.currency || 'USD';
    const isInvoice = doc.type === 'invoice';
    const clientEmail = doc.customer?.email || '';
    const clientPhone = doc.customer?.phone || '';
    const clientName = doc.customer?.name || 'Valued Client';
    const bizName = settings.business?.name || 'Our Company';

    // Save to public shared vault
    try {
      const vault = JSON.parse(localStorage.getItem('invoicemaster_shared_vault') || '{}');
      vault[doc.id] = { doc, settings };
      localStorage.setItem('invoicemaster_shared_vault', JSON.stringify(vault));
    } catch (e) {}

    const baseUrl = window.location.origin + window.location.pathname.replace(/\/+$/, '');
    const publicUrl = `${baseUrl}#/view/${doc.id}`;

    // Default message bodies
    const defaultNote = isInvoice 
      ? (settings.defaultInvoiceNotes || 'Thank you for your business! Please remit payment according to the terms above.')
      : (settings.defaultQuoteNotes || 'Thank you for the opportunity to quote! We look forward to working with you. This estimate is valid for 30 days.');
    const noteMsg = doc.notes || defaultNote;

    const whatsappMsg = `Hello ${clientName},\n\nHere is your ${isInvoice ? 'Invoice' : 'Quote'} *${doc.number}* from *${bizName}*.\n\n` +
      `📄 *Total Amount:* ${formatCurrency(calc.grandTotal, docCurrency)}\n` +
      (isInvoice && calc.balanceDue > 0 ? `💰 *Balance Due:* ${formatCurrency(calc.balanceDue, docCurrency)}\n` : '') +
      (isInvoice && doc.dueDate ? `📅 *Due Date:* ${formatDate(doc.dueDate)}\n` : '') +
      (!isInvoice && doc.expirationDate ? `📅 *Valid Until:* ${formatDate(doc.expirationDate)}\n` : '') +
      `\n🔗 *View & Download Document:* ${publicUrl}\n\n` +
      noteMsg;

    const emailSubject = `${isInvoice ? 'Invoice' : 'Quote'} ${doc.number} from ${bizName}`;
    const emailBody = `Dear ${clientName},\n\n` +
      `Please find details for ${isInvoice ? 'Invoice' : 'Quote'} ${doc.number}.\n\n` +
      `Document Details:\n` +
      `- Number: ${doc.number}\n` +
      `- Date: ${formatDate(doc.date)}\n` +
      (isInvoice && doc.dueDate ? `- Due Date: ${formatDate(doc.dueDate)}\n` : '') +
      (!isInvoice && doc.expirationDate ? `- Valid Until: ${formatDate(doc.expirationDate)}\n` : '') +
      `- Total: ${formatCurrency(calc.grandTotal, docCurrency)}\n` +
      (isInvoice && calc.balanceDue > 0 ? `- Balance Due: ${formatCurrency(calc.balanceDue, docCurrency)}\n` : '') +
      `\nYou can view and download your official document online here:\n${publicUrl}\n\n` +
      (settings.business?.paymentInfo ? `Payment Instructions:\n${settings.business.paymentInfo}\n\n` : '') +
      noteMsg +
      `\n\nBest regards,\n${bizName}\n${settings.business?.email || ''}\n${settings.business?.phone || ''}`;

    const modalEl = document.createElement('div');
    modalEl.className = 'modal-overlay active';

    modalEl.innerHTML = `
      <div class="modal-card" style="max-width: 680px;">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Share & Send ${isInvoice ? 'Invoice' : 'Quote'}</h3>
            <div style="font-size: 12px; color: var(--text-secondary);">${escapeHTML(doc.number)} • ${formatCurrency(calc.grandTotal, docCurrency)}</div>
          </div>
          <button class="btn btn-subtle btn-sm btn-icon-only modal-close">${getIcon('x')}</button>
        </div>

        <div class="modal-body" style="padding-top: 14px;">
          <!-- Public Link Banner -->
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #1d4ed8; letter-spacing: 0.05em; margin-bottom: 2px;">Public Client Link (Shareable Anywhere)</div>
              <div style="font-size: 12px; color: #1e3a8a; font-family: var(--font-mono); word-break: break-all; max-height: 40px; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(publicUrl)}</div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button type="button" id="btn-copy-public-link" class="btn btn-primary btn-sm" style="background: #2563eb;">
                ${getIcon('copy')} Copy Link
              </button>
              <a href="${publicUrl}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
                Open View ↗
              </a>
            </div>
          </div>

          <!-- Channel Selector Tabs -->
          <div class="segmented-control" style="margin-bottom: 16px; width: 100%; display: flex;">
            <button class="segment-btn active" id="tab-btn-whatsapp" style="flex: 1; justify-content: center; gap: 6px;">
              💬 WhatsApp
            </button>
            <button class="segment-btn" id="tab-btn-email" style="flex: 1; justify-content: center; gap: 6px;">
              ✉️ Email (Mailto)
            </button>
          </div>

          <!-- WhatsApp Pane -->
          <div id="pane-whatsapp">
            <div class="form-group" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 14px; border-radius: 8px; margin-bottom: 14px;">
              <label class="form-label" style="font-weight: 700; margin-bottom: 8px;">WhatsApp Sending Option</label>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
                  <input type="radio" name="wa-target-option" id="wa-opt-pick" value="pick" checked>
                  <span><strong>Choose Contact or Group in WhatsApp</strong> (Prompt contact picker when WhatsApp opens)</span>
                </label>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
                  <input type="radio" name="wa-target-option" id="wa-opt-direct" value="direct">
                  <span>Send directly to client's phone number</span>
                </label>
              </div>
            </div>

            <div class="form-group" id="wa-phone-row" style="display: none;">
              <label class="form-label">Client WhatsApp / Phone Number (with Country Code)</label>
              <input type="text" id="share-wa-phone" class="form-control" value="${escapeHTML(clientPhone)}" placeholder="e.g. +2347068898253">
            </div>

            <div class="form-group">
              <label class="form-label">WhatsApp Formatted Message</label>
              <textarea id="share-wa-msg" class="form-control" rows="6" style="font-size: 13px; line-height: 1.45; font-family: var(--font-sans);">${escapeHTML(whatsappMsg)}</textarea>
            </div>

            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 10px 14px; font-size: 12px; color: #475569; margin-bottom: 14px;">
              💡 <strong>Attach PDF File in WhatsApp:</strong> Click <em>"Download PDF File"</em> below to save it on your device, then attach the PDF file directly in your WhatsApp conversation.
            </div>
          </div>

          <!-- Email Pane -->
          <div id="pane-email" style="display: none;">
            <div class="form-group">
              <label class="form-label required">Recipient Email</label>
              <input type="email" id="share-email-to" class="form-control" value="${escapeHTML(clientEmail)}" placeholder="client@example.com">
            </div>
            <div class="form-group">
              <label class="form-label required">Subject Line</label>
              <input type="text" id="share-email-subject" class="form-control" value="${escapeHTML(emailSubject)}">
            </div>
            <div class="form-group">
              <label class="form-label required">Email Message Body</label>
              <textarea id="share-email-body" class="form-control" rows="6" style="font-size: 13px; line-height: 1.45; font-family: var(--font-sans);">${escapeHTML(emailBody)}</textarea>
            </div>
          </div>
        </div>

        <div class="modal-footer" style="justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <button type="button" id="btn-download-pdf-attach" class="btn btn-secondary">
            ${getIcon('download')} Download PDF File
          </button>

          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary modal-cancel">Close</button>
            <button type="button" id="btn-send-channel" class="btn btn-primary" style="background: #16a34a; border-color: #16a34a;">
              Open WhatsApp ↗
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    const closeModal = () => modalEl.remove();
    modalEl.querySelector('.modal-close')?.addEventListener('click', closeModal);
    modalEl.querySelector('.modal-cancel')?.addEventListener('click', closeModal);

    let activeChannel = 'whatsapp';

    const tabWhatsApp = modalEl.querySelector('#tab-btn-whatsapp');
    const tabEmail = modalEl.querySelector('#tab-btn-email');
    const paneWhatsApp = modalEl.querySelector('#pane-whatsapp');
    const paneEmail = modalEl.querySelector('#pane-email');
    const btnSendChannel = modalEl.querySelector('#btn-send-channel');

    tabWhatsApp?.addEventListener('click', () => {
      activeChannel = 'whatsapp';
      tabWhatsApp.classList.add('active');
      tabEmail.classList.remove('active');
      paneWhatsApp.style.display = 'block';
      paneEmail.style.display = 'none';
      btnSendChannel.textContent = 'Open WhatsApp ↗';
      btnSendChannel.style.background = '#16a34a';
      btnSendChannel.style.borderColor = '#16a34a';
    });

    tabEmail?.addEventListener('click', () => {
      activeChannel = 'email';
      tabEmail.classList.add('active');
      tabWhatsApp.classList.remove('active');
      paneEmail.style.display = 'block';
      paneWhatsApp.style.display = 'none';
      btnSendChannel.textContent = 'Open in Email Client ↗';
      btnSendChannel.style.background = '#2563eb';
      btnSendChannel.style.borderColor = '#2563eb';
    });

    // Toggle WhatsApp Phone Input visibility
    modalEl.querySelectorAll('input[name="wa-target-option"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const phoneRow = modalEl.querySelector('#wa-phone-row');
        if (phoneRow) {
          phoneRow.style.display = e.target.value === 'direct' ? 'block' : 'none';
        }
      });
    });

    // Copy public link
    modalEl.querySelector('#btn-copy-public-link')?.addEventListener('click', () => {
      navigator.clipboard.writeText(publicUrl).then(() => {
        this.showToast('Link Copied', 'Public document link copied to clipboard.', 'success');
      });
    });

    // Download PDF for attachment
    modalEl.querySelector('#btn-download-pdf-attach')?.addEventListener('click', async () => {
      const paper = document.getElementById('invoice-paper');
      if (paper) {
        await PDFExport.downloadPDF(paper, `${doc.number}.pdf`);
        this.showToast('PDF Saved', 'Attach this downloaded file in WhatsApp or Email.', 'info');
      } else {
        this.showToast('PDF Ready', 'Please open document preview to download the PDF.', 'info');
      }
    });

    // Action button
    btnSendChannel?.addEventListener('click', () => {
      // Mark document as Sent if draft
      if (doc.status === 'Draft') {
        doc.status = 'Sent';
        DocumentRepo.save(doc);
        this.showToast('Status Updated', `Marked ${doc.number} as Sent`, 'info');
      }

      if (activeChannel === 'whatsapp') {
        const isDirect = modalEl.querySelector('#wa-opt-direct')?.checked;
        const phone = (modalEl.querySelector('#share-wa-phone')?.value || '').replace(/[^\d]/g, '');
        const msg = encodeURIComponent(modalEl.querySelector('#share-wa-msg')?.value || '');
        
        const waUrl = (isDirect && phone)
          ? `https://wa.me/${phone}?text=${msg}`
          : `https://wa.me/?text=${msg}`;
          
        window.open(waUrl, '_blank');
      } else {
        const to = encodeURIComponent(modalEl.querySelector('#share-email-to')?.value || '');
        const subject = encodeURIComponent(modalEl.querySelector('#share-email-subject')?.value || '');
        const body = encodeURIComponent(modalEl.querySelector('#share-email-body')?.value || '');
        window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
      }
      closeModal();
    });
  }

  showEmailModal(docId) {
    this.showShareModal(docId);
  }
}

// Bootstrap Application
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
