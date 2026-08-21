/**
 * Live Document Preview & PDF/Print Orchestration View
 */

import { DocumentRepo, SettingsRepo, CustomerRepo } from '../storage/repository.js';
import { calculateDocument, calculateLineItem } from '../engine/calculation.js';
import { formatCurrency, formatDate } from '../engine/formatter.js';
import { PDFExport } from '../export/pdf.js';
import { getIcon } from '../../assets/icons.js';

export const PreviewView = {
  render(container, docId) {
    this.container = container;
    const settings = SettingsRepo.get();
    const doc = DocumentRepo.getById(docId);

    if (!doc) {
      window.app.showToast('Error', 'Document not found', 'error');
      window.location.hash = '#/documents';
      return;
    }

    this.doc = doc;
    this.selectedTemplate = doc.template || settings.defaultTemplate || 'modern';
    this.renderPreview();
  },

  renderPreview() {
    const settings = SettingsRepo.get();
    const business = settings.business || {};
    const calc = calculateDocument(this.doc, settings);
    const isInvoice = this.doc.type === 'invoice';
    const docCurrency = this.doc.currency || settings.currency || 'USD';
    const statusClass = `badge-${(this.doc.status || 'draft').toLowerCase().replace(/\s+/g, '-')}`;

    this.container.innerHTML = `
      <div class="view-container">
        <!-- Top Toolbar & Template Switcher (Hidden in Print) -->
        <div class="toolbar preview-action-bar no-print">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <a href="#/documents" class="btn btn-subtle btn-sm">
              ${getIcon('arrowLeft')} Back
            </a>
            <div>
              <h1 style="font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 10px;">
                ${this.doc.number}
                <select id="preview-status-select" class="form-control" style="width: auto; padding: 3px 8px; font-size: 12px; font-weight: 700; height: auto;">
                  ${isInvoice ? `
                    <option value="Draft" ${this.doc.status === 'Draft' ? 'selected' : ''}>Draft</option>
                    <option value="Sent" ${this.doc.status === 'Sent' ? 'selected' : ''}>Sent</option>
                    <option value="Partially Paid" ${this.doc.status === 'Partially Paid' ? 'selected' : ''}>Partially Paid</option>
                    <option value="Paid" ${this.doc.status === 'Paid' ? 'selected' : ''}>Paid</option>
                    <option value="Overdue" ${this.doc.status === 'Overdue' ? 'selected' : ''}>Overdue</option>
                    <option value="Cancelled" ${this.doc.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                  ` : `
                    <option value="Draft" ${this.doc.status === 'Draft' ? 'selected' : ''}>Draft</option>
                    <option value="Sent" ${this.doc.status === 'Sent' ? 'selected' : ''}>Sent</option>
                    <option value="Accepted" ${this.doc.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
                    <option value="Declined" ${this.doc.status === 'Declined' ? 'selected' : ''}>Declined</option>
                    <option value="Expired" ${this.doc.status === 'Expired' ? 'selected' : ''}>Expired</option>
                    <option value="Converted" ${this.doc.status === 'Converted' ? 'selected' : ''}>Converted</option>
                  `}
                </select>
              </h1>
            </div>
          </div>

          <!-- Template Switcher & Actions -->
          <div class="filter-group" style="flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 6px; margin-right: 4px;">
              <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">Template:</span>
              <div class="segmented-control">
                <button class="segment-btn ${this.selectedTemplate === 'modern' ? 'active' : ''}" data-template="modern">Modern</button>
                <button class="segment-btn ${this.selectedTemplate === 'classic' ? 'active' : ''}" data-template="classic">Classic</button>
                <button class="segment-btn ${this.selectedTemplate === 'minimal' ? 'active' : ''}" data-template="minimal">Minimal</button>
                <button class="segment-btn ${this.selectedTemplate === 'bold' ? 'active' : ''}" data-template="bold">Bold</button>
              </div>
            </div>

            <a href="#/documents/${this.doc.id}/edit" class="btn btn-secondary btn-sm">
              ${getIcon('edit')} Edit
            </a>

            <button id="btn-preview-email" class="btn btn-secondary btn-sm" title="Send via Email">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              Send Email
            </button>

            <button id="btn-preview-copy-summary" class="btn btn-subtle btn-sm" title="Copy Document Summary">
              ${getIcon('copy')} Copy Summary
            </button>

            ${isInvoice && calc.amountDue > 0 ? `
              <button id="btn-preview-record-payment" class="btn btn-success btn-sm">
                ${getIcon('dollarSign')} Record Payment
              </button>
            ` : ''}

            ${!isInvoice && this.doc.status !== 'Converted' ? `
              <button id="btn-preview-convert" class="btn btn-secondary btn-sm" style="color: #7c3aed;">
                ${getIcon('repeat')} Convert to Invoice
              </button>
            ` : ''}

            <button id="btn-preview-duplicate" class="btn btn-subtle btn-sm" title="Duplicate Document">
              ${getIcon('copy')} Duplicate
            </button>

            <button id="btn-preview-print" class="btn btn-subtle btn-sm">
              ${getIcon('printer')} Print
            </button>

            <button id="btn-preview-download-pdf" class="btn btn-primary btn-sm">
              ${getIcon('download')} Download PDF
            </button>

            <button id="btn-preview-delete" class="btn btn-subtle btn-sm" style="color: #ef4444;" title="Delete Document">
              ${getIcon('trash')}
            </button>
          </div>
        </div>

        <!-- Rendered Document Sheet -->
        <div class="document-sheet-wrapper">
          <div id="invoice-paper" class="doc-paper template-${this.selectedTemplate}">
            
            ${this.selectedTemplate === 'bold' ? `
              <!-- Bold Header Banner -->
              <div class="bold-header-band">
                <div>
                  ${business.logo ? `<img src="${business.logo}" class="doc-logo-img" style="filter: brightness(0) invert(1);" alt="Logo">` : ''}
                  <div class="doc-business-name" style="color: #ffffff;">${business.name || 'Your Company Name'}</div>
                  ${business.tagline ? `<div style="font-size: 12px; opacity: 0.8;">${business.tagline}</div>` : ''}
                </div>
                <div style="text-align: right;">
                  <div class="doc-type-title">${isInvoice ? 'INVOICE' : 'QUOTE'}</div>
                  <div class="doc-number-label" style="color: #94a3b8;">${this.doc.number}</div>
                </div>
              </div>
            ` : ''}

            <div class="${this.selectedTemplate === 'bold' ? 'bold-inner-body' : ''}">
              
              ${this.selectedTemplate !== 'bold' ? `
                <!-- Standard Header Block -->
                <div class="doc-paper-header">
                  <div class="doc-business-info">
                    ${business.logo ? `<img src="${business.logo}" class="doc-logo-img" alt="Logo">` : ''}
                    <div class="doc-business-name">${business.name || 'Your Business Name'}</div>
                    ${business.tagline ? `<div style="font-size: 12px; color: #64748b;">${business.tagline}</div>` : ''}
                    ${business.address ? `<div style="font-size: 12.5px; color: #475569; white-space: pre-line; margin-top: 4px;">${business.address}</div>` : ''}
                    ${business.email ? `<div style="font-size: 12.5px; color: #475569;">Email: ${business.email}</div>` : ''}
                    ${business.phone ? `<div style="font-size: 12.5px; color: #475569;">Phone: ${business.phone}</div>` : ''}
                    ${business.taxNumber ? `<div style="font-size: 12px; color: #64748b;">Tax/VAT ID: ${business.taxNumber}</div>` : ''}
                  </div>

                  <div class="doc-title-block">
                    <div class="doc-type-title">${isInvoice ? 'INVOICE' : 'QUOTE'}</div>
                    <div class="doc-number-label">${this.doc.number}</div>
                    <div style="margin-top: 4px;">
                      <span class="badge ${statusClass}">${this.doc.status}</span>
                    </div>
                  </div>
                </div>
              ` : `
                <!-- Bold Template Top Meta Info -->
                <div style="font-size: 12.5px; color: #475569; margin-bottom: 24px; display: flex; justify-content: space-between;">
                  <div>
                    ${business.address ? `<div style="white-space: pre-line;">${business.address}</div>` : ''}
                    ${business.email ? `<div>Email: ${business.email}</div>` : ''}
                    ${business.phone ? `<div>Phone: ${business.phone}</div>` : ''}
                  </div>
                  <div style="text-align: right;">
                    ${business.taxNumber ? `<div>Tax/VAT: ${business.taxNumber}</div>` : ''}
                    ${business.regNumber ? `<div>Reg #: ${business.regNumber}</div>` : ''}
                  </div>
                </div>
              `}

              <!-- Recipient and Meta Grid -->
              <div class="doc-details-grid">
                <div class="doc-bill-to">
                  <div class="doc-section-heading">BILLED TO</div>
                  <div class="doc-customer-name">${this.doc.customer?.name || 'Valued Customer'}</div>
                  ${this.doc.customer?.company ? `<div style="font-size: 13px; font-weight: 600; color: #334155;">${this.doc.customer.company}</div>` : ''}
                  ${this.doc.customer?.address ? `<div style="font-size: 12.5px; color: #475569; white-space: pre-line; margin-top: 2px;">${this.doc.customer.address}</div>` : ''}
                  ${this.doc.customer?.email ? `<div style="font-size: 12.5px; color: #475569;">${this.doc.customer.email}</div>` : ''}
                  ${this.doc.customer?.phone ? `<div style="font-size: 12.5px; color: #475569;">${this.doc.customer.phone}</div>` : ''}
                  ${this.doc.customer?.taxNumber ? `<div style="font-size: 12px; color: #64748b;">Tax/VAT ID: ${this.doc.customer.taxNumber}</div>` : ''}
                </div>

                <div class="doc-meta-table">
                  <div class="doc-meta-row">
                    <span class="doc-meta-label">Issue Date:</span>
                    <span class="doc-meta-val">${formatDate(this.doc.date)}</span>
                  </div>
                  ${isInvoice ? `
                    <div class="doc-meta-row">
                      <span class="doc-meta-label">Due Date:</span>
                      <span class="doc-meta-val">${formatDate(this.doc.dueDate)}</span>
                    </div>
                  ` : `
                    <div class="doc-meta-row">
                      <span class="doc-meta-label">Expiration Date:</span>
                      <span class="doc-meta-val">${formatDate(this.doc.expirationDate)}</span>
                    </div>
                  `}
                  ${this.doc.reference ? `
                    <div class="doc-meta-row">
                      <span class="doc-meta-label">PO / Ref #:</span>
                      <span class="doc-meta-val">${this.doc.reference}</span>
                    </div>
                  ` : ''}
                  <div class="doc-meta-row">
                    <span class="doc-meta-label">Currency:</span>
                    <span class="doc-meta-val">${docCurrency}</span>
                  </div>
                </div>
              </div>

              <!-- Line Items Table -->
              <table class="doc-table">
                <thead>
                  <tr>
                    <th style="width: 40px; text-align: center;">#</th>
                    <th>Item Description</th>
                    <th style="text-align: right; width: 80px;">Qty</th>
                    <th style="text-align: right; width: 100px;">Price</th>
                    <th style="text-align: right; width: 90px;">Discount</th>
                    <th style="text-align: right; width: 80px;">Tax</th>
                    <th style="text-align: right; width: 110px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.doc.items.map((item, index) => {
                    const lineCalc = calculateLineItem(item, this.doc.taxMode || 'exclusive');
                    return `
                      <tr>
                        <td style="text-align: center; color: #94a3b8; font-weight: 600;">${index + 1}</td>
                        <td>
                          <div class="doc-table-desc-title">${item.description || 'Item'}</div>
                          ${item.notes ? `<div class="doc-table-desc-subtitle">${item.notes}</div>` : ''}
                        </td>
                        <td style="text-align: right; font-weight: 600;">
                          ${item.quantity} <span style="font-size: 11px; color: #64748b;">${item.unit || ''}</span>
                        </td>
                        <td style="text-align: right;">${formatCurrency(item.unitPrice, docCurrency)}</td>
                        <td style="text-align: right; color: ${lineCalc.discountAmount > 0 ? '#16a34a' : '#64748b'};">
                          ${lineCalc.discountAmount > 0 ? `-${formatCurrency(lineCalc.discountAmount, docCurrency)}` : '—'}
                        </td>
                        <td style="text-align: right; color: #64748b;">
                          ${item.taxRate > 0 ? `${item.taxRate}%` : '0%'}
                        </td>
                        <td style="text-align: right; font-weight: 700;">
                          ${formatCurrency(lineCalc.lineTotal, docCurrency)}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>

              <!-- Footer Calculation & Notes Grid -->
              <div class="doc-footer-grid">
                <!-- Left: Notes, Payment Info, Terms -->
                <div class="doc-notes-block">
                  ${this.doc.notes ? `
                    <div>
                      <div class="doc-section-heading">NOTES</div>
                      <div style="white-space: pre-line;">${this.doc.notes}</div>
                    </div>
                  ` : ''}

                  ${business.paymentInfo ? `
                    <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
                      <div class="doc-section-heading">PAYMENT INSTRUCTIONS</div>
                      <div style="white-space: pre-line; font-size: 12px; font-family: var(--font-mono); color: #334155; line-height: 1.5;">${business.paymentInfo}</div>
                    </div>
                  ` : ''}

                  ${this.doc.terms ? `
                    <div>
                      <div class="doc-section-heading">TERMS & CONDITIONS</div>
                      <div style="white-space: pre-line; font-size: 11.5px; color: #64748b;">${this.doc.terms}</div>
                    </div>
                  ` : ''}
                </div>

                <!-- Right: Calculation Totals -->
                <div class="doc-totals-block">
                  <div class="doc-total-line">
                    <span>Subtotal:</span>
                    <strong>${formatCurrency(calc.grossSubtotal, docCurrency)}</strong>
                  </div>

                  ${calc.lineDiscountsTotal > 0 ? `
                    <div class="doc-total-line" style="color: #16a34a;">
                      <span>Line Discounts:</span>
                      <strong>-${formatCurrency(calc.lineDiscountsTotal, docCurrency)}</strong>
                    </div>
                  ` : ''}

                  ${calc.docDiscountAmount > 0 ? `
                    <div class="doc-total-line" style="color: #16a34a;">
                      <span>Document Discount (${this.doc.docDiscountType === 'percent' ? `${this.doc.docDiscountValue}%` : 'Fixed'}):</span>
                      <strong>-${formatCurrency(calc.docDiscountAmount, docCurrency)}</strong>
                    </div>
                  ` : ''}

                  ${calc.taxBreakdown.map(t => `
                    <div class="doc-total-line">
                      <span>${t.taxName}:</span>
                      <strong>${this.doc.taxMode === 'inclusive' ? '(Incl.) ' : ''}${formatCurrency(t.taxAmount, docCurrency)}</strong>
                    </div>
                  `).join('')}

                  ${calc.shippingFee > 0 ? `
                    <div class="doc-total-line">
                      <span>Shipping / Delivery:</span>
                      <strong>${formatCurrency(calc.shippingFee, docCurrency)}</strong>
                    </div>
                  ` : ''}

                  ${calc.additionalCharges > 0 ? `
                    <div class="doc-total-line">
                      <span>Additional Fees:</span>
                      <strong>${formatCurrency(calc.additionalCharges, docCurrency)}</strong>
                    </div>
                  ` : ''}

                  <div class="doc-total-line grand-total">
                    <span>Total:</span>
                    <span>${formatCurrency(calc.grandTotal, docCurrency)}</span>
                  </div>

                  ${isInvoice ? `
                    <div class="doc-total-line" style="padding-top: 4px;">
                      <span>Amount Paid:</span>
                      <strong style="color: #16a34a;">${formatCurrency(calc.amountPaid, docCurrency)}</strong>
                    </div>
                    <div class="doc-total-line amount-due-highlight">
                      <span>Balance Due:</span>
                      <span>${formatCurrency(calc.amountDue, docCurrency)}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    // Template Switcher buttons
    this.container.querySelectorAll('.segment-btn[data-template]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tmpl = btn.dataset.template;
        this.selectedTemplate = tmpl;
        this.doc.template = tmpl;
        DocumentRepo.save(this.doc);
        this.renderPreview();
      });
    });

    // Status changer dropdown
    this.container.querySelector('#preview-status-select')?.addEventListener('change', (e) => {
      this.doc.status = e.target.value;
      DocumentRepo.save(this.doc);
      window.app.showToast('Status Updated', `Document marked as ${this.doc.status}`, 'info');
      this.renderPreview();
    });

    // Print button
    this.container.querySelector('#btn-preview-print')?.addEventListener('click', () => {
      PDFExport.print();
    });

    // Download PDF button
    this.container.querySelector('#btn-preview-download-pdf')?.addEventListener('click', () => {
      const paper = document.getElementById('invoice-paper');
      const filename = `${this.doc.type}_${this.doc.number}.pdf`;
      PDFExport.downloadPDF(paper, filename);
    });

    // Email Modal
    this.container.querySelector('#btn-preview-email')?.addEventListener('click', () => {
      window.app.showEmailModal(this.doc.id);
    });

    // Copy Summary Text
    this.container.querySelector('#btn-preview-copy-summary')?.addEventListener('click', () => {
      const settings = SettingsRepo.get();
      const calc = calculateDocument(this.doc, settings);
      const docCurrency = this.doc.currency || settings.currency || 'USD';
      const isInvoice = this.doc.type === 'invoice';

      const summaryText = `${isInvoice ? 'INVOICE' : 'QUOTE'} #${this.doc.number}
Client: ${this.doc.customer?.name || 'Valued Customer'} ${this.doc.customer?.company ? `(${this.doc.customer.company})` : ''}
Date: ${formatDate(this.doc.date)}
${isInvoice && this.doc.dueDate ? `Due Date: ${formatDate(this.doc.dueDate)}\n` : ''}Total Amount: ${formatCurrency(calc.grandTotal, docCurrency)}
${isInvoice && calc.amountDue > 0 ? `Balance Due: ${formatCurrency(calc.amountDue, docCurrency)}\n` : ''}
Items:
${this.doc.items.map((it, i) => `  ${i + 1}. ${it.description} — ${it.quantity} ${it.unit || ''} @ ${formatCurrency(it.unitPrice, docCurrency)} = ${formatCurrency(it.quantity * it.unitPrice, docCurrency)}`).join('\n')}`;

      navigator.clipboard.writeText(summaryText).then(() => {
        window.app.showToast('Copied', 'Document summary copied to clipboard.', 'success');
      }).catch(() => {
        window.app.showToast('Notice', 'Unable to copy to clipboard.', 'info');
      });
    });

    // Duplicate
    this.container.querySelector('#btn-preview-duplicate')?.addEventListener('click', () => {
      const duplicated = DocumentRepo.duplicate(this.doc.id);
      if (duplicated) {
        window.app.showToast('Duplicated', `Created copy ${duplicated.number}`, 'success');
        window.location.hash = `#/documents/${duplicated.id}/edit`;
      }
    });

    // Delete
    this.container.querySelector('#btn-preview-delete')?.addEventListener('click', () => {
      if (confirm(`Are you sure you want to permanently delete ${this.doc.type.toUpperCase()} ${this.doc.number}?`)) {
        DocumentRepo.delete(this.doc.id);
        window.app.showToast('Deleted', `Deleted ${this.doc.number}`, 'info');
        window.location.hash = '#/documents';
      }
    });

    // Record Payment
    this.container.querySelector('#btn-preview-record-payment')?.addEventListener('click', () => {
      window.app.showPaymentModal(this.doc.id, () => {
        this.doc = DocumentRepo.getById(this.doc.id);
        this.renderPreview();
      });
    });

    // Convert Quote
    this.container.querySelector('#btn-preview-convert')?.addEventListener('click', () => {
      try {
        const newInvoice = DocumentRepo.convertQuoteToInvoice(this.doc.id);
        window.app.showToast('Quote Converted', `Successfully created Invoice ${newInvoice.number}`, 'success');
        window.location.hash = `#/documents/${newInvoice.id}/preview`;
      } catch (err) {
        window.app.showToast('Conversion Error', err.message, 'error');
      }
    });
  }
};
