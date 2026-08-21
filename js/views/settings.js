/**
 * Settings & Business Configuration View
 * Manages Business Identity, Invoicing Defaults, Branding, Taxes, Account & Workspace Deletion, and Data Backup/Restore.
 */

import { SettingsRepo, DataRepo } from '../storage/repository.js';
import { BackupManager } from '../export/backup.js';
import { Auth, Session } from '../auth/auth.js';
import { getIcon } from '../../assets/icons.js';

export const SettingsView = {
  activeTab: 'business', // 'business' | 'defaults' | 'branding' | 'account' | 'backup'

  render(container) {
    this.container = container;
    const settings = SettingsRepo.get();
    const business = settings.business || {};
    const currentUser = Auth.currentUser() || { name: 'User', email: 'user@example.com' };
    const currentOrg = Auth.currentOrg() || { id: 'org_default', name: 'My Workspace', plan: 'Free' };
    const allUserOrgs = Auth.currentUserOrgs();

    const colorPresets = [
      { name: 'Royal Blue', hex: '#2563eb' },
      { name: 'Indigo', hex: '#4f46e5' },
      { name: 'Emerald', hex: '#059669' },
      { name: 'Crimson', hex: '#dc2626' },
      { name: 'Deep Violet', hex: '#7c3aed' },
      { name: 'Midnight Slate', hex: '#0f172a' },
      { name: 'Warm Amber', hex: '#d97706' },
      { name: 'Teal Cyan', hex: '#0d9488' }
    ];

    const currentBrandColor = settings.brandColor || '#2563eb';
    const currentBrandFont = settings.brandFont || 'Inter';
    const currentTemplate = settings.defaultTemplate || 'modern';

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Workspace Settings</h1>
          <p class="view-subtitle">Customize business details, branding identity, invoice numbering, accounts, and data management.</p>
        </div>
        <div>
          <button type="button" id="btn-save-settings" class="btn btn-primary">
            ${getIcon('save')} Save Changes
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="segment-control" style="margin-bottom: 24px; max-width: 750px;">
        <button type="button" class="segment-btn ${this.activeTab === 'business' ? 'active' : ''}" data-tab="business">
          Business Profile
        </button>
        <button type="button" class="segment-btn ${this.activeTab === 'defaults' ? 'active' : ''}" data-tab="defaults">
          Invoicing Defaults
        </button>
        <button type="button" class="segment-btn ${this.activeTab === 'branding' ? 'active' : ''}" data-tab="branding">
          Branding & Identity
        </button>
        <button type="button" class="segment-btn ${this.activeTab === 'account' ? 'active' : ''}" data-tab="account">
          Account & Workspaces
        </button>
        <button type="button" class="segment-btn ${this.activeTab === 'backup' ? 'active' : ''}" data-tab="backup">
          Data & Backup
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="settings-content-wrapper">
        
        <!-- Tab 1: Business Profile -->
        <div id="tab-business" class="tab-pane ${this.activeTab === 'business' ? 'active' : ''}" style="${this.activeTab === 'business' ? '' : 'display: none;'}">
          <div class="card" style="margin-bottom: 20px;">
            <h2 class="card-title" style="margin-bottom: 18px;">${getIcon('building')} Business Contact Information</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Business / Legal Name *</label>
                <input type="text" id="biz-name" class="form-control" value="${business.name || ''}" placeholder="e.g. Acme Creative Studio LLC">
              </div>
              <div class="form-group">
                <label class="form-label">Tagline or Subtitle</label>
                <input type="text" id="biz-tagline" class="form-control" value="${business.tagline || ''}" placeholder="e.g. Design & Development Agency">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" id="biz-email" class="form-control" value="${business.email || ''}" placeholder="billing@yourdomain.com">
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="text" id="biz-phone" class="form-control" value="${business.phone || ''}" placeholder="+1 (555) 019-2834">
              </div>
              <div class="form-group">
                <label class="form-label">Website</label>
                <input type="text" id="biz-website" class="form-control" value="${business.website || ''}" placeholder="https://yourdomain.com">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Physical / Postal Address</label>
              <textarea id="biz-address" class="form-control" rows="3" placeholder="123 Innovation Way, Suite 400&#10;San Francisco, CA 94107&#10;United States">${business.address || ''}</textarea>
            </div>
          </div>

          <div class="card" style="margin-bottom: 20px;">
            <h2 class="card-title" style="margin-bottom: 18px;">${getIcon('fileText')} Legal & Tax Identifiers</h2>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Tax ID / VAT / GST Number</label>
                <input type="text" id="biz-tax-number" class="form-control" value="${business.taxNumber || ''}" placeholder="e.g. US-EIN: 12-3456789 or GB987654321">
              </div>
              <div class="form-group">
                <label class="form-label">Company Registration Number</label>
                <input type="text" id="biz-reg-number" class="form-control" value="${business.regNumber || ''}" placeholder="e.g. Reg # 08472910">
              </div>
            </div>
          </div>

          <div class="card">
            <h2 class="card-title" style="margin-bottom: 18px;">${getIcon('creditCard')} Payment Instructions & Bank Details</h2>
            <div class="form-group">
              <label class="form-label">Default Payment Instructions (shown on invoices)</label>
              <textarea id="biz-payment-info" class="form-control" rows="4" placeholder="Bank: Silicon Valley Bank&#10;Account Name: Acme Creative LLC&#10;IBAN / Account #: US89 3704 0044 0532 0130 00&#10;Routing / Swift: SVBUS6S">${business.paymentInfo || ''}</textarea>
            </div>
          </div>
        </div>

        <!-- Tab 2: Invoicing Defaults -->
        <div id="tab-defaults" class="tab-pane ${this.activeTab === 'defaults' ? 'active' : ''}" style="${this.activeTab === 'defaults' ? '' : 'display: none;'}">
          <div class="card" style="margin-bottom: 20px;">
            <h2 class="card-title" style="margin-bottom: 18px;">${getIcon('hashtag')} Numbering Sequences</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Invoice Number Prefix</label>
                <input type="text" id="set-inv-prefix" class="form-control" value="${settings.invoicePrefix || 'INV-'}" placeholder="INV-">
              </div>
              <div class="form-group">
                <label class="form-label">Next Invoice Counter</label>
                <input type="number" id="set-inv-counter" class="form-control" value="${settings.invoiceNextNum || 1}" min="1">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Quote Number Prefix</label>
                <input type="text" id="set-quo-prefix" class="form-control" value="${settings.quotePrefix || 'QUO-'}" placeholder="QUO-">
              </div>
              <div class="form-group">
                <label class="form-label">Next Quote Counter</label>
                <input type="number" id="set-quo-counter" class="form-control" value="${settings.quoteNextNum || 1}" min="1">
              </div>
            </div>
          </div>

          <div class="card" style="margin-bottom: 20px;">
            <h2 class="card-title" style="margin-bottom: 18px;">${getIcon('dollarSign')} Currency & Payment Terms</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Default Currency</label>
                <select id="set-currency" class="form-control">
                  <option value="USD" ${settings.currency === 'USD' ? 'selected' : ''}>USD ($) — US Dollar</option>
                  <option value="EUR" ${settings.currency === 'EUR' ? 'selected' : ''}>EUR (€) — Euro</option>
                  <option value="GBP" ${settings.currency === 'GBP' ? 'selected' : ''}>GBP (£) — British Pound</option>
                  <option value="CAD" ${settings.currency === 'CAD' ? 'selected' : ''}>CAD ($) — Canadian Dollar</option>
                  <option value="AUD" ${settings.currency === 'AUD' ? 'selected' : ''}>AUD ($) — Australian Dollar</option>
                  <option value="NGN" ${settings.currency === 'NGN' ? 'selected' : ''}>NGN (₦) — Nigerian Naira</option>
                  <option value="INR" ${settings.currency === 'INR' ? 'selected' : ''}>INR (₹) — Indian Rupee</option>
                  <option value="JPY" ${settings.currency === 'JPY' ? 'selected' : ''}>JPY (¥) — Japanese Yen</option>
                  <option value="CHF" ${settings.currency === 'CHF' ? 'selected' : ''}>CHF (Fr) — Swiss Franc</option>
                  <option value="ZAR" ${settings.currency === 'ZAR' ? 'selected' : ''}>ZAR (R) — South African Rand</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Default Payment Terms (Days)</label>
                <select id="set-payment-terms" class="form-control">
                  <option value="0" ${settings.defaultPaymentTerms === '0' ? 'selected' : ''}>Due on Receipt</option>
                  <option value="7" ${settings.defaultPaymentTerms === '7' ? 'selected' : ''}>Net 7 Days</option>
                  <option value="14" ${settings.defaultPaymentTerms === '14' || !settings.defaultPaymentTerms ? 'selected' : ''}>Net 14 Days</option>
                  <option value="30" ${settings.defaultPaymentTerms === '30' ? 'selected' : ''}>Net 30 Days</option>
                  <option value="60" ${settings.defaultPaymentTerms === '60' ? 'selected' : ''}>Net 60 Days</option>
                </select>
              </div>
            </div>
          </div>

          <div class="card">
            <h2 class="card-title" style="margin-bottom: 18px;">${getIcon('percent')} Default Tax Rate & Mode</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Tax Label Name</label>
                <input type="text" id="set-tax-name" class="form-control" value="${settings.taxName || 'Sales Tax'}" placeholder="e.g. VAT, GST, Sales Tax">
              </div>
              <div class="form-group">
                <label class="form-label">Default Rate (%)</label>
                <input type="number" id="set-tax-rate" class="form-control" value="${settings.taxRate || 0}" step="0.1" min="0" max="100">
              </div>
              <div class="form-group">
                <label class="form-label">Tax Mode</label>
                <select id="set-tax-mode" class="form-control">
                  <option value="exclusive" ${settings.taxMode === 'exclusive' || !settings.taxMode ? 'selected' : ''}>Tax-Exclusive (Added on top)</option>
                  <option value="inclusive" ${settings.taxMode === 'inclusive' ? 'selected' : ''}>Tax-Inclusive (Included in price)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Default Document Footer Terms & Notes</label>
              <textarea id="set-footer-notes" class="form-control" rows="3" placeholder="e.g. Thank you for your business. Please remit payment by the due date.">${settings.footerNotes || business.footerNotes || ''}</textarea>
            </div>
          </div>
        </div>

        <!-- Tab 3: Branding & Identity -->
        <div id="tab-branding" class="tab-pane ${this.activeTab === 'branding' ? 'active' : ''}" style="${this.activeTab === 'branding' ? '' : 'display: none;'}">
          
          <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px;">
            
            <!-- Controls Column -->
            <div>
              <!-- Logo Upload Card -->
              <div class="card" style="margin-bottom: 20px;">
                <h2 class="card-title" style="margin-bottom: 16px;">${getIcon('sparkles')} Business Logo</h2>
                
                <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 16px;">
                  <div class="logo-preview-box" id="branding-logo-box" style="width: 120px; height: 75px; border-radius: var(--radius-md); border: 2px dashed var(--border-strong); display: flex; align-items: center; justify-content: center; background: #ffffff; padding: 6px; overflow: hidden;">
                    ${business.logo ? `<img id="preview-logo-img" src="${business.logo}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="Logo">` : `<span id="preview-logo-empty" style="font-size: 11px; color: var(--text-muted); text-align: center;">No Logo</span>`}
                  </div>
                  <div>
                    <label class="btn btn-secondary btn-sm" style="cursor: pointer; margin-bottom: 6px; display: inline-flex; align-items: center; gap: 6px;">
                      ${getIcon('upload')} Upload Logo Image
                      <input type="file" id="logo-file-input" accept="image/*" style="display: none;">
                    </label>
                    ${business.logo ? `
                      <button type="button" id="btn-remove-logo" class="btn btn-subtle btn-sm" style="color: #ef4444; margin-left: 6px;">
                        Remove
                      </button>
                    ` : ''}
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                      PNG, SVG, or JPG (transparent background recommended).
                    </div>
                  </div>
                </div>
              </div>

              <!-- Brand Color Card -->
              <div class="card" style="margin-bottom: 20px;">
                <h2 class="card-title" style="margin-bottom: 16px;">${getIcon('edit')} Brand Primary Color</h2>
                <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 14px;">
                  Applied across document headers, title text, totals highlights, and table borders.
                </p>

                <!-- Color Presets Swatches -->
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
                  ${colorPresets.map(c => `
                    <button type="button" class="btn-color-swatch" data-color="${c.hex}" title="${c.name}" style="width: 32px; height: 32px; border-radius: 50%; background: ${c.hex}; border: 2px solid ${c.hex === currentBrandColor ? '#0f172a' : 'transparent'}; box-shadow: 0 1px 4px rgba(0,0,0,0.15); cursor: pointer; transition: transform 0.15s ease;"></button>
                  `).join('')}
                </div>

                <div class="form-row">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label">Color Picker & Hex Code</label>
                    <div style="display: flex; gap: 10px; align-items: center;">
                      <input type="color" id="set-brand-color" value="${currentBrandColor}" style="width: 48px; height: 40px; padding: 2px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); cursor: pointer;">
                      <input type="text" id="set-brand-color-text" class="form-control" value="${currentBrandColor}" placeholder="#2563eb" style="width: 130px; font-family: var(--font-mono); font-weight: 700; text-transform: uppercase;">
                    </div>
                  </div>
                </div>
              </div>

              <!-- Typography & Template Style Card -->
              <div class="card" style="margin-bottom: 20px;">
                <h2 class="card-title" style="margin-bottom: 16px;">${getIcon('fileText')} Typography & Default Template</h2>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Document Font Family</label>
                    <select id="set-brand-font" class="form-control">
                      <option value="Inter" ${currentBrandFont === 'Inter' ? 'selected' : ''}>Inter (Modern Clean Sans)</option>
                      <option value="Roboto" ${currentBrandFont === 'Roboto' ? 'selected' : ''}>Roboto (Crisp Geometric)</option>
                      <option value="Space Grotesk" ${currentBrandFont === 'Space Grotesk' ? 'selected' : ''}>Space Grotesk (Tech Studio)</option>
                      <option value="Playfair Display" ${currentBrandFont === 'Playfair Display' ? 'selected' : ''}>Playfair Display (Executive Serif)</option>
                      <option value="JetBrains Mono" ${currentBrandFont === 'JetBrains Mono' ? 'selected' : ''}>JetBrains Mono (Technical Monospace)</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Default Template Style</label>
                    <select id="set-default-template" class="form-control">
                      <option value="modern" ${currentTemplate === 'modern' ? 'selected' : ''}>Modern Pro (Accent Top Bar)</option>
                      <option value="classic" ${currentTemplate === 'classic' ? 'selected' : ''}>Classic Corporate (Boxed & Formal)</option>
                      <option value="minimal" ${currentTemplate === 'minimal' ? 'selected' : ''}>Minimal Clean (Airy & Refined)</option>
                      <option value="bold" ${currentTemplate === 'bold' ? 'selected' : ''}>Bold Studio (Dark Header Band)</option>
                    </select>
                  </div>
                </div>

                <div style="margin-top: 14px;">
                  <button type="button" id="btn-save-branding" class="btn btn-primary">
                    ${getIcon('check')} Save Branding Settings
                  </button>
                </div>
              </div>
            </div>

            <!-- Live Mini Preview Column -->
            <div>
              <div class="card" style="position: sticky; top: 80px; padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">
                    Live Branding Preview
                  </h3>
                  <span id="preview-color-pill" style="font-size: 11px; font-weight: 700; color: #ffffff; background: ${currentBrandColor}; padding: 2px 8px; border-radius: 12px; font-family: var(--font-mono);">
                    ${currentBrandColor}
                  </span>
                </div>

                <!-- Mini Invoice Sheet Card -->
                <div id="mini-invoice-preview" style="background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); font-family: ${currentBrandFont}, sans-serif; font-size: 11px; color: #1e293b;">
                  
                  <div style="border-top: 4px solid ${currentBrandColor}; margin: -18px -18px 14px -18px; border-radius: 8px 8px 0 0;"></div>

                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;">
                    <div>
                      ${business.logo ? `<img src="${business.logo}" style="max-height: 28px; max-width: 100px; object-fit: contain; margin-bottom: 4px;" alt="Logo">` : ''}
                      <div style="font-weight: 800; font-size: 12px; color: #0f172a;">${business.name || 'Acme Studio LLC'}</div>
                      <div style="color: #64748b; font-size: 9.5px;">billing@yourcompany.com</div>
                    </div>
                    <div style="text-align: right;">
                      <div id="mini-doc-title" style="font-size: 16px; font-weight: 900; color: ${currentBrandColor};">INVOICE</div>
                      <div style="font-weight: 700; color: #334155; font-size: 10px;">INV-0042</div>
                    </div>
                  </div>

                  <div style="background: #f8fafc; border-radius: 4px; padding: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; font-size: 9.5px;">
                    <div>
                      <span style="color: #64748b; font-weight: 600;">Billed To:</span>
                      <div style="font-weight: 700; color: #0f172a;">TechCorp International</div>
                    </div>
                    <div style="text-align: right;">
                      <span style="color: #64748b; font-weight: 600;">Due Date:</span>
                      <div style="font-weight: 700; color: #0f172a;">In 14 Days</div>
                    </div>
                  </div>

                  <div style="border-bottom: 2px solid ${currentBrandColor}; padding-bottom: 4px; margin-bottom: 6px; display: flex; justify-content: space-between; font-weight: 800; font-size: 9.5px; color: #475569;">
                    <span>ITEM</span>
                    <span>TOTAL</span>
                  </div>

                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 10px;">
                    <div>
                      <span style="font-weight: 600; color: #0f172a;">Brand & Web Design</span>
                      <div style="font-size: 8.5px; color: #64748b;">1 × $2,500.00</div>
                    </div>
                    <span style="font-weight: 700; color: #0f172a;">$2,500.00</span>
                  </div>

                  <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px; display: flex; flex-direction: column; gap: 3px; font-size: 10px;">
                    <div style="display: flex; justify-content: space-between; color: #64748b;">
                      <span>Subtotal:</span>
                      <span>$2,500.00</span>
                    </div>
                    <div id="mini-amount-due-row" style="display: flex; justify-content: space-between; font-weight: 800; color: ${currentBrandColor}; background: #eff6ff; padding: 4px 6px; border-radius: 4px; font-size: 11px;">
                      <span>Amount Due:</span>
                      <span>$2,500.00</span>
                    </div>
                  </div>
                </div>

                <div style="font-size: 11px; color: var(--text-muted); margin-top: 12px; text-align: center;">
                  Updates in real time as you adjust brand colors & typography.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 4: Account & Workspaces -->
        <div id="tab-account" class="tab-pane ${this.activeTab === 'account' ? 'active' : ''}" style="${this.activeTab === 'account' ? '' : 'display: none;'}">
          
          <div class="card" style="margin-bottom: 20px;">
            <h2 class="card-title" style="margin-bottom: 16px;">${getIcon('user')} User Account Profile</h2>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" id="acc-user-name" class="form-control" value="${currentUser.name || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-control" value="${currentUser.email || ''}" disabled style="background: var(--bg-app); opacity: 0.8;">
              </div>
            </div>
            <button type="button" id="btn-update-acc-profile" class="btn btn-secondary btn-sm">
              ${getIcon('check')} Update Profile
            </button>
          </div>

          <div class="card" style="margin-bottom: 20px;">
            <h2 class="card-title" style="margin-bottom: 16px;">${getIcon('building')} Active Organization Workspace</h2>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Workspace Name</label>
                <input type="text" id="acc-org-name" class="form-control" value="${currentOrg.name || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">Workspace ID</label>
                <input type="text" class="form-control" value="${currentOrg.id || ''}" disabled style="background: var(--bg-app); font-family: var(--font-mono); font-size: 12px;">
              </div>
            </div>
            <div style="display: flex; gap: 10px;">
              <button type="button" id="btn-update-acc-org" class="btn btn-secondary btn-sm">
                ${getIcon('check')} Rename Workspace
              </button>
              <button type="button" id="btn-create-new-workspace" class="btn btn-secondary btn-sm">
                ${getIcon('plus')} New Workspace
              </button>
            </div>
          </div>

          <div class="card" style="margin-bottom: 20px;">
            <h2 class="card-title" style="margin-bottom: 16px;">${getIcon('grid')} Your Workspaces (${allUserOrgs.length})</h2>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${allUserOrgs.map(org => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--bg-app); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 32px; height: 32px; border-radius: 8px; background: ${org.logoColor || '#6366f1'}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px;">
                      ${org.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style="font-weight: 700; font-size: 13.5px; color: var(--text-primary);">
                        ${org.name} ${org.id === currentOrg.id ? '<span class="badge badge-paid" style="margin-left: 6px; font-size: 10px;">Active</span>' : ''}
                      </div>
                      <div style="font-size: 11.5px; color: var(--text-muted);">
                        Role: ${org.role || 'Owner'} • Plan: ${org.plan || 'Free'}
                      </div>
                    </div>
                  </div>
                  <div>
                    ${org.id !== currentOrg.id ? `
                      <button type="button" class="btn btn-subtle btn-sm btn-switch-workspace" data-org-id="${org.id}">
                        Switch
                      </button>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Danger Zone: Deletion Section -->
          <div class="card" style="border-color: #fca5a5; background: #fff5f5; margin-bottom: 20px;">
            <h2 class="card-title" style="color: #b91c1c; margin-bottom: 12px;">${getIcon('alertCircle')} Danger Zone — Delete Workspace</h2>
            <p style="color: #7f1d1d; font-size: 13px; margin-bottom: 16px; line-height: 1.5;">
              Deleting <strong>${currentOrg.name}</strong> will permanently erase all its invoices, quotes, customer ledger records, product catalog, and settings. This cannot be undone.
            </p>
            <button type="button" id="btn-delete-active-org" class="btn btn-danger btn-sm">
              ${getIcon('trash')} Delete Workspace "${currentOrg.name}"
            </button>
          </div>

          <div class="card" style="border-color: #ef4444; background: #fef2f2;">
            <h2 class="card-title" style="color: #991b1b; margin-bottom: 12px;">${getIcon('trash')} Permanent Account Deletion</h2>
            <p style="color: #7f1d1d; font-size: 13px; margin-bottom: 16px; line-height: 1.5;">
              Permanently close and delete your user account (<strong>${currentUser.email}</strong>) and all associated organization workspaces and data. You will be logged out immediately.
            </p>
            <button type="button" id="btn-delete-full-account" class="btn btn-danger btn-sm" style="background: #991b1b; border-color: #991b1b;">
              ${getIcon('trash')} Delete Account & All Data
            </button>
          </div>
        </div>

        <!-- Tab 5: Data Backup & Safety -->
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
            <h2 class="card-title" style="color: #b91c1c; margin-bottom: 8px;">${getIcon('alertCircle')} Factory Reset Current Workspace</h2>
            <p style="color: #7f1d1d; font-size: 13px; margin-bottom: 16px;">
              Permanently clear all document and customer records in this workspace and reset to a blank state.
            </p>
            <button type="button" id="btn-factory-reset" class="btn btn-danger btn-sm">
              ${getIcon('trash')} Clear All Workspace Data
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

    // Helper: update live mini preview
    const updateMiniPreview = (color, font) => {
      const miniPreview = this.container.querySelector('#mini-invoice-preview');
      const miniDocTitle = this.container.querySelector('#mini-doc-title');
      const miniAmountDue = this.container.querySelector('#mini-amount-due-row');
      const colorPill = this.container.querySelector('#preview-color-pill');

      if (color) {
        if (miniDocTitle) miniDocTitle.style.color = color;
        if (miniAmountDue) miniAmountDue.style.color = color;
        if (colorPill) {
          colorPill.style.background = color;
          colorPill.textContent = color;
        }
      }
      if (font && miniPreview) {
        miniPreview.style.fontFamily = `"${font}", sans-serif`;
      }
    };

    // Color swatches click
    this.container.querySelectorAll('.btn-color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        const color = swatch.dataset.color;
        const colorPicker = this.container.querySelector('#set-brand-color');
        const colorText = this.container.querySelector('#set-brand-color-text');
        if (colorPicker) colorPicker.value = color;
        if (colorText) colorText.value = color;

        this.container.querySelectorAll('.btn-color-swatch').forEach(s => {
          s.style.borderColor = s.dataset.color === color ? '#0f172a' : 'transparent';
        });

        updateMiniPreview(color);
      });
    });

    // Brand color input & text sync
    const brandColorInput = this.container.querySelector('#set-brand-color');
    const brandColorText = this.container.querySelector('#set-brand-color-text');
    if (brandColorInput && brandColorText) {
      brandColorInput.addEventListener('input', (e) => {
        brandColorText.value = e.target.value;
        updateMiniPreview(e.target.value);
      });
      brandColorText.addEventListener('input', (e) => {
        const val = e.target.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          brandColorInput.value = val;
          updateMiniPreview(val);
        }
      });
    }

    // Font family change
    const fontSelect = this.container.querySelector('#set-brand-font');
    if (fontSelect) {
      fontSelect.addEventListener('change', (e) => {
        updateMiniPreview(null, e.target.value);
      });
    }

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

    // Dedicated Save Branding Button
    this.container.querySelector('#btn-save-branding')?.addEventListener('click', () => {
      const brandColor = this.container.querySelector('#set-brand-color')?.value || '#2563eb';
      const brandFont = this.container.querySelector('#set-brand-font')?.value || 'Inter';
      const defaultTemplate = this.container.querySelector('#set-default-template')?.value || 'modern';

      SettingsRepo.save({
        brandColor,
        brandFont,
        defaultTemplate
      });

      window.app.showToast('Branding Saved', 'Logo, colors, and typography preferences applied to all documents.', 'success');
    });

    // Update User Profile
    this.container.querySelector('#btn-update-acc-profile')?.addEventListener('click', () => {
      const name = this.container.querySelector('#acc-user-name')?.value;
      if (name) {
        Auth.updateProfile({ name });
        window.app.showToast('Profile Updated', 'Your name has been updated.', 'success');
        this.render(this.container);
      }
    });

    // Rename Active Org
    this.container.querySelector('#btn-update-acc-org')?.addEventListener('click', () => {
      const name = this.container.querySelector('#acc-org-name')?.value;
      if (name) {
        Auth.updateOrg({ name });
        window.app.showToast('Workspace Renamed', `Workspace renamed to "${name}".`, 'success');
        this.render(this.container);
      }
    });

    // Create New Workspace
    this.container.querySelector('#btn-create-new-workspace')?.addEventListener('click', () => {
      const name = prompt('Enter a name for the new organization workspace:');
      if (name && name.trim()) {
        const res = Auth.createOrg({ name: name.trim() });
        if (res.success) {
          Auth.switchOrg(res.orgId);
          window.app.showToast('Workspace Created', `Switched to "${name}".`, 'success');
          window.location.reload();
        } else {
          window.app.showToast('Error', res.error, 'error');
        }
      }
    });

    // Switch Workspace
    this.container.querySelectorAll('.btn-switch-workspace').forEach(btn => {
      btn.addEventListener('click', () => {
        const orgId = btn.dataset.orgId;
        if (Auth.switchOrg(orgId)) {
          window.location.reload();
        }
      });
    });

    // Delete Active Workspace
    this.container.querySelector('#btn-delete-active-org')?.addEventListener('click', () => {
      const org = Auth.currentOrg();
      const confirmPrompt = prompt(`CRITICAL ACTION: To permanently delete workspace "${org?.name}" and all its records, type DELETE below:`);
      if (confirmPrompt === 'DELETE') {
        const res = Auth.deleteOrg(org.id);
        if (res.success) {
          window.app.showToast('Workspace Deleted', `Workspace "${org?.name}" has been permanently deleted.`, 'info');
          window.location.reload();
        } else {
          window.app.showToast('Error', res.error, 'error');
        }
      } else if (confirmPrompt !== null) {
        window.app.showToast('Cancelled', 'Workspace deletion was cancelled (confirmation mismatch).', 'info');
      }
    });

    // Delete Full Account
    this.container.querySelector('#btn-delete-full-account')?.addEventListener('click', () => {
      const confirmPrompt = prompt('FINAL WARNING: This will permanently delete your entire account, all organizations, and all data. Type DELETE MY ACCOUNT to confirm:');
      if (confirmPrompt === 'DELETE MY ACCOUNT') {
        Auth.deleteAccount();
        window.app.showToast('Account Deleted', 'Your account and all associated data have been permanently erased.', 'info');
        window.location.href = 'landing.html';
      } else if (confirmPrompt !== null) {
        window.app.showToast('Cancelled', 'Account deletion cancelled (confirmation mismatch).', 'info');
      }
    });

    // Global Save Settings
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
        brandColor: this.container.querySelector('#set-brand-color')?.value || '#2563eb',
        brandFont: this.container.querySelector('#set-brand-font')?.value || 'Inter'
      };

      SettingsRepo.save(updatedSettings);
      window.app.showToast('Settings Saved', 'Workspace configuration updated successfully.', 'success');
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
        window.app.showToast('Demo Data Loaded', 'Sample records populated across workspace.', 'success');
        this.render(this.container);
      }
    });

    // Clear Demo Data
    this.container.querySelector('#btn-clear-demo-data')?.addEventListener('click', () => {
      if (confirm('Remove all demo sample data while preserving your custom records?')) {
        DataRepo.clearDemoData();
        window.app.showToast('Demo Data Cleared', 'Sample data removed.', 'info');
        this.render(this.container);
      }
    });

    // Factory Reset
    this.container.querySelector('#btn-factory-reset')?.addEventListener('click', () => {
      if (confirm('CRITICAL WARNING: This will permanently clear all invoices, quotes, products, and clients in this workspace. Continue?')) {
        DataRepo.resetAllData();
        window.app.showToast('Reset Complete', 'Workspace returned to default state.', 'info');
        window.location.hash = '#/';
      }
    });
  }
};
