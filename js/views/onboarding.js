/**
 * First-Run Onboarding Wizard
 */

import { SettingsRepo, DataRepo } from '../storage/repository.js';
import { CURRENCIES } from '../engine/formatter.js';
import { getIcon } from '../../assets/icons.js';

export const OnboardingWizard = {
  step: 1,

  show(onComplete) {
    this.onComplete = onComplete;
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'modal-overlay active';
    this.modalEl.id = 'onboarding-modal';
    this.modalEl.style.zIndex = '500';

    this.businessData = {
      name: '',
      email: '',
      phone: '',
      address: '',
      currency: 'USD',
      taxName: 'Sales Tax',
      taxRate: 8.5,
      taxMode: 'exclusive',
      invoicePrefix: 'INV-',
      loadDemoData: true
    };

    document.body.appendChild(this.modalEl);
    this.renderStep();
  },

  renderStep() {
    this.modalEl.innerHTML = `
      <div class="modal-card" style="max-width: 520px;">
        <div class="modal-header" style="background: linear-gradient(135deg, var(--primary), var(--accent)); color: white;">
          <div>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9;">
              Step ${this.step} of 3 • Quick Setup
            </div>
            <h2 style="font-size: 18px; font-weight: 800; color: white; margin-top: 2px;">
              ${this.step === 1 ? 'Welcome to InvoiceMaster' : (this.step === 2 ? 'Currency & Tax Configuration' : 'Document Preferences')}
            </h2>
          </div>
        </div>

        <div class="modal-body">
          ${this.step === 1 ? `
            <p style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 18px;">
              Let's set up your business details so your invoices and quotes look professional right from the start.
            </p>
            <div class="form-group">
              <label class="form-label required">Business / Freelancer Name</label>
              <input type="text" id="ob-biz-name" class="form-control" placeholder="e.g. Apex Design Studio" value="${this.businessData.name}">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Billing Email</label>
                <input type="email" id="ob-biz-email" class="form-control" placeholder="billing@company.com" value="${this.businessData.email}">
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="text" id="ob-biz-phone" class="form-control" placeholder="+1 (555) 000-0000" value="${this.businessData.phone}">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Business Address</label>
              <textarea id="ob-biz-address" class="form-control" placeholder="City, State, Country">${this.businessData.address}</textarea>
            </div>
          ` : (this.step === 2 ? `
            <p style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 18px;">
              Specify the default currency and tax rules used for financial calculations.
            </p>
            <div class="form-group">
              <label class="form-label">Default Currency</label>
              <select id="ob-currency" class="form-control">
                ${Object.values(CURRENCIES).map(c => `
                  <option value="${c.code}" ${this.businessData.currency === c.code ? 'selected' : ''}>
                    ${c.code} (${c.symbol.trim()}) - ${c.name}
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Tax Label (e.g. VAT, GST, Sales Tax)</label>
                <input type="text" id="ob-tax-name" class="form-control" value="${this.businessData.taxName}">
              </div>
              <div class="form-group">
                <label class="form-label">Default Tax Rate (%)</label>
                <input type="number" step="0.01" min="0" id="ob-tax-rate" class="form-control" value="${this.businessData.taxRate}">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Pricing Mode</label>
              <select id="ob-tax-mode" class="form-control">
                <option value="exclusive" ${this.businessData.taxMode === 'exclusive' ? 'selected' : ''}>Tax Exclusive (Tax added on top of prices)</option>
                <option value="inclusive" ${this.businessData.taxMode === 'inclusive' ? 'selected' : ''}>Tax Inclusive (Prices already include tax)</option>
              </select>
            </div>
          ` : `
            <p style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 18px;">
              Customize your numbering sequence and decide if you want sample data for a quick tour.
            </p>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Invoice Prefix</label>
                <input type="text" id="ob-inv-prefix" class="form-control" value="${this.businessData.invoicePrefix}">
              </div>
            </div>
            <div style="margin-top: 18px; padding: 14px; border-radius: var(--radius-md); background: var(--bg-surface-subtle); border: 1px solid var(--border-subtle);">
              <label class="checkbox-label" style="font-weight: 600;">
                <input type="checkbox" id="ob-load-demo" ${this.businessData.loadDemoData ? 'checked' : ''}>
                Load sample demo data (customers, products, invoices, quotes)
              </label>
              <div style="font-size: 12px; color: var(--text-muted); margin-left: 24px; margin-top: 4px;">
                You can easily clear or remove demo records anytime from Settings.
              </div>
            </div>
          `)}
        </div>

        <div class="modal-footer">
          ${this.step > 1 ? `
            <button type="button" id="btn-ob-prev" class="btn btn-secondary btn-sm">
              Back
            </button>
          ` : ''}
          <button type="button" id="btn-ob-next" class="btn btn-primary btn-sm">
            ${this.step === 3 ? 'Finish & Launch' : 'Continue'}
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const syncData = () => {
      if (this.step === 1) {
        this.businessData.name = this.modalEl.querySelector('#ob-biz-name')?.value || '';
        this.businessData.email = this.modalEl.querySelector('#ob-biz-email')?.value || '';
        this.businessData.phone = this.modalEl.querySelector('#ob-biz-phone')?.value || '';
        this.businessData.address = this.modalEl.querySelector('#ob-biz-address')?.value || '';
      } else if (this.step === 2) {
        this.businessData.currency = this.modalEl.querySelector('#ob-currency')?.value || 'USD';
        this.businessData.taxName = this.modalEl.querySelector('#ob-tax-name')?.value || 'Sales Tax';
        this.businessData.taxRate = parseFloat(this.modalEl.querySelector('#ob-tax-rate')?.value) || 0;
        this.businessData.taxMode = this.modalEl.querySelector('#ob-tax-mode')?.value || 'exclusive';
      } else if (this.step === 3) {
        this.businessData.invoicePrefix = this.modalEl.querySelector('#ob-inv-prefix')?.value || 'INV-';
        this.businessData.loadDemoData = this.modalEl.querySelector('#ob-load-demo')?.checked;
      }
    };

    this.modalEl.querySelector('#btn-ob-prev')?.addEventListener('click', () => {
      syncData();
      this.step = Math.max(1, this.step - 1);
      this.renderStep();
    });

    this.modalEl.querySelector('#btn-ob-next')?.addEventListener('click', () => {
      syncData();
      if (this.step === 1 && !this.businessData.name.trim()) {
        window.app.showToast('Notice', 'Please enter your business or trading name.', 'warning');
        return;
      }

      if (this.step < 3) {
        this.step += 1;
        this.renderStep();
      } else {
        // Complete Onboarding
        this.finish();
      }
    });
  },

  finish() {
    if (this.businessData.loadDemoData) {
      DataRepo.loadDemoData();
      const settings = SettingsRepo.get();
      settings.business.name = this.businessData.name || settings.business.name;
      settings.business.email = this.businessData.email || settings.business.email;
      settings.business.phone = this.businessData.phone || settings.business.phone;
      settings.business.address = this.businessData.address || settings.business.address;
      settings.currency = this.businessData.currency;
      settings.taxName = this.businessData.taxName;
      settings.taxRate = this.businessData.taxRate;
      settings.taxMode = this.businessData.taxMode;
      settings.invoicePrefix = this.businessData.invoicePrefix;
      settings.isOnboarded = true;
      SettingsRepo.save(settings);
    } else {
      DataRepo.clearAllData();
      const settings = SettingsRepo.get();
      settings.business = {
        name: this.businessData.name,
        email: this.businessData.email,
        phone: this.businessData.phone,
        address: this.businessData.address
      };
      settings.currency = this.businessData.currency;
      settings.taxName = this.businessData.taxName;
      settings.taxRate = this.businessData.taxRate;
      settings.taxMode = this.businessData.taxMode;
      settings.invoicePrefix = this.businessData.invoicePrefix;
      settings.isOnboarded = true;
      SettingsRepo.save(settings);
    }

    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
    }

    if (typeof this.onComplete === 'function') {
      this.onComplete();
    }
  }
};
