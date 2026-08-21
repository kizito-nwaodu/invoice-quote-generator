/**
 * Application & Business Settings View Controller
 */

import { SettingsRepo, DataRepo } from '../storage/repository.js';
import { BackupManager } from '../export/backup.js';
import { CURRENCIES } from '../engine/formatter.js';
import { getIcon } from '../../assets/icons.js';

export const SettingsView = {
  activeTab: 'business', // 'business' | 'documents' | 'branding' | 'backup'

  render(container) {
    this.container = container;
    const settings = SettingsRepo.get();
    const business = settings.business || {};

    container.innerHTML = `
      <div class="view-container">
        <!-- Header -->
        <div class="toolbar">
          <div>
            <h1 style="font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Settings</h1>
            <p style="color: var(--text-secondary); font-size: 13.5px; margin-top: 2px;">
              Configure your business profile, numbering rules, branding, and data backups.
            </p>
          </div>
          <button id="btn-save-settings" class="btn btn-primary">
            ${getIcon('check')} Save Changes
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="segmented-control" style="margin-bottom: 24px;">
          <button class="segment-btn ${this.activeTab === 'business' ? 'active' : ''}" data-tab="business">Business Profile</button>
          <button class="segment-btn ${this.activeTab === 'documents' ? 'active' : ''}" data-tab="documents">Invoicing & Taxes</button>
          <button class="segment-btn ${this.activeTab === 'branding' ? 'active' : ''}" data-tab="branding">Branding & Templates</button>
          <button class="segment-btn ${this.activeTab === 'backup' ? 'active' : ''}" data-tab="backup">Data Backup & Demo Data</button>
        </div>

        <!-- Tab 1: Business Profile -->
        <div id="tab-business" class="tab-pane ${this.activeTab === 'business' ? 'active' : ''}" style="${this.activeTab === 'business' ? '' : 'display: none;'}">
          <div class="card">
            <h2 class="card-title" style="margin-bottom: 18px;">${getIcon('users')} Business Information</h2>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">Business / Trading Name</label>
                <input type="text" id="biz-name" class="form-control" value="${business.name || ''}" placeholder="e.g. Apex Digital Studio LLC">
              </div>
              <div class="form-group">
                <label class="form-label">Tagline / Subtitle</label>
                <input type="text" id="biz-tagline" class="form-control" value="${business.tagline || ''}" placeholder="e.g. Web Engineering & Design">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Billing Email</label>
                <input type="email" id="biz-email" class="form-control" value="${business.email || ''}" placeholder="billing@company.com">
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="text" id="biz-phone" class="form-control" value="${business.phone || ''}" placeholder="+1 (555) 000-0000">
              </div>
              <div class="form-group">
                <label class="form-label">Website</label>
                <input type="text" id="biz-website" class="form-control" value="${business.website || ''}" placeholder="https://yourwebsite.com">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Physical / Billing Address</label>
                <textarea id="biz-address" class="form-control" placeholder="123 Business Street, Suite 100&#10;City, State 12345">${business.address || ''}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Default Payment Instructions (Wire / Bank / PayPal)</label>
                <textarea id="biz-payment-info" class="form-control" placeholder="Bank: Silicon Valley Bank&#10;Account: 1234-5678-90&#10;Routing: 021000021&#10;PayPal: pay@company.com">${business.paymentInfo || ''}</textarea>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Tax / VAT ID Number</label>
                <input type="text" id="biz-tax-number" class="form-control" value="${business.taxNumber || ''}" placeholder="e.g. VAT-GB-123456789">
              </div>
              <div class="form-group">
                <label class="form-label">Business Registration / Company Number</label>
                <input type="text" id="biz-reg-number" class="form-control" value="${business.regNumber || ''}" placeholder="e.g. RC-9920194">
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Invoicing & Taxes -->
        <div id="tab-documents" class="tab-pane ${this.activeTab === 'documents' ? 'active' : ''}" style="${this.activeTab === 'documents' ? '' : 'display: none;'}">
          <div class="card">
            <h2 class="card-title" style="margin-bottom: 18px;">${getIcon('fileText')} Document Numbering & Rules</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Invoice Prefix</label>
                <input type="text" id="set-inv-prefix" class="form-control" value="${settings.invoicePrefix || 'INV-'}">
              </div>
              <div class="form-group">
                <label class="form-label">Next Invoice Counter</label>
                <input type="number" id="set-inv-counter" class="form-control" value="${settings.invoiceNextNum || 1}" min="1">
              </div>
              <div class="form-group">
                <label class="form-label">Quote Prefix</label>
                <input type="text" id="set-quo-prefix" class="form-control" value="${settings.quotePrefix || 'QUO-'}">
              </div>
              <div class="form-group">
                <label class="form-label">Next Quote Counter</label>
                <input type="number" id="set-quo-counter" class="form-control" value="${settings.quoteNextNum || 1}" min="1">
              </div>
            </div>

            <div class="form-row" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">Default Currency</label>
                <select id="set-currency" class="form-control">
                  ${Object.values(CURRENCIES).map(c => `
                    <option value="${c.code}" ${settings.currency === c.code ? 'selected' : ''}>
                      ${c.code} (${c.symbol.trim()}) - ${c.name}
                    </option>
                  `).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Default Payment Due Period (Days)</label>
                <select id="set-payment-terms" class="form-control">
                  <option value="0" ${settings.defaultPaymentTerms === '0' ? 'selected' : ''}>Due on Receipt</option>
                  <option value="7" ${settings.defaultPaymentTerms === '7' ? 'selected' : ''}>Net 7 Days</option>
                  <option value="14" ${settings.defaultPaymentTerms === '14' ? 'selected' : ''}>Net 14 Days</option>
                  <option value="30" ${settings.defaultPaymentTerms === '30' ? 'selected' : ''}>Net 30 Days</option>
                  <option value="60" ${settings.defaultPaymentTerms === '60' ? 'selected' : ''}>Net 60 Days</option>
                </select>
              </div>
            </div>

            <h2 class="card-title" style="margin-top: 24px; margin-bottom: 18px;">${getIcon('dollarSign')} Tax System Configuration</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Tax Label / Terminology</label>
                <input type="text" id="set-tax-name" class="form-control" value="${settings.taxName || 'Sales Tax'}" placeholder="e.g. VAT, GST, Sales Tax, IVA">
              </div>
              <div class="form-group">
                <label class="form-label">Default Tax Rate (%)</label>
                <input type="number" step="0.01" min="0" id="set-tax-rate" class="form-control" value="${settings.taxRate !== undefined ? settings.taxRate : 8.5}">
              </div>
              <div class="form-group">
                <label class="form-label">Pricing Mode</label>
                <select id="set-tax-mode" class="form-control">
                  <option value="exclusive" ${settings.taxMode === 'exclusive' ? 'selected' : ''}>Tax Exclusive (Taxes added on top)</option>
                  <option value="inclusive" ${settings.taxMode === 'inclusive' ? 'selected' : ''}>Tax Inclusive (Prices already include tax)</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-top: 14px;">
              <label class="form-label">Default Terms & Conditions / Footer Note</label>
              <textarea id="set-footer-notes" class="form-control" placeholder="Thank you for your business! Payment is due within 14 days.">${business.footerNotes || ''}</textarea>
            </div>
          </div>
        </div>

        <!-- Tab 3: Branding & Templates -->
        <div id="tab-branding" class="tab-pane ${this.activeTab === 'branding' ? 'active' : ''}" style="${this.activeTab === 'branding' ? '' : 'display: none;'}">
          <div class="card">
            <h2 class="card-title" style="margin-bottom: 18px;">${getIcon('sparkles')} Visual Identity & Logo</h2>
            
            <div style="display: flex; gap: 24px; align-items: center; margin-bottom: 24px;">
              <div class="logo-preview-box" style="width: 100px; height: 100px;">
                ${business.logo ? `<img id="preview-logo-img" src="${business.logo}" alt="Logo">` : `<span id="preview-logo-empty" style="font-size: 11px; color: var(--text-muted);">No Logo</span>`}
              </div>
              <div>
                <label class="btn btn-secondary btn-sm" style="cursor: pointer;">
                  ${getIcon('upload')} Upload Business Logo
                  <input type="file" id="logo-file-input" accept="image/*" style="display: none;">
                </label>
                ${business.logo ? `
                  <button type="button" id="btn-remove-logo" class="btn btn-subtle btn-sm" style="color: #ef4444; margin-left: 8px;">
                    Remove Logo
                  </button>
                ` : ''}
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">
                  Recommended: PNG or JPEG format, at least 300x100px.
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Default Document Template</label>
                <select id="set-default-template" class="form-control">
                  <option value="modern" ${settings.defaultTemplate === 'modern' ? 'selected' : ''}>Modern Pro (Clean Accent Bar)</option>
                  <option value="classic" ${settings.defaultTemplate === 'classic' ? 'selected' : ''}>Classic Corporate (Boxed & Formal)</option>
                  <option value="minimal" ${settings.defaultTemplate === 'minimal' ? 'selected' : ''}>Minimal Clean (High Contrast & Airy)</option>
                  <option value="bold" ${settings.defaultTemplate === 'bold' ? 'selected' : ''}>Bold Studio (Dark Header Band)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Brand Primary Color</label>
                <div style="display: flex; gap: 10px; align-items: center;">
                  <input type="color" id="set-brand-color" value="${settings.brandColor || '#2563eb'}" style="width: 44px; height: 38px; padding: 2px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); cursor: pointer;">
                  <input type="text" id="set-brand-color-text" class="form-control" value="${settings.brandColor || '#2563eb'}" style="width: 120px;">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 4: Data Backup & Safety -->
        <div id="tab-backup" class="tab-pane ${this.activeTab === 'backup' ? 'active' : ''}" style="${this.activeTab === 'backup' ? '' : 'display: none;'}">
          <div class="card" style="margin-bottom: 20px;">
            <h2 class="card-title" style="margin-bottom: 12px;">${getIcon('download')} Backup & Data Export</h2>
            <p style="color: var(--text-secondary); font-size: 13.5px; margin-bottom: 18px;">
              Download a complete, portable JSON backup of all your invoices, quotes, customer directory, product catalog, and settings.
            </p>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <button type="button" id="btn-export-backup" class="btn btn-primary">
                ${getIcon('download')} Export JSON Backup
              </button>
              <label class="btn btn-secondary" style="cursor: pointer;">
                ${getIcon('upload')} Restore From JSON Backup
                <input type="file" id="import-file-input" accept=".json" style="display: none;">
              </label>
            </div>
          </div>

          <div class="card" style="margin-bottom: 20px;">
            <h2 class="card-title" style="margin-bottom: 12px;">${getIcon('sparkles')} Demo & Sample Data</h2>
            <p style="color: var(--text-secondary); font-size: 13.5px; margin-bottom: 18px;">
              Load or remove realistic sample invoices, quotes, products, and customers for instant testing.
            </p>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <button type="button" id="btn-load-demo-data" class="btn btn-subtle">
                ${getIcon('sparkles')} Load Demo Data
              </button>
              <button type="button" id="btn-clear-demo-data" class="btn btn-subtle" style="color: #ea580c;">
                ${getIcon('trash')} Remove Demo Data Only
              </button>
            </div>
          </div>

          <div class="card" style="border-color: #fca5a5; background: #fff5f5;">
            <h2 class="card-title" style="color: #b91c1c; margin-bottom: 8px;">${getIcon('alertCircle')} Factory Reset</h2>
            <p style="color: #7f1d1d; font-size: 13px; margin-bottom: 16px;">
              Permanently clear all data and reset the workspace to a blank state. This action cannot be undone unless you have an exported JSON backup.
            </p>
            <button type="button" id="btn-factory-reset" class="btn btn-danger btn-sm">
              ${getIcon('trash')} Clear All Data (Reset App)
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    // Tabs Navigation
    this.container.querySelectorAll('.segment-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        this.render(this.container);
      });
    });

    // Logo upload
    const logoInput = this.container.querySelector('#logo-file-input');
    if (logoInput) {
      logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const base64 = evt.target.result;
            const settings = SettingsRepo.get();
            settings.business = settings.business || {};
            settings.business.logo = base64;
            SettingsRepo.save(settings);
            window.app.showToast('Logo Updated', 'Business logo uploaded successfully.', 'success');
            this.render(this.container);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Remove logo
    this.container.querySelector('#btn-remove-logo')?.addEventListener('click', () => {
      const settings = SettingsRepo.get();
      settings.business = settings.business || {};
      settings.business.logo = '';
      SettingsRepo.save(settings);
      window.app.showToast('Logo Removed', 'Business logo cleared.', 'info');
      this.render(this.container);
    });

    // Brand color sync
    const brandColorInput = this.container.querySelector('#set-brand-color');
    const brandColorText = this.container.querySelector('#set-brand-color-text');
    if (brandColorInput && brandColorText) {
      brandColorInput.addEventListener('input', (e) => {
        brandColorText.value = e.target.value;
      });
      brandColorText.addEventListener('input', (e) => {
        brandColorInput.value = e.target.value;
      });
    }

    // Save Settings
    this.container.querySelector('#btn-save-settings')?.addEventListener('click', () => {
      const settings = SettingsRepo.get();
      
      const updatedBusiness = {
        name: this.container.querySelector('#biz-name')?.value || '',
        tagline: this.container.querySelector('#biz-tagline')?.value || '',
        email: this.container.querySelector('#biz-email')?.value || '',
        phone: this.container.querySelector('#biz-phone')?.value || '',
        website: this.container.querySelector('#biz-website')?.value || '',
        address: this.container.querySelector('#biz-address')?.value || '',
        paymentInfo: this.container.querySelector('#biz-payment-info')?.value || '',
        taxNumber: this.container.querySelector('#biz-tax-number')?.value || '',
        regNumber: this.container.querySelector('#biz-reg-number')?.value || '',
        footerNotes: this.container.querySelector('#set-footer-notes')?.value || '',
        logo: settings.business?.logo || ''
      };

      const updatedSettings = {
        business: updatedBusiness,
        invoicePrefix: this.container.querySelector('#set-inv-prefix')?.value || 'INV-',
        invoiceNextNum: parseInt(this.container.querySelector('#set-inv-counter')?.value, 10) || 1,
        quotePrefix: this.container.querySelector('#set-quo-prefix')?.value || 'QUO-',
        quoteNextNum: parseInt(this.container.querySelector('#set-quo-counter')?.value, 10) || 1,
        currency: this.container.querySelector('#set-currency')?.value || 'USD',
        defaultPaymentTerms: this.container.querySelector('#set-payment-terms')?.value || '14',
        taxName: this.container.querySelector('#set-tax-name')?.value || 'Sales Tax',
        taxRate: parseFloat(this.container.querySelector('#set-tax-rate')?.value) || 0,
        taxMode: this.container.querySelector('#set-tax-mode')?.value || 'exclusive',
        defaultTemplate: this.container.querySelector('#set-default-template')?.value || 'modern',
        brandColor: this.container.querySelector('#set-brand-color')?.value || '#2563eb'
      };

      SettingsRepo.save(updatedSettings);
      window.app.showToast('Settings Saved', 'Configuration updated successfully.', 'success');
    });

    // Export Backup
    this.container.querySelector('#btn-export-backup')?.addEventListener('click', () => {
      BackupManager.exportJSON();
      window.app.showToast('Backup Exported', 'Downloaded backup JSON file.', 'success');
    });

    // Import Backup
    const importInput = this.container.querySelector('#import-file-input');
    if (importInput) {
      importInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            const res = await BackupManager.importJSON(file);
            window.app.showToast('Restore Complete', res.message, 'success');
            this.render(this.container);
          } catch (err) {
            window.app.showToast('Import Failed', err.message, 'error');
          }
        }
      });
    }

    // Load Demo Data
    this.container.querySelector('#btn-load-demo-data')?.addEventListener('click', () => {
      if (confirm('Load realistic sample invoices, quotes, products, and customers into your workspace?')) {
        DataRepo.loadDemoData();
        window.app.showToast('Demo Data Loaded', 'Sample records added successfully.', 'success');
        this.render(this.container);
      }
    });

    // Clear Demo Data
    this.container.querySelector('#btn-clear-demo-data')?.addEventListener('click', () => {
      if (confirm('Remove all demo records while preserving your own custom records?')) {
        DataRepo.clearDemoData();
        window.app.showToast('Demo Data Cleared', 'All demo records removed.', 'info');
        this.render(this.container);
      }
    });

    // Factory Reset
    this.container.querySelector('#btn-factory-reset')?.addEventListener('click', () => {
      if (confirm('DANGER: This will permanently delete ALL invoices, quotes, customers, and settings. Are you sure you want to reset everything?')) {
        DataRepo.clearAllData();
        window.app.showToast('App Reset', 'Workspace has been cleared.', 'info');
        window.location.hash = '#/dashboard';
      }
    });
  }
};
