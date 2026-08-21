/**
 * Application Settings View with Multi-Color Branding, Social Handles, and Invoicing Defaults
 */

import { SettingsRepo, CustomerRepo, ProductRepo, DocumentRepo } from '../storage/repository.js';
import { getIcon } from '../../assets/icons.js';
import { Auth } from '../auth/auth.js';

export const SettingsView = {
  activeTab: 'business',

  render(container) {
    this.container = container;
    const settings = SettingsRepo.get();
    const business = settings.business || {};
    const currentUser = Auth.currentUser() || { name: 'Admin User', email: 'admin@invoicemaster.app' };
    const currentOrg = Auth.currentOrg() || { name: 'My Business', id: 'org_default' };
    const allOrgs = Auth.currentUserOrgs();

    const currentBrandColor = settings.brandHeadingColor || settings.brandColor || '#2563eb';
    const currentAccentColor = settings.brandAccentColor || '#3b82f6';
    const currentHeaderBg = settings.brandHeaderBg || '#0f172a';
    const currentBodyColor = settings.brandBodyColor || '#1e293b';
    const currentFooterBg = settings.brandFooterBg || '#f8fafc';
    const currentBrandFont = settings.brandFont || 'Inter';
    const currentTemplate = settings.defaultTemplate || 'modern';

    const colorPresets = [
      { name: 'Royal Blue', hex: '#2563eb' },
      { name: 'Indigo Dream', hex: '#4f46e5' },
      { name: 'Emerald Green', hex: '#059669' },
      { name: 'Crimson Red', hex: '#dc2626' },
      { name: 'Deep Violet', hex: '#7c3aed' },
      { name: 'Midnight Slate', hex: '#0f172a' },
      { name: 'Warm Amber', hex: '#d97706' },
      { name: 'Teal Cyan', hex: '#0d9488' }
    ];

    container.innerHTML = `
      <div class="view-container">
        <!-- Top Header & Save Button -->
        <div class="toolbar">
          <div>
            <h1 style="font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Settings & Configuration</h1>
            <p style="color: var(--text-secondary); font-size: 13.5px; margin-top: 2px;">
              Manage your business profile, multi-color branding, invoicing rules, social links, and account.
            </p>
          </div>
          <button id="btn-save-settings" class="btn btn-primary">
            ${getIcon('check')} Save All Changes
          </button>
        </div>

        <!-- Settings Sub-Navigation Tabs -->
        <div class="segmented-control" style="margin-bottom: 24px; display: inline-flex;">
          <button class="segment-btn ${this.activeTab === 'business' ? 'active' : ''}" data-tab="business">
            ${getIcon('user')} Business Profile
          </button>
          <button class="segment-btn ${this.activeTab === 'defaults' ? 'active' : ''}" data-tab="defaults">
            ${getIcon('fileText')} Invoicing & Notes
          </button>
          <button class="segment-btn ${this.activeTab === 'branding' ? 'active' : ''}" data-tab="branding">
            ${getIcon('sparkles')} Multi-Color Branding
          </button>
          <button class="segment-btn ${this.activeTab === 'account' ? 'active' : ''}" data-tab="account">
            ${getIcon('shield')} Account & Workspaces
          </button>
          <button class="segment-btn ${this.activeTab === 'backup' ? 'active' : ''}" data-tab="backup">
            ${getIcon('download')} Backup & Data
          </button>
        </div>

        <!-- Tab 1: Business Profile -->
        <div id="tab-business" class="tab-pane ${this.activeTab === 'business' ? 'active' : ''}" style="${this.activeTab === 'business' ? '' : 'display: none;'}">
          <div class="card" style="margin-bottom: 20px;">
            <h2 class="card-title" style="margin-bottom: 18px;">${getIcon('user')} Company / Freelancer Information</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">Business or Trading Name</label>
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
                <label class="form-label">Website URL</label>
                <input type="text" id="biz-website" class="form-control" value="${business.website || ''}" placeholder="https://yourdomain.com">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Physical / Postal Address</label>
              <textarea id="biz-address" class="form-control" rows="3" placeholder="123 Innovation Way, Suite 400&#10;San Francisco, CA 94107&#10;United States">${business.address || ''}</textarea>
            </div>
          </div>

          <!-- Social Media Profiles Card -->
          <div class="card" style="margin-bottom: 20px;">
            <h2 class="card-title" style="margin-bottom: 14px;">🌐 Social Media Handles (Displayed on Invoices & Quotes)</h2>
            <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 16px;">
              Add your social media channels to make your invoices and quotes interactive and build client trust.
            </p>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">𝕏 / Twitter Handle</label>
                <input type="text" id="biz-twitter" class="form-control" value="${business.twitter || ''}" placeholder="@yourhandle">
              </div>
              <div class="form-group">
                <label class="form-label">💼 LinkedIn Page / Profile URL</label>
                <input type="text" id="biz-linkedin" class="form-control" value="${business.linkedin || ''}" placeholder="https://linkedin.com/company/yourpage">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">📸 Instagram Handle</label>
                <input type="text" id="biz-instagram" class="form-control" value="${business.instagram || ''}" placeholder="@yourbrand">
              </div>
              <div class="form-group">
                <label class="form-label">📘 Facebook Page URL</label>
                <input type="text" id="biz-facebook" class="form-control" value="${business.facebook || ''}" placeholder="https://facebook.com/yourpage">
              </div>
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

        <!-- Tab 2: Invoicing Defaults & Custom Thank You Notes -->
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

          <!-- Distinct Thank You Messages Card -->
          <div class="card">
            <h2 class="card-title" style="margin-bottom: 16px;">💬 Customized Thank You Notes & Terms</h2>
            <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 18px;">
              Set dedicated, distinct messages for invoices versus quotes.
            </p>

            <div class="form-group" style="margin-bottom: 18px;">
              <label class="form-label" style="font-weight: 700;">📄 Default Invoice Thank You Note</label>
              <textarea id="set-default-inv-notes" class="form-control" rows="3" placeholder="e.g. Thank you for your business! Please remit payment according to the terms above.">${settings.defaultInvoiceNotes || 'Thank you for your business! Please remit payment according to the terms above.'}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight: 700;">📑 Default Quote Thank You Note & Validity</label>
              <textarea id="set-default-quo-notes" class="form-control" rows="3" placeholder="e.g. Thank you for the opportunity to quote! We look forward to working with you. This estimate is valid for 30 days.">${settings.defaultQuoteNotes || 'Thank you for the opportunity to quote! We look forward to working with you. This estimate is valid for 30 days.'}</textarea>
            </div>
          </div>
        </div>

        <!-- Tab 3: Multi-Color Branding & Identity Studio -->
        <div id="tab-branding" class="tab-pane ${this.activeTab === 'branding' ? 'active' : ''}" style="${this.activeTab === 'branding' ? '' : 'display: none;'}">
          
          <div style="display: grid; grid-template-columns: 1.25fr 1fr; gap: 24px;">
            
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

              <!-- Multi-Color Mixing Studio -->
              <div class="card" style="margin-bottom: 20px;">
                <h2 class="card-title" style="margin-bottom: 14px;">🎨 Multi-Color Palette Customizer</h2>
                <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 16px;">
                  Mix and match distinct colors for your document headers, accents, body text, and footers.
                </p>

                <!-- Color 1: Header / Primary -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-subtle);">
                  <div>
                    <div style="font-weight: 700; font-size: 13px;">1. Heading & Title Color</div>
                    <div style="font-size: 11.5px; color: var(--text-muted);">Main title, company name, grand total highlight</div>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="color" id="set-color-heading" value="${currentBrandColor}" style="width: 38px; height: 32px; border-radius: 4px; cursor: pointer; border: 1px solid var(--border-strong);">
                    <input type="text" id="set-color-heading-text" class="form-control" value="${currentBrandColor}" style="width: 95px; font-size: 12px; font-family: var(--font-mono); font-weight: 700;">
                  </div>
                </div>

                <!-- Color 2: Table & Highlight Accent -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-subtle);">
                  <div>
                    <div style="font-weight: 700; font-size: 13px;">2. Table & Highlights Accent</div>
                    <div style="font-size: 11.5px; color: var(--text-muted);">Table header line, amount due badge, status badge</div>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="color" id="set-color-accent" value="${currentAccentColor}" style="width: 38px; height: 32px; border-radius: 4px; cursor: pointer; border: 1px solid var(--border-strong);">
                    <input type="text" id="set-color-accent-text" class="form-control" value="${currentAccentColor}" style="width: 95px; font-size: 12px; font-family: var(--font-mono); font-weight: 700;">
                  </div>
                </div>

                <!-- Color 3: Header Banner Fill (Bold template) -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-subtle);">
                  <div>
                    <div style="font-weight: 700; font-size: 13px;">3. Header Banner Background</div>
                    <div style="font-size: 11.5px; color: var(--text-muted);">Banner background for Bold and Classic templates</div>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="color" id="set-color-header-bg" value="${currentHeaderBg}" style="width: 38px; height: 32px; border-radius: 4px; cursor: pointer; border: 1px solid var(--border-strong);">
                    <input type="text" id="set-color-header-bg-text" class="form-control" value="${currentHeaderBg}" style="width: 95px; font-size: 12px; font-family: var(--font-mono); font-weight: 700;">
                  </div>
                </div>

                <!-- Color 4: Body & Text -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-subtle);">
                  <div>
                    <div style="font-weight: 700; font-size: 13px;">4. Body & Item Text Color</div>
                    <div style="font-size: 11.5px; color: var(--text-muted);">Line item descriptions, addresses, paragraph text</div>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="color" id="set-color-body" value="${currentBodyColor}" style="width: 38px; height: 32px; border-radius: 4px; cursor: pointer; border: 1px solid var(--border-strong);">
                    <input type="text" id="set-color-body-text" class="form-control" value="${currentBodyColor}" style="width: 95px; font-size: 12px; font-family: var(--font-mono); font-weight: 700;">
                  </div>
                </div>

                <!-- Color 5: Footer / Notes Box Background -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
                  <div>
                    <div style="font-weight: 700; font-size: 13px;">5. Footer & Notes Box Background</div>
                    <div style="font-size: 11.5px; color: var(--text-muted);">Background fill for notes and bank payment box</div>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="color" id="set-color-footer-bg" value="${currentFooterBg}" style="width: 38px; height: 32px; border-radius: 4px; cursor: pointer; border: 1px solid var(--border-strong);">
                    <input type="text" id="set-color-footer-bg-text" class="form-control" value="${currentFooterBg}" style="width: 95px; font-size: 12px; font-family: var(--font-mono); font-weight: 700;">
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

                <div style="margin-top: 12px;">
                  <button type="button" id="btn-save-branding" class="btn btn-primary" style="width: 100%;">
                    ${getIcon('check')} Save Multi-Color Palette & Branding
                  </button>
                </div>
              </div>
            </div>

            <!-- Live Mini Preview Column -->
            <div>
              <div class="card" style="position: sticky; top: 20px; padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                  <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Live Document Preview</h3>
                </div>

                <!-- Scaled Down Document Card -->
                <div id="mini-invoice-preview" style="
                  background: #ffffff;
                  border: 1px solid #e2e8f0;
                  border-radius: 8px;
                  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
                  padding: 20px;
                  font-family: '${currentBrandFont}', sans-serif;
                  font-size: 11.5px;
                  color: ${currentBodyColor};
                ">
                  <!-- Header -->
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid ${currentAccentColor}; padding-bottom: 12px;">
                    <div>
                      <div id="mini-biz-name" style="font-size: 14px; font-weight: 800; color: ${currentBrandColor};">${business.name || 'Acme Studio LLC'}</div>
                      <div style="font-size: 10px; color: #64748b;">${business.tagline || 'Design & Engineering'}</div>
                    </div>
                    <div style="text-align: right;">
                      <div id="mini-doc-title" style="font-size: 16px; font-weight: 900; color: ${currentBrandColor};">INVOICE</div>
                      <div style="font-size: 10px; font-weight: 700; color: #64748b;"># INV-0042</div>
                    </div>
                  </div>

                  <!-- Details -->
                  <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 14px;">
                    <div>
                      <div style="font-weight: 700; color: #64748b; text-transform: uppercase;">Billed To:</div>
                      <div style="font-weight: 700; color: #0f172a;">Global Enterprise Inc.</div>
                    </div>
                    <div style="text-align: right;">
                      <div><span style="color:#64748b;">Due Date:</span> <strong>30 Days</strong></div>
                    </div>
                  </div>

                  <!-- Table -->
                  <div style="border-top: 1px solid #f1f5f9; margin-bottom: 14px;">
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600;">
                      <span>Web Platform Architecture</span>
                      <span>$4,500.00</span>
                    </div>
                  </div>

                  <!-- Totals & Notes -->
                  <div style="display: flex; justify-content: space-between; gap: 12px;">
                    <div id="mini-notes-box" style="flex: 1; background: ${currentFooterBg}; padding: 8px; border-radius: 4px; font-size: 9.5px; border: 1px solid #f1f5f9;">
                      <strong>Notes:</strong> Thank you for your business!
                    </div>
                    <div style="text-align: right; min-width: 90px;">
                      <div style="font-size: 10px; color: #64748b;">Total Amount</div>
                      <div id="mini-grand-total" style="font-size: 14px; font-weight: 800; color: ${currentBrandColor};">$4,500.00</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Tab 4: Account & Workspaces (Organization Deletion & Management) -->
        <div id="tab-account" class="tab-pane ${this.activeTab === 'account' ? 'active' : ''}" style="${this.activeTab === 'account' ? '' : 'display: none;'}">
          <div class="card" style="margin-bottom: 20px;">
            <h2 class="card-title" style="margin-bottom: 18px;">${getIcon('user')} Account Profile</h2>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Your Name</label>
                <input type="text" id="acc-user-name" class="form-control" value="${currentUser.name}">
              </div>
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" id="acc-user-email" class="form-control" value="${currentUser.email}" disabled style="background: var(--bg-surface-subtle); cursor: not-allowed;">
              </div>
            </div>
            <button type="button" id="btn-update-acc-profile" class="btn btn-secondary btn-sm">
              ${getIcon('save')} Update Name
            </button>
          </div>

          <div class="card" style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div>
                <h2 class="card-title" style="margin-bottom: 4px;">${getIcon('shield')} Active Workspace: "${currentOrg.name}"</h2>
                <p style="color: var(--text-secondary); font-size: 13px;">Manage your current organization workspace name and settings.</p>
              </div>
              <button type="button" id="btn-create-new-workspace" class="btn btn-secondary btn-sm">
                ${getIcon('plus')} New Organization Workspace
              </button>
            </div>

            <div class="form-row" style="margin-bottom: 14px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Rename Current Workspace</label>
                <div style="display: flex; gap: 10px;">
                  <input type="text" id="acc-org-name" class="form-control" value="${currentOrg.name}">
                  <button type="button" id="btn-update-acc-org" class="btn btn-secondary" style="white-space: nowrap;">
                    Save Name
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- All Organizations List -->
          <div class="card" style="margin-bottom: 20px;">
            <h2 class="card-title" style="margin-bottom: 14px;">🏢 Your Workspaces</h2>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${allOrgs.map(o => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 8px; border: 1px solid ${o.id === currentOrg.id ? '#2563eb' : 'var(--border-subtle)'}; background: ${o.id === currentOrg.id ? 'rgba(37,99,235,0.04)' : 'transparent'};">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 28px; height: 28px; border-radius: 6px; background: ${o.logoColor || '#2563eb'}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 11px;">
                      ${o.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div style="font-weight: 700; font-size: 13.5px;">${o.name}</div>
                      <div style="font-size: 11.5px; color: var(--text-muted);">${o.role} · ${o.plan}</div>
                    </div>
                  </div>
                  <div>
                    ${o.id === currentOrg.id ? `
                      <span class="badge badge-paid">Active Workspace</span>
                    ` : `
                      <button type="button" class="btn btn-subtle btn-sm btn-switch-workspace" data-org-id="${o.id}">
                        Switch
                      </button>
                    `}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Danger Zone: Deletion Section -->
          <div class="card" style="border-color: #fca5a5; background: #fff5f5; margin-bottom: 20px;">
            <h2 class="card-title" style="color: #b91c1c; margin-bottom: 12px;">${getIcon('alertCircle')} Danger Zone — Delete Workspace</h2>
            <p style="color: #7f1d1d; font-size: 13px; margin-bottom: 16px; line-height: 1.5;">
              Deleting <strong>${currentOrg.name}</strong> will permanently erase all its invoices, quotes, customer records, catalog items, and branding. This cannot be undone.
            </p>
            <button type="button" id="btn-delete-active-org" class="btn btn-danger btn-sm">
              ${getIcon('trash')} Delete Workspace "${currentOrg.name}"
            </button>
          </div>

          <div class="card" style="border-color: #ef4444; background: #fef2f2;">
            <h2 class="card-title" style="color: #991b1b; margin-bottom: 12px;">${getIcon('trash')} Permanent Account Deletion</h2>
            <p style="color: #7f1d1d; font-size: 13px; margin-bottom: 16px; line-height: 1.5;">
              Permanently close and delete your account (<strong>${currentUser.email}</strong>) and all associated workspaces and data. You will be logged out immediately.
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
              Download a complete, portable JSON backup of all your invoices, quotes, customers, catalog, and settings.
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
    const updateMiniPreview = () => {
      const headingColor = this.container.querySelector('#set-color-heading')?.value || '#2563eb';
      const accentColor = this.container.querySelector('#set-color-accent')?.value || '#3b82f6';
      const bodyColor = this.container.querySelector('#set-color-body')?.value || '#1e293b';
      const footerBg = this.container.querySelector('#set-color-footer-bg')?.value || '#f8fafc';
      const font = this.container.querySelector('#set-brand-font')?.value || 'Inter';

      const miniPreview = this.container.querySelector('#mini-invoice-preview');
      const miniDocTitle = this.container.querySelector('#mini-doc-title');
      const miniBizName = this.container.querySelector('#mini-biz-name');
      const miniGrandTotal = this.container.querySelector('#mini-grand-total');
      const miniNotesBox = this.container.querySelector('#mini-notes-box');

      if (miniBizName) miniBizName.style.color = headingColor;
      if (miniDocTitle) miniDocTitle.style.color = headingColor;
      if (miniGrandTotal) miniGrandTotal.style.color = headingColor;
      if (miniNotesBox) miniNotesBox.style.background = footerBg;
      if (miniPreview) {
        miniPreview.style.fontFamily = `"${font}", sans-serif`;
        miniPreview.style.color = bodyColor;
      }
    };

    // Color inputs bidirectional syncing
    ['heading', 'accent', 'header-bg', 'body', 'footer-bg'].forEach(slot => {
      const picker = this.container.querySelector(`#set-color-${slot}`);
      const text = this.container.querySelector(`#set-color-${slot}-text`);
      if (picker && text) {
        picker.addEventListener('input', (e) => {
          text.value = e.target.value;
          updateMiniPreview();
        });
        text.addEventListener('input', (e) => {
          const val = e.target.value;
          if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            picker.value = val;
            updateMiniPreview();
          }
        });
      }
    });

    // Font select change
    this.container.querySelector('#set-brand-font')?.addEventListener('change', updateMiniPreview);

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
      const brandHeadingColor = this.container.querySelector('#set-color-heading')?.value || '#2563eb';
      const brandAccentColor  = this.container.querySelector('#set-color-accent')?.value || '#3b82f6';
      const brandHeaderBg     = this.container.querySelector('#set-color-header-bg')?.value || '#0f172a';
      const brandBodyColor    = this.container.querySelector('#set-color-body')?.value || '#1e293b';
      const brandFooterBg     = this.container.querySelector('#set-color-footer-bg')?.value || '#f8fafc';
      const brandFont         = this.container.querySelector('#set-brand-font')?.value || 'Inter';
      const defaultTemplate   = this.container.querySelector('#set-default-template')?.value || 'modern';

      SettingsRepo.save({
        brandColor: brandHeadingColor,
        brandHeadingColor,
        brandAccentColor,
        brandHeaderBg,
        brandBodyColor,
        brandFooterBg,
        brandFont,
        defaultTemplate
      });

      window.app.showToast('Branding Saved', 'Multi-color palette and typography applied to all documents.', 'success');
    });

    // Update Profile Name
    this.container.querySelector('#btn-update-acc-profile')?.addEventListener('click', () => {
      const name = this.container.querySelector('#acc-user-name')?.value;
      if (name) {
        Auth.updateProfile({ name });
        window.app.showToast('Profile Updated', 'Your name has been updated.', 'success');
        this.render(this.container);
      }
    });

    // Rename Workspace
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
        window.app.showToast('Cancelled', 'Workspace deletion was cancelled.', 'info');
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
        window.app.showToast('Cancelled', 'Account deletion cancelled.', 'info');
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
        twitter: this.container.querySelector('#biz-twitter')?.value || '',
        linkedin: this.container.querySelector('#biz-linkedin')?.value || '',
        instagram: this.container.querySelector('#biz-instagram')?.value || '',
        facebook: this.container.querySelector('#biz-facebook')?.value || '',
        address: this.container.querySelector('#biz-address')?.value || '',
        paymentInfo: this.container.querySelector('#biz-payment-info')?.value || '',
        taxNumber: this.container.querySelector('#biz-tax-number')?.value || '',
        regNumber: this.container.querySelector('#biz-reg-number')?.value || '',
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
        defaultInvoiceNotes: this.container.querySelector('#set-default-inv-notes')?.value || '',
        defaultQuoteNotes: this.container.querySelector('#set-default-quo-notes')?.value || '',
        defaultTemplate: this.container.querySelector('#set-default-template')?.value || 'modern',
        brandColor: this.container.querySelector('#set-color-heading')?.value || '#2563eb',
        brandHeadingColor: this.container.querySelector('#set-color-heading')?.value || '#2563eb',
        brandAccentColor: this.container.querySelector('#set-color-accent')?.value || '#3b82f6',
        brandHeaderBg: this.container.querySelector('#set-color-header-bg')?.value || '#0f172a',
        brandBodyColor: this.container.querySelector('#set-color-body')?.value || '#1e293b',
        brandFooterBg: this.container.querySelector('#set-color-footer-bg')?.value || '#f8fafc',
        brandFont: this.container.querySelector('#set-brand-font')?.value || 'Inter'
      };

      SettingsRepo.save(updatedSettings);
      window.app.showToast('Settings Saved', 'All business, notes, and branding preferences saved.', 'success');
    });

    // Backup Export
    this.container.querySelector('#btn-export-backup')?.addEventListener('click', () => {
      const backupData = {
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        settings: SettingsRepo.get(),
        customers: CustomerRepo.getAll(),
        products: ProductRepo.getAll(),
        documents: DocumentRepo.getAll()
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `invoicemaster_backup_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      window.app.showToast('Backup Exported', 'Workspace data downloaded.', 'success');
    });
  }
};
