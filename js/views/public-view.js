/**
 * Public Client Document Viewer (Read-only view for clients via shared URL)
 * Self-contained: reads document & branding from URL payload or local repository.
 */

import { DocumentRepo, SettingsRepo } from '../storage/repository.js';
import { formatCurrency, formatDate, escapeHTML, sanitizeURL } from '../engine/formatter.js';
import { calculateDocument } from '../engine/calculation.js';
import { PDFExport } from '../export/pdf.js';

export const PublicView = {
  render(container, docId) {
    this.container = container;

    let doc = null;
    let settings = null;

    const cleanId = (docId || '').split('?')[0];

    // 1. Check shared document vault (if same browser/device)
    if (cleanId) {
      try {
        const vault = JSON.parse(localStorage.getItem('invoicemaster_shared_vault') || '{}');
        if (vault[cleanId]) {
          doc = vault[cleanId].doc;
          settings = vault[cleanId].settings;
        }
      } catch (e) {}
    }

    // 2. Decode compact payload from URL parameter 'p' or 'data' (for mobile phones and external clients)
    if (!doc) {
      const fullHash = window.location.hash || '';
      let encodedPayload = null;

      if (fullHash.includes('?')) {
        const queryStr = fullHash.substring(fullHash.indexOf('?') + 1);
        const urlParams = new URLSearchParams(queryStr);
        encodedPayload = urlParams.get('p') || urlParams.get('data');
      }

      if (!encodedPayload && window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        encodedPayload = urlParams.get('p') || urlParams.get('data');
      }

      if (encodedPayload) {
        try {
          const json = decodeURIComponent(escape(atob(decodeURIComponent(encodedPayload))));
          const decoded = JSON.parse(json);
          if (decoded && decoded.d) {
            doc = decoded.d;
            settings = decoded.s || {};
          } else if (decoded && decoded.doc) {
            doc = decoded.doc;
            settings = decoded.settings || {};
          }
        } catch (e) {
          console.warn('Could not decode URL payload:', e);
        }
      }
    }

    // 3. Fallback to local active org repository
    if (!doc && cleanId) {
      doc = DocumentRepo.getById(cleanId);
      settings = SettingsRepo.get();
    }

    if (!doc) {
      container.innerHTML = `
        <div style="min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px; font-family: var(--font-sans);">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 16px;">⚠️</div>
          <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">Document Not Found</h2>
          <p style="color: #64748b; max-width: 420px; font-size: 14px; margin-bottom: 24px;">The invoice or quote link you opened is invalid or missing payload data.</p>
          <a href="landing.html" style="padding: 10px 20px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Return Home</a>
        </div>
      `;
      return;
    }

    settings = settings || {};
    const calc = calculateDocument(doc, settings);
    const isInvoice = doc.type === 'invoice';
    const biz = settings.business || {};
    const brandHeading = doc.brandHeadingColor || settings.brandHeadingColor || settings.brandColor || '#2563eb';
    const brandAccent  = doc.brandAccentColor || settings.brandAccentColor || '#3b82f6';
    const brandHeaderBg= doc.brandHeaderBg || settings.brandHeaderBg || '#0f172a';
    const brandBodyColor=doc.brandBodyColor || settings.brandBodyColor || '#1e293b';
    const brandFooterBg= doc.brandFooterBg || settings.brandFooterBg || '#f8fafc';
    const brandFont    = settings.brandFont || 'Inter';

    // Thank You Note logic (always visible)
    const defaultNote = isInvoice 
      ? (settings.defaultInvoiceNotes || 'Thank you for your business! Please remit payment according to the terms above.')
      : (settings.defaultQuoteNotes || 'Thank you for the opportunity to quote! We look forward to working with you. This estimate is valid for 30 days.');
    const notesToShow = doc.notes || defaultNote;

    // Social handles
    const socialLinks = [];
    if (biz.website) socialLinks.push(`<a class="doc-social-link" href="${sanitizeURL(biz.website)}" target="_blank" rel="noopener">🌐 ${escapeHTML(biz.website.replace(/^https?:\/\//, ''))}</a>`);
    if (biz.twitter) socialLinks.push(`<a class="doc-social-link" href="https://x.com/${escapeHTML(biz.twitter.replace('@', ''))}" target="_blank" rel="noopener">𝕏 @${escapeHTML(biz.twitter.replace('@', ''))}</a>`);
    if (biz.linkedin) socialLinks.push(`<a class="doc-social-link" href="${sanitizeURL(biz.linkedin)}" target="_blank" rel="noopener">💼 LinkedIn</a>`);
    if (biz.instagram) socialLinks.push(`<a class="doc-social-link" href="https://instagram.com/${escapeHTML(biz.instagram.replace('@', ''))}" target="_blank" rel="noopener">📸 @${escapeHTML(biz.instagram.replace('@', ''))}</a>`);
    if (biz.facebook) socialLinks.push(`<a class="doc-social-link" href="${sanitizeURL(biz.facebook)}" target="_blank" rel="noopener">📘 Facebook</a>`);

    const socialBarHTML = socialLinks.length ? `<div class="doc-social-bar">${socialLinks.join('')}</div>` : '';

    container.innerHTML = `
      <div style="min-height: 100vh; background: #f8fafc; padding: 20px 12px; display: flex; flex-direction: column; align-items: center; font-family: '${brandFont}', -apple-system, BlinkMacSystemFont, sans-serif;">
        
        <!-- Public Client Header Bar -->
        <div style="width: 100%; max-width: 820px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: #ffffff; padding: 14px 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${doc.status === 'Paid' ? '#16a34a' : '#2563eb'};"></div>
            <span style="font-weight: 700; font-size: 14px; color: #0f172a;">${escapeHTML(biz.name || 'Business Document')}</span>
            <span style="background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">${escapeHTML(doc.status || 'Active')}</span>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <button id="btn-public-print" style="padding: 8px 14px; background: #ffffff; color: #334155; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
              Print
            </button>
            <button id="btn-public-pdf" style="padding: 8px 16px; background: ${brandHeading}; color: #ffffff; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(37,99,235,0.25);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Download PDF
            </button>
          </div>
        </div>

        <!-- Rendered Document Paper -->
        <div id="invoice-paper" class="doc-paper template-${doc.template || settings.defaultTemplate || 'modern'}" style="
          --brand-primary: ${brandHeading};
          --brand-heading: ${brandHeading};
          --brand-accent: ${brandAccent};
          --brand-header-bg: ${brandHeaderBg};
          --brand-body-color: ${brandBodyColor};
          --brand-footer-bg: ${brandFooterBg};
          --brand-font: '${brandFont}', sans-serif;
          font-family: '${brandFont}', sans-serif;
        ">
          <!-- Header -->
          <div class="doc-paper-header">
            <div class="doc-business-info">
              ${biz.logo ? `<img src="${biz.logo}" alt="${escapeHTML(biz.name || 'Logo')}" class="doc-logo-img">` : ''}
              <div class="doc-business-name">${escapeHTML(biz.name || 'Your Company Name')}</div>
              <div style="font-size: 12px; color: #64748b; line-height: 1.4;">
                ${biz.address ? `${escapeHTML(biz.address)}<br>` : ''}
                ${biz.email ? `Email: ${escapeHTML(biz.email)}<br>` : ''}
                ${biz.phone ? `Phone: ${escapeHTML(biz.phone)}<br>` : ''}
                ${biz.taxNumber ? `Tax / VAT ID: ${escapeHTML(biz.taxNumber)}` : ''}
              </div>
            </div>

            <div class="doc-title-block">
              <div class="doc-type-title">${isInvoice ? 'INVOICE' : 'QUOTE'}</div>
              <div class="doc-number-label"># ${escapeHTML(doc.number)}</div>
            </div>
          </div>

          <!-- Bill To & Meta -->
          <div class="doc-details-grid">
            <div class="doc-bill-to">
              <div class="doc-section-heading">${isInvoice ? 'Billed To' : 'Quote Prepared For'}</div>
              <div class="doc-customer-name">${escapeHTML(doc.customer?.name || 'Valued Client')}</div>
              <div style="font-size: 12.5px; color: #475569; line-height: 1.4;">
                ${doc.customer?.company ? `<strong>${escapeHTML(doc.customer.company)}</strong><br>` : ''}
                ${doc.customer?.address ? `${escapeHTML(doc.customer.address)}<br>` : ''}
                ${doc.customer?.email ? `${escapeHTML(doc.customer.email)}<br>` : ''}
                ${doc.customer?.phone ? `${escapeHTML(doc.customer.phone)}` : ''}
              </div>
            </div>

            <div class="doc-meta-table">
              <div class="doc-meta-row">
                <span class="doc-meta-label">Issue Date:</span>
                <span class="doc-meta-val">${formatDate(doc.date, 'medium')}</span>
              </div>
              <div class="doc-meta-row">
                <span class="doc-meta-label">${isInvoice ? 'Payment Due:' : 'Valid Until:'}</span>
                <span class="doc-meta-val">${formatDate(doc.dueDate || doc.expirationDate, 'medium')}</span>
              </div>
              ${doc.reference ? `
                <div class="doc-meta-row">
                  <span class="doc-meta-label">PO / Ref #:</span>
                  <span class="doc-meta-val">${escapeHTML(doc.reference)}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Items Table -->
          <table class="doc-table">
            <thead>
              <tr>
                <th style="text-align: left; width: 45%;">Item & Description</th>
                <th style="text-align: right; width: 12%;">Qty</th>
                <th style="text-align: right; width: 18%;">Unit Price</th>
                <th style="text-align: right; width: 25%;">Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${(doc.items || []).map(item => `
                <tr>
                  <td>
                    <div class="doc-table-desc-title">${escapeHTML(item.description || 'Service / Product')}</div>
                    ${item.notes ? `<div class="doc-table-desc-subtitle">${escapeHTML(item.notes)}</div>` : ''}
                  </td>
                  <td style="text-align: right;">${item.quantity} ${escapeHTML(item.unit || '')}</td>
                  <td style="text-align: right;">${formatCurrency(item.unitPrice, doc.currency)}</td>
                  <td style="text-align: right; font-weight: 700;">${formatCurrency(item.quantity * item.unitPrice, doc.currency)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Footer & Totals -->
          <div class="doc-footer-grid">
            <div class="doc-notes-block">
              <!-- Thank You & Terms Card (Always visible) -->
              <div class="doc-notes-card">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
                  ${isInvoice ? 'Thank You & Payment Terms' : 'Thank You & Quote Validity'}
                </div>
                <div style="white-space: pre-wrap; line-height: 1.45; font-size: 12px; color: var(--brand-body-color, #475569);">${escapeHTML(notesToShow)}</div>
              </div>

              ${biz.paymentInfo ? `
                <div class="doc-notes-card" style="margin-top: 8px;">
                  <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Payment Instructions / Bank Details</div>
                  <div style="white-space: pre-wrap; font-family: monospace; font-size: 11.5px; line-height: 1.45;">${escapeHTML(biz.paymentInfo)}</div>
                </div>
              ` : ''}
            </div>

            <div class="doc-totals-block">
              <div class="doc-total-line">
                <span>Subtotal:</span>
                <span style="font-weight: 600;">${formatCurrency(calc.subtotal, doc.currency)}</span>
              </div>
              ${calc.totalDiscount > 0 ? `
                <div class="doc-total-line" style="color: #16a34a;">
                  <span>Discount:</span>
                  <span>-${formatCurrency(calc.totalDiscount, doc.currency)}</span>
                </div>
              ` : ''}
              ${calc.totalTax > 0 ? `
                <div class="doc-total-line">
                  <span>${settings.taxName || 'Tax'}:</span>
                  <span>${formatCurrency(calc.totalTax, doc.currency)}</span>
                </div>
              ` : ''}
              ${calc.shipping > 0 ? `
                <div class="doc-total-line">
                  <span>Shipping:</span>
                  <span>${formatCurrency(calc.shipping, doc.currency)}</span>
                </div>
              ` : ''}
              <div class="doc-total-line grand-total">
                <span>Total Amount:</span>
                <span>${formatCurrency(calc.grandTotal, doc.currency)}</span>
              </div>
              ${isInvoice && calc.amountPaid > 0 ? `
                <div class="doc-total-line">
                  <span>Amount Paid:</span>
                  <span style="color: #16a34a; font-weight: 600;">${formatCurrency(calc.amountPaid, doc.currency)}</span>
                </div>
              ` : ''}
              ${isInvoice ? `
                <div class="doc-total-line amount-due-highlight">
                  <span>Balance Due:</span>
                  <span>${formatCurrency(calc.balanceDue, doc.currency)}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Social Links -->
          ${socialBarHTML}
        </div>

        <div style="margin-top: 24px; font-size: 12px; color: #94a3b8; text-align: center;">
          Powered by InvoiceMaster Pro
        </div>
      </div>
    `;

    // Event listeners
    container.querySelector('#btn-public-print')?.addEventListener('click', () => window.print());
    container.querySelector('#btn-public-pdf')?.addEventListener('click', () => {
      const paper = container.querySelector('#invoice-paper');
      if (paper) PDFExport.downloadPDF(paper, `${doc.number}.pdf`);
    });
  }
};
