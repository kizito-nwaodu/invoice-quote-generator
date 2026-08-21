/**
 * Core Application Controller & Router
 */

import { DashboardView } from './views/dashboard.js';
import { DocumentsView } from './views/documents.js';
import { EditorView } from './views/editor.js';
import { PreviewView } from './views/preview.js';
import { CustomersView } from './views/customers.js';
import { ProductsView } from './views/products.js';
import { SettingsView } from './views/settings.js';
import { TestsView } from './views/tests-view.js';
import { OnboardingWizard } from './views/onboarding.js';
import { CustomerRepo, ProductRepo, DocumentRepo, SettingsRepo } from './storage/repository.js';
import { validateCustomer, validateProduct } from './engine/validator.js';
import { formatCurrency, formatDate, getTodayDateString } from './engine/formatter.js';
import { calculateDocument } from './engine/calculation.js';
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
    
    // Auth guard — show login if user is not authenticated
    AuthUI.guard(() => {
      this.initRouter();
      this.renderOrgBadge();
      this.checkOnboarding();
    });
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
          // On org switch, re-render the badge and reload the current view
          this.renderOrgBadge();
          this.showToast('Workspace Switched', `Switched to ${Auth.currentOrg()?.name || 'new workspace'}`, 'success');
          // Re-check onboarding for the new org
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
        const initials = org.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        topbarWidget.innerHTML = `
          <button type="button" id="btn-topbar-user" title="Account: ${user.name}" style="
            display:flex; align-items:center; gap:7px; background:transparent; border:none;
            cursor:pointer; padding:5px 8px; border-radius:8px; font-family:inherit;
            transition:background 0.15s;
          " onmouseover="this.style.background='var(--bg-surface-subtle)'" onmouseout="this.style.background='transparent'">
            <div style="width:30px;height:30px;border-radius:8px;background:${org.logoColor};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;">${initials}</div>
            <span style="font-size:12.5px;font-weight:600;color:var(--text-secondary);">${user.name.split(' ')[0]}</span>
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
    // Default initial route
    if (!window.location.hash) {
      window.location.hash = '#/dashboard';
    } else {
      this.navigate();
    }
  }

  initGlobalEvents() {
    // Theme toggle button
    document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Mobile sidebar toggle
    const mobileBtn = document.getElementById('btn-mobile-menu');
    const sidebar = document.querySelector('.app-sidebar');
    mobileBtn?.addEventListener('click', () => {
      sidebar?.classList.toggle('open');
    });

    // Close mobile sidebar on nav click
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        sidebar?.classList.remove('open');
      });
    });
  }

  navigate() {
    const hash = window.location.hash.slice(1) || '/dashboard';
    this.currentRoute = hash;

    // Update active nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href')?.slice(1);
      if (href && (hash === href || (href !== '/dashboard' && hash.startsWith(href)))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Route matching
    if (hash === '/dashboard') {
      DashboardView.render(this.viewport);
    } else if (hash === '/documents') {
      DocumentsView.render(this.viewport);
    } else if (hash === '/invoices/new') {
      EditorView.render(this.viewport, null, 'invoice');
    } else if (hash === '/quotes/new') {
      EditorView.render(this.viewport, null, 'quote');
    } else if (hash.startsWith('/documents/') && hash.endsWith('/edit')) {
      const parts = hash.split('/');
      const docId = parts[2];
      EditorView.render(this.viewport, docId);
    } else if (hash.startsWith('/documents/') && hash.endsWith('/preview')) {
      const parts = hash.split('/');
      const docId = parts[2];
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

    // Scroll viewport to top
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
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
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
              <input type="text" id="m-cust-name" class="form-control" value="${cust?.name || ''}" placeholder="e.g. Sarah Jenkins">
            </div>
            <div class="form-group">
              <label class="form-label">Company Name</label>
              <input type="text" id="m-cust-company" class="form-control" value="${cust?.company || ''}" placeholder="e.g. Acme Corp Ltd.">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="m-cust-email" class="form-control" value="${cust?.email || ''}" placeholder="client@example.com">
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="text" id="m-cust-phone" class="form-control" value="${cust?.phone || ''}" placeholder="+1 (555) 000-0000">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Billing Address</label>
            <textarea id="m-cust-address" class="form-control" placeholder="123 Street Name, Suite 100&#10;City, State 12345">${cust?.address || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Tax / VAT ID Number</label>
            <input type="text" id="m-cust-tax" class="form-control" value="${cust?.taxNumber || ''}" placeholder="e.g. VAT-12345678">
          </div>
          <div class="form-group">
            <label class="form-label">Notes (Internal)</label>
            <textarea id="m-cust-notes" class="form-control" placeholder="Client preferences, payment terms, or discount agreements...">${cust?.notes || ''}</textarea>
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

  showCustomerHistoryModal(customerId) {
    const cust = CustomerRepo.getById(customerId);
    if (!cust) return;
    const stats = CustomerRepo.getStats(customerId);
    const settings = SettingsRepo.get();
    const currency = settings.currency || 'USD';

    const modalEl = document.createElement('div');
    modalEl.className = 'modal-overlay active';

    modalEl.innerHTML = `
      <div class="modal-card" style="max-width: 720px;">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">${cust.name}</h3>
            <div style="font-size: 12px; color: var(--text-secondary);">${cust.company || 'Customer History & Ledger'}</div>
          </div>
          <button class="btn btn-subtle btn-sm btn-icon-only modal-close">${getIcon('x')}</button>
        </div>
        <div class="modal-body">
          <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 20px;">
            <div class="stat-card" style="padding: 14px;">
              <span class="stat-title" style="font-size: 11px;">Total Invoiced</span>
              <div class="stat-value" style="font-size: 18px;">${formatCurrency(stats.totalInvoiced, currency)}</div>
            </div>
            <div class="stat-card" style="padding: 14px;">
              <span class="stat-title" style="font-size: 11px;">Total Paid</span>
              <div class="stat-value" style="font-size: 18px; color: #16a34a;">${formatCurrency(stats.totalPaid, currency)}</div>
            </div>
            <div class="stat-card" style="padding: 14px;">
              <span class="stat-title" style="font-size: 11px;">Balance Due</span>
              <div class="stat-value" style="font-size: 18px; color: ${stats.outstandingBalance > 0 ? '#dc2626' : 'var(--text-primary)'};">
                ${formatCurrency(stats.outstandingBalance, currency)}
              </div>
            </div>
          </div>

          <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 10px;">Linked Documents</h4>
          ${stats.documents.length === 0 ? `
            <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
              No quotes or invoices found for this customer.
            </div>
          ` : `
            <div class="table-responsive" style="max-height: 280px; overflow-y: auto;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Number</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style="text-align: right;">Amount</th>
                    <th style="text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${stats.documents.map(d => {
                    const calc = calculateDocument(d, settings);
                    return `
                      <tr>
                        <td><strong>${d.type.toUpperCase()}</strong></td>
                        <td>${d.number}</td>
                        <td>${formatDate(d.date)}</td>
                        <td><span class="badge badge-${(d.status || 'draft').toLowerCase().replace(/\s+/g, '-')}">${d.status}</span></td>
                        <td style="text-align: right; font-weight: 700;">${formatCurrency(calc.grandTotal, d.currency || currency)}</td>
                        <td style="text-align: right;">
                          <a href="#/documents/${d.id}/preview" class="btn btn-subtle btn-sm modal-nav-link" style="padding: 4px 8px; font-size: 11.5px;">
                            View
                          </a>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-close">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);
    modalEl.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => modalEl.remove()));
    modalEl.querySelectorAll('.modal-nav-link').forEach(l => l.addEventListener('click', () => modalEl.remove()));
  }

  showProductModal(productId = null, callback = null) {
    const prod = productId ? ProductRepo.getById(productId) : null;
    const settings = SettingsRepo.get();
    const modalEl = document.createElement('div');
    modalEl.className = 'modal-overlay active';

    modalEl.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">${prod ? 'Edit Item' : 'Add New Item / Service'}</h3>
          <button class="btn btn-subtle btn-sm btn-icon-only modal-close">${getIcon('x')}</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Product / Service Name</label>
              <input type="text" id="m-prod-name" class="form-control" value="${prod?.name || ''}" placeholder="e.g. Website Design">
            </div>
            <div class="form-group">
              <label class="form-label">SKU / Item Code</label>
              <input type="text" id="m-prod-sku" class="form-control" value="${prod?.sku || ''}" placeholder="e.g. SRV-001">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea id="m-prod-desc" class="form-control" placeholder="Detailed service or product description...">${prod?.description || ''}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Unit Price</label>
              <input type="number" step="0.01" min="0" id="m-prod-price" class="form-control" value="${prod?.unitPrice !== undefined ? prod.unitPrice : ''}" placeholder="0.00">
            </div>
            <div class="form-group">
              <label class="form-label">Unit (e.g. hrs, items, pkg)</label>
              <input type="text" id="m-prod-unit" class="form-control" value="${prod?.unit || 'hrs'}" placeholder="hrs">
            </div>
            <div class="form-group">
              <label class="form-label">Default Tax Rate (%)</label>
              <input type="number" step="0.01" min="0" id="m-prod-tax" class="form-control" value="${prod?.taxRate !== undefined ? prod.taxRate : settings.taxRate}">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
          <button type="button" id="btn-save-prod-modal" class="btn btn-primary">Save Product</button>
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
        unit: modalEl.querySelector('#m-prod-unit')?.value || 'hrs',
        taxRate: parseFloat(modalEl.querySelector('#m-prod-tax')?.value) || 0
      };

      const validation = validateProduct(data);
      if (!validation.isValid) {
        this.showToast('Validation Error', validation.errors[0], 'error');
        return;
      }

      const saved = ProductRepo.save(data);
      this.showToast('Product Saved', `Saved ${saved.name}`, 'success');
      closeModal();
      if (typeof callback === 'function') callback(saved);
    });
  }

  showPaymentModal(invoiceId, callback = null) {
    const inv = DocumentRepo.getById(invoiceId);
    if (!inv || inv.type !== 'invoice') return;
    const settings = SettingsRepo.get();
    const calc = calculateDocument(inv, settings);
    const docCurrency = inv.currency || 'USD';

    const modalEl = document.createElement('div');
    modalEl.className = 'modal-overlay active';

    modalEl.innerHTML = `
      <div class="modal-card" style="max-width: 480px;">
        <div class="modal-header">
          <h3 class="modal-title">Record Payment for ${inv.number}</h3>
          <button class="btn btn-subtle btn-sm btn-icon-only modal-close">${getIcon('x')}</button>
        </div>
        <div class="modal-body">
          <div style="background: var(--bg-surface-subtle); padding: 14px; border-radius: var(--radius-md); margin-bottom: 18px; border: 1px solid var(--border-subtle);">
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
              <span>Invoice Grand Total:</span>
              <strong>${formatCurrency(calc.grandTotal, docCurrency)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
              <span>Already Paid:</span>
              <strong style="color: #16a34a;">${formatCurrency(calc.amountPaid, docCurrency)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; border-top: 1px dashed var(--border-strong); padding-top: 6px; margin-top: 4px;">
              <span>Remaining Balance Due:</span>
              <span style="color: #dc2626;">${formatCurrency(calc.amountDue, docCurrency)}</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label required">Payment Amount</label>
            <input type="number" step="0.01" min="0.01" max="${calc.amountDue}" id="m-pay-amount" class="form-control" value="${calc.amountDue}">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Payment Date</label>
              <input type="date" id="m-pay-date" class="form-control" value="${getTodayDateString()}">
            </div>
            <div class="form-group">
              <label class="form-label">Payment Method</label>
              <select id="m-pay-method" class="form-control">
                <option value="Bank Transfer">Bank Wire / ACH</option>
                <option value="Credit Card">Credit Card</option>
                <option value="PayPal">PayPal</option>
                <option value="Stripe">Stripe</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="Crypto">Crypto</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Reference / Transaction ID</label>
            <input type="text" id="m-pay-ref" class="form-control" placeholder="e.g. TXN-994821">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
          <button type="button" id="btn-save-payment-modal" class="btn btn-success">
            ${getIcon('check')} Record Payment
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    const closeModal = () => modalEl.remove();
    modalEl.querySelector('.modal-close')?.addEventListener('click', closeModal);
    modalEl.querySelector('.modal-cancel')?.addEventListener('click', closeModal);

    modalEl.querySelector('#btn-save-payment-modal')?.addEventListener('click', () => {
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

  showEmailModal(docId) {
    const doc = DocumentRepo.getById(docId);
    if (!doc) return;
    const settings = SettingsRepo.get();
    const calc = calculateDocument(doc, settings);
    const docCurrency = doc.currency || settings.currency || 'USD';
    const isInvoice = doc.type === 'invoice';
    const clientEmail = doc.customer?.email || '';
    const clientName = doc.customer?.name || 'Valued Customer';
    const bizName = settings.business?.name || 'Our Company';

    const defaultSubject = `${isInvoice ? 'Invoice' : 'Quote'} ${doc.number} from ${bizName}`;
    const defaultBody = `Dear ${clientName},

Please find attached details for ${isInvoice ? 'Invoice' : 'Quote'} ${doc.number}.

Summary:
- Document: ${isInvoice ? 'Invoice' : 'Quote'} ${doc.number}
- Date: ${formatDate(doc.date)}
${isInvoice && doc.dueDate ? `- Due Date: ${formatDate(doc.dueDate)}\n` : ''}${!isInvoice && doc.expirationDate ? `- Expiration Date: ${formatDate(doc.expirationDate)}\n` : ''}- Total Amount: ${formatCurrency(calc.grandTotal, docCurrency)}
${isInvoice && calc.amountDue > 0 ? `- Balance Due: ${formatCurrency(calc.amountDue, docCurrency)}\n` : ''}
${settings.business?.paymentInfo ? `\nPayment Details:\n${settings.business.paymentInfo}\n` : ''}
Thank you for your business.

Best regards,
${bizName}
${settings.business?.email || ''}
${settings.business?.phone || ''}`;

    const modalEl = document.createElement('div');
    modalEl.className = 'modal-overlay active';

    modalEl.innerHTML = `
      <div class="modal-card" style="max-width: 620px;">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Send ${isInvoice ? 'Invoice' : 'Quote'} via Email</h3>
            <div style="font-size: 12px; color: var(--text-secondary);">${doc.number} • ${formatCurrency(calc.grandTotal, docCurrency)}</div>
          </div>
          <button class="btn btn-subtle btn-sm btn-icon-only modal-close">${getIcon('x')}</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label required">Recipient Email</label>
            <input type="email" id="m-email-to" class="form-control" value="${clientEmail}" placeholder="recipient@example.com">
          </div>
          <div class="form-group">
            <label class="form-label required">Subject Line</label>
            <input type="text" id="m-email-subject" class="form-control" value="${defaultSubject}">
          </div>
          <div class="form-group">
            <label class="form-label required">Message Body</label>
            <textarea id="m-email-body" class="form-control" style="min-height: 180px; font-family: var(--font-sans); font-size: 13px; line-height: 1.5;">${defaultBody}</textarea>
          </div>
        </div>
        <div class="modal-footer" style="justify-content: space-between;">
          <button type="button" id="btn-copy-email-text" class="btn btn-subtle">
            ${getIcon('copy')} Copy Message Text
          </button>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary modal-cancel">Cancel</button>
            <button type="button" id="btn-open-mailto" class="btn btn-primary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              Open in Email Client
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    const closeModal = () => modalEl.remove();
    modalEl.querySelector('.modal-close')?.addEventListener('click', closeModal);
    modalEl.querySelector('.modal-cancel')?.addEventListener('click', closeModal);

    modalEl.querySelector('#btn-copy-email-text')?.addEventListener('click', () => {
      const text = modalEl.querySelector('#m-email-body')?.value || '';
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('Copied', 'Email message text copied to clipboard.', 'success');
      }).catch(() => {
        this.showToast('Notice', 'Please select and copy the text manually.', 'info');
      });
    });

    modalEl.querySelector('#btn-open-mailto')?.addEventListener('click', () => {
      const to = encodeURIComponent(modalEl.querySelector('#m-email-to')?.value || '');
      const subject = encodeURIComponent(modalEl.querySelector('#m-email-subject')?.value || '');
      const body = encodeURIComponent(modalEl.querySelector('#m-email-body')?.value || '');

      // Mark document as Sent if it was Draft
      if (doc.status === 'Draft') {
        doc.status = 'Sent';
        DocumentRepo.save(doc);
        this.showToast('Status Updated', `Marked ${doc.number} as Sent`, 'info');
      }

      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
      closeModal();
    });
  }
}

// Bootstrap Application
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
