/**
 * Interactive Document Preview & Export View
 * Full-page high-fidelity renderer with 4 design templates, brand customization, PDF export, status updater, and email sharing.
 */

import { DocumentRepo, SettingsRepo } from '../storage/repository.js';
import { calculateDocument, calculateLineItem } from '../engine/calculation.js';
import { formatCurrency, formatDate } from '../engine/formatter.js';
import { PDFExport } from '../export/pdf.js';
import { getIcon } from '../../assets/icons.js';

export const PreviewView = {
  doc: null,
  selectedTemplate: 'modern',
  brandColor: null,
  brandFont: null,

  render(container, docId) {
    this.container = container;
    this.doc = DocumentRepo.getById(docId);

    if (!this.doc) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${getIcon('fileText')}</div>
          <h2 class="empty-title">Document Not Found</h2>
          <p class="empty-desc">The requested invoice or quote does not exist in your workspace.</p>
          <a href="#/documents" class="btn btn-primary">Back to Documents</a>
        </div>
      `;
      return;
    }

    const settings = SettingsRepo.get();
    const business = settings.business || {};
    this.selectedTemplate = this.doc.template || settings.defaultTemplate || 'modern';
    this.brandColor = this.doc.brandColor || settings.brandColor || '#2563eb';
    this.brandFont = settings.brandFont || 'Inter';

    const isInvoice = this.doc.type === 'invoice';
    const calc = calculateDocument(this.doc, settings);
    const docCurrency = this.doc.currency || settings.currency || 'USD';

    let statusClass = 'badge-draft';
    if (this.doc.status === 'Sent') statusClass = 'badge-sent';
    else if (this.doc.status === 'Paid' || this.doc.status === 'Accepted') statusClass = 'badge-paid';
    else if (this.doc.status === 'Overdue') statusClass = 'badge-overdue';
    else if (this.doc.status === 'Converted') statusClass = 'badge-converted';

    container.innerHTML = `
      <div class="view-header no-print">
        <div>
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
            <a href="#/documents" class="btn btn-subtle btn-sm">${getIcon('arrowLeft')} Back</a>
            <span class="badge ${statusClass}">${this.doc.status}</span>
          </div>
          <h1 class="view-title">${this.doc.number}</h1>
          <p class="view-subtitle">${isInvoice ? 'Invoice' : 'Quote'} for <strong>${this.doc.customer?.name || 'Customer'}</strong></p>
        </div>

        <div class="view-actions">
          <a href="#/editor/${this.doc.id}" class="btn btn-secondary btn-sm">
            ${getIcon('edit')} Edit
          </a>
          ${!isInvoice && this.doc.status !== 'Converted' ? `
            <button id="btn-preview-convert" class="btn btn-secondary btn-sm" style="color: #2563eb;">
              ${getIcon('refreshCw')} Convert to Invoice
            </button>
          ` : ''}
          ${isInvoice && calc.balanceDue > 0 ? `
            <button id="btn-preview-record-payment" class="btn btn-secondary btn-sm" style="color: #16a34a;">
              ${getIcon('creditCard')} Record Payment
            </button>
          ` : ''}
          <button id="btn-preview-email" class="btn btn-secondary btn-sm">
            ${getIcon('mail')} Send / Share
          </button>
          <button id="btn-preview-download-pdf" class="btn btn-primary btn-sm">
            ${getIcon('download')} Download PDF
          </button>
        </div>
      </div>

      <!-- Action & Template Control Bar -->
      <div class="preview-action-bar no-print">
        <div class="preview-options">
          <label class="form-label" style="margin-bottom: 0; font-size: 12px; font-weight: 700;">Template:</label>
          <div class="template-chips">
            <button class="template-chip ${this.selectedTemplate === 'modern' ? 'active' : ''}" data-template="modern">
              Modern
            </button>
            <button class="template-chip ${this.selectedTemplate === 'classic' ? 'active' : ''}" data-template="classic">
              Classic
            </button>
            <button class="template-chip ${this.selectedTemplate === 'minimal' ? 'active' : ''}" data-template="minimal">
              Minimal
            </button>
            <button class="template-chip ${this.selectedTemplate === 'bold' ? 'active' : ''}" data-template="bold">
              Bold Studio
            </button>
          </div>

          <div style="height: 20px; width: 1px; background: var(--border-subtle); margin: 0 4px;"></div>

          <!-- Color Customizer -->
          <div style="display: flex; align-items: center; gap: 6px;">
            <label class="form-label" style="margin-bottom: 0; font-size: 12px; font-weight: 700;">Color:</label>
            <input type="color" id="preview-brand-color-picker" value="${this.brandColor}" style="width: 30px; height: 28px; padding: 1px; border-radius: 4px; border: 1px solid var(--border-strong); cursor: pointer;" title="Change document brand color">
            <button type="button" id="btn-save-doc-branding" class="btn btn-subtle btn-sm" style="font-size: 11px; padding: 4px 8px;" title="Save as default workspace brand color">
              ${getIcon('save')} Set as Default
            </button>
          </div>
        </div>

        <div style="display: flex; gap: 8px; align-items: center;">
          <!-- Status Dropdown -->
          <div style="display: flex; align-items: center; gap: 6px;">
            <label class="form-label" style="margin-bottom: 0; font-size: 12px; font-weight: 700;">Status:</label>
            <select id="preview-status-select" class="form-control" style="padding: 4px 8px; font-size: 12px; height: 32px; width: 120px;">
              ${isInvoice ? `
                <option value="Draft" ${this.doc.status === 'Draft' ? 'selected' : ''}>Draft</option>
                <option value="Sent" ${this.doc.status === 'Sent' ? 'selected' : ''}>Sent</option>
                <option value="Paid" ${this.doc.status === 'Paid' ? 'selected' : ''}>Paid</option>
                <option value="Overdue" ${this.doc.status === 'Overdue' ? 'selected' : ''}>Overdue</option>
                <option value="Cancelled" ${this.doc.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
              ` : `
                <option value="Draft" ${this.doc.status === 'Draft' ? 'selected' : ''}>Draft</option>
                <option value="Sent" ${this.doc.status === 'Sent' ? 'selected' : ''}>Sent</option>
                <option value="Accepted" ${this.doc.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
                <option value="Rejected" ${this.doc.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                <option value="Converted" ${this.doc.status === 'Converted' ? 'selected' : ''}>Converted</option>
              `}
            </select>
          </div>

          <button id="btn-preview-copy-summary" class="btn btn-secondary btn-sm" title="Copy Text Summary to Clipboard">
            ${getIcon('copy')} Summary
          </button>

          <button id="btn-preview-duplicate" class="btn btn-secondary btn-sm" title="Duplicate Document">
            ${getIcon('copy')} Duplicate
          </button>

          <button id="btn-preview-print" class="btn btn-secondary btn-sm">
            ${getIcon('printer')} Print
          </button>

          <button id="btn-preview-delete" class="btn btn-subtle btn-sm" style="color: #ef4444;" title="Delete Document">
            ${getIcon('trash')}
          </button>
        </div>
      </div>

      <!-- Rendered Document Sheet -->
      <div class="document-sheet-wrapper">
        <div id="invoice-paper" class="doc-paper template-${this.selectedTemplate}" style="--brand-primary: ${this.brandColor}; font-family: '${this.brandFont}', -apple-system, BlinkMacSystemFont, sans-serif;">
          
          ${this.selectedTemplate === 'bold' ? `
            <!-- Bold Header Banner -->
            <div class="bold-header-band">
              <div>
                ${business.logo ? `<img src="${business.logo}" class="doc-logo-img" style="filter: brightness(0) invert(1);" alt="Logo">` : ''}
                <div class="doc-business-name" style="color: #ffffff;">${business.name || 'Your Company Name'}</div>
                ${business.tagline ? `<div style="font-size: 12px; opacity: 0.85; color: #ffffff;">${business.tagline}</div>` : ''}
              </div>
              <div style="text-align: right;">
                <div class="doc-type-title">${isInvoice ? 'INVOICE' : 'QUOTE'}</div>
                <div class="doc-number-label" style="color: #ffffff; opacity: 0.9;">${this.doc.number}</div>
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
              <div style="font-size: 12.5px; color: #475569; margin-bottom: 20px; display: flex; justify-content: space-between;">
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
                  <th style="width: 36px; text-align: center;">#</th>
                  <th>Item Description</th>
                  <th style="text-align: right; width: 75px;">Qty</th>
                  <th style="text-align: right; width: 95px;">Price</th>
                  <th style="text-align: right; width: 85px;">Discount</th>
                  <th style="text-align: right; width: 75px;">Tax</th>
                  <th style="text-align: right; width: 105px;">Amount</th>
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
                      <td style="text-align: right; font-weight: 700; color: #0f172a;">
                        ${formatCurrency(lineCalc.lineTotal, docCurrency)}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <!-- Bottom Notes & Totals Breakdown -->
            <div class="doc-footer-grid">
              
              <div class="doc-notes-block">
                ${business.paymentInfo ? `
                  <div>
                    <div class="doc-section-heading">PAYMENT INSTRUCTIONS</div>
                    <div style="font-size: 12px; color: #475569; white-space: pre-line; line-height: 1.4;">${business.paymentInfo}</div>
                  </div>
                ` : ''}

                ${this.doc.notes ? `
                  <div>
                    <div class="doc-section-heading">NOTES & TERMS</div>
                    <div style="font-size: 12px; color: #475569; white-space: pre-line; line-height: 1.4;">${this.doc.notes}</div>
                  </div>
                ` : ''}
              </div>

              <!-- Calculation Totals Block -->
              <div class="doc-totals-block">
                <div class="doc-total-line">
                  <span>Subtotal:</span>
                  <span style="font-weight: 600; color: #0f172a;">${formatCurrency(calc.subtotal, docCurrency)}</span>
                </div>

                ${calc.totalDiscount > 0 ? `
                  <div class="doc-total-line" style="color: #16a34a;">
                    <span>Discount:</span>
                    <span style="font-weight: 600;">-${formatCurrency(calc.totalDiscount, docCurrency)}</span>
                  </div>
                ` : ''}

                ${calc.totalTax > 0 ? `
                  <div class="doc-total-line">
                    <span>${settings.taxName || 'Tax'} (${this.doc.taxMode === 'inclusive' ? 'incl.' : 'added'}):</span>
                    <span style="font-weight: 600; color: #0f172a;">${formatCurrency(calc.totalTax, docCurrency)}</span>
                  </div>
                ` : ''}

                ${calc.shipping > 0 ? `
                  <div class="doc-total-line">
                    <span>Shipping & Handling:</span>
                    <span style="font-weight: 600; color: #0f172a;">${formatCurrency(calc.shipping, docCurrency)}</span>
                  </div>
                ` : ''}

                <div class="doc-total-line grand-total">
                  <span>Total Amount:</span>
                  <span>${formatCurrency(calc.grandTotal, docCurrency)}</span>
                </div>

                ${isInvoice ? `
                  ${calc.amountPaid > 0 ? `
                    <div class="doc-total-line" style="color: #16a34a; font-weight: 600; padding-top: 4px;">
                      <span>Amount Paid:</span>
                      <span>-${formatCurrency(calc.amountPaid, docCurrency)}</span>
                    </div>
                  ` : ''}

                  <div class="doc-total-line amount-due-highlight">
                    <span>Balance Due:</span>
                    <span>${formatCurrency(calc.balanceDue, docCurrency)}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    // Template chips switching
    this.container.querySelectorAll('.template-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const template = chip.dataset.template;
        this.selectedTemplate = template;
        
        // Save to document
        this.doc.template = template;
        DocumentRepo.save(this.doc);

        this.render(this.container, this.doc.id);
      });
    });

    // Brand color picker
    const colorPicker = this.container.querySelector('#preview-brand-color-picker');
    if (colorPicker) {
      colorPicker.addEventListener('input', (e) => {
        this.brandColor = e.target.value;
        const paper = this.container.querySelector('#invoice-paper');
        if (paper) {
          paper.style.setProperty('--brand-primary', e.target.value);
        }
      });
      colorPicker.addEventListener('change', (e) => {
        this.doc.brandColor = e.target.value;
        DocumentRepo.save(this.doc);
      });
    }

    // Set as Default Branding
    this.container.querySelector('#btn-save-doc-branding')?.addEventListener('click', () => {
      if (this.brandColor) {
        SettingsRepo.save({
          brandColor: this.brandColor,
          defaultTemplate: this.selectedTemplate
        });
        window.app.showToast('Branding Saved', `Set ${this.brandColor} and ${this.selectedTemplate} as workspace defaults.`, 'success');
      }
    });

    // Status change listener
    const statusSelect = this.container.querySelector('#preview-status-select');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        const newStatus = e.target.value;
        DocumentRepo.updateStatus(this.doc.id, newStatus);
        this.doc.status = newStatus;
        window.app.showToast('Status Updated', `Document marked as ${newStatus}.`, 'success');
        this.render(this.container, this.doc.id);
      });
    }

    // Convert Quote to Invoice
    this.container.querySelector('#btn-preview-convert')?.addEventListener('click', () => {
      try {
        const newInvoice = DocumentRepo.convertQuoteToInvoice(this.doc.id);
        window.app.showToast('Quote Converted', `Created Invoice ${newInvoice.number}`, 'success');
        window.location.hash = `#/preview/${newInvoice.id}`;
      } catch (err) {
        window.app.showToast('Conversion Error', err.message, 'error');
      }
    });

    // Record Payment
    this.container.querySelector('#btn-preview-record-payment')?.addEventListener('click', () => {
      window.app.showPaymentModal(this.doc.id, () => {
        this.render(this.container, this.doc.id);
      });
    });

    // Send / Share Email Modal
    this.container.querySelector('#btn-preview-email')?.addEventListener('click', () => {
      window.app.showEmailModal(this.doc.id);
    });

    // Copy Summary to Clipboard
    this.container.querySelector('#btn-preview-copy-summary')?.addEventListener('click', () => {
      const calc = calculateDocument(this.doc, SettingsRepo.get());
      const summaryText = `Document: ${this.doc.number}\nType: ${this.doc.type.toUpperCase()}\nCustomer: ${this.doc.customer?.name || 'Customer'}\nDate: ${formatDate(this.doc.date)}\nTotal: ${formatCurrency(calc.grandTotal, this.doc.currency)}\nBalance Due: ${formatCurrency(calc.balanceDue, this.doc.currency)}\nStatus: ${this.doc.status}`;
      
      navigator.clipboard.writeText(summaryText).then(() => {
        window.app.showToast('Summary Copied', 'Invoice details copied to clipboard.', 'success');
      }).catch(() => {
        window.app.showToast('Copied', summaryText.replace(/\n/g, ' | '), 'info');
      });
    });

    // Duplicate Document
    this.container.querySelector('#btn-preview-duplicate')?.addEventListener('click', () => {
      const duplicate = DocumentRepo.duplicate(this.doc.id);
      if (duplicate) {
        window.app.showToast('Document Duplicated', `Created new draft ${duplicate.number}`, 'success');
        window.location.hash = `#/editor/${duplicate.id}`;
      }
    });

    // Delete Document
    this.container.querySelector('#btn-preview-delete')?.addEventListener('click', () => {
      if (confirm(`Are you sure you want to delete ${this.doc.number}? This cannot be undone.`)) {
        DocumentRepo.delete(this.doc.id);
        window.app.showToast('Deleted', `${this.doc.number} removed.`, 'info');
        window.location.hash = '#/documents';
      }
    });

    // Print Dialog
    this.container.querySelector('#btn-preview-print')?.addEventListener('click', () => {
      PDFExport.print();
    });

    // Download PDF
    this.container.querySelector('#btn-preview-download-pdf')?.addEventListener('click', async () => {
      const paper = this.container.querySelector('#invoice-paper');
      const filename = `${this.doc.number || 'document'}.pdf`;
      
      const btn = this.container.querySelector('#btn-preview-download-pdf');
      const origText = btn.innerHTML;
      btn.innerHTML = `${getIcon('refreshCw')} Generating PDF...`;
      btn.disabled = true;

      try {
        await PDFExport.downloadPDF(paper, filename);
        window.app.showToast('PDF Exported', `${filename} generated successfully.`, 'success');
      } catch (err) {
        console.error('PDF error:', err);
        window.app.showToast('Export Note', 'Opened print dialog for PDF saving.', 'info');
      } finally {
        btn.innerHTML = origText;
        btn.disabled = false;
      }
    });
  }
};
