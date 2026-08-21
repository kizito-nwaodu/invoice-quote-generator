/**
 * Unified Interactive Invoice & Quote Editor
 */

import { DocumentRepo, CustomerRepo, ProductRepo, SettingsRepo } from '../storage/repository.js';
import { calculateDocument, calculateLineItem, roundToCents } from '../engine/calculation.js';
import { formatCurrency, formatDate, getTodayDateString, addDays, CURRENCIES } from '../engine/formatter.js';
import { validateDocument } from '../engine/validator.js';
import { getIcon } from '../../assets/icons.js';

export const EditorView = {
  doc: null,
  isNew: true,

  render(container, docId = null, defaultType = 'invoice') {
    this.container = container;
    const settings = SettingsRepo.get();
    const customers = CustomerRepo.getAll();
    const products = ProductRepo.getAll();

    if (docId) {
      const existing = DocumentRepo.getById(docId);
      if (!existing) {
        window.app.showToast('Error', 'Document not found', 'error');
        window.location.hash = '#/documents';
        return;
      }
      this.doc = JSON.parse(JSON.stringify(existing));
      this.isNew = false;
    } else {
      this.isNew = true;
      const nextInfo = DocumentRepo.getNextDocNumber(defaultType);
      const today = getTodayDateString();
      const termsDays = parseInt(settings.defaultPaymentTerms || '14', 10);

      this.doc = {
        type: defaultType,
        number: nextInfo.number,
        status: 'Draft',
        date: today,
        dueDate: defaultType === 'invoice' ? addDays(today, termsDays) : '',
        expirationDate: defaultType === 'quote' ? addDays(today, 30) : '',
        currency: settings.currency || 'USD',
        template: settings.defaultTemplate || 'modern',
        taxMode: settings.taxMode || 'exclusive',
        customer: customers.length > 0 ? { ...customers[0] } : null,
        items: [
          {
            id: `item_${Date.now()}_1`,
            description: '',
            quantity: 1,
            unit: 'hrs',
            unitPrice: 0,
            discountType: 'percent',
            discountValue: 0,
            taxRate: settings.taxRate !== undefined ? settings.taxRate : 8.5,
            taxName: `${settings.taxName || 'Tax'} (${settings.taxRate || 8.5}%)`
          }
        ],
        docDiscountType: 'percent',
        docDiscountValue: 0,
        shippingFee: 0,
        additionalCharges: 0,
        notes: '',
        terms: settings.business?.footerNotes || 'Thank you for your business. Payment is due within agreed terms.',
        payments: []
      };
    }

    this.renderForm();
  },

  renderForm() {
    const settings = SettingsRepo.get();
    const customers = CustomerRepo.getAll();
    const products = ProductRepo.getAll();
    const isInvoice = this.doc.type === 'invoice';
    const calc = calculateDocument(this.doc, settings);
    const docCurrency = this.doc.currency || settings.currency || 'USD';

    this.container.innerHTML = `
      <div class="view-container">
        <!-- Top Action Bar -->
        <div class="toolbar">
          <div style="display: flex; align-items: center; gap: 14px;">
            <a href="#/documents" class="btn btn-subtle btn-sm">
              ${getIcon('arrowLeft')} Back
            </a>
            <div>
              <h1 style="font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">
                ${this.isNew ? `New ${isInvoice ? 'Invoice' : 'Quote'}` : `Edit ${this.doc.number}`}
              </h1>
              <div style="font-size: 12.5px; color: var(--text-secondary);">
                ${this.isNew ? 'Create and finalize a professional document' : `Status: ${this.doc.status}`}
              </div>
            </div>
          </div>
          <div class="filter-group">
            <button id="btn-save-draft" class="btn btn-secondary">
              ${getIcon('check')} Save Draft
            </button>
            <button id="btn-save-preview" class="btn btn-primary">
              ${getIcon('eye')} Save & Preview
            </button>
          </div>
        </div>

        <div class="editor-layout">
          <!-- Main Form Card -->
          <div class="card editor-main-card">
            
            <!-- Document Meta Header -->
            <div class="doc-header-grid">
              <!-- Left: Document Type & Numbering -->
              <div>
                <div class="form-row" style="margin-bottom: 14px;">
                  <div class="form-group">
                    <label class="form-label">Document Type</label>
                    <div class="segmented-control" style="width: 100%;">
                      <button type="button" class="segment-btn ${isInvoice ? 'active' : ''}" id="toggle-type-invoice" style="flex: 1;">Invoice</button>
                      <button type="button" class="segment-btn ${!isInvoice ? 'active' : ''}" id="toggle-type-quote" style="flex: 1;">Quote</button>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label required">${isInvoice ? 'Invoice' : 'Quote'} Number</label>
                    <input type="text" id="doc-number-input" class="form-control" value="${this.doc.number}">
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Currency</label>
                    <select id="doc-currency-select" class="form-control">
                      ${Object.values(CURRENCIES).map(curr => `
                        <option value="${curr.code}" ${docCurrency === curr.code ? 'selected' : ''}>
                          ${curr.code} (${curr.symbol.trim()}) - ${curr.name}
                        </option>
                      `).join('')}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Tax Calculation Mode</label>
                    <select id="doc-tax-mode-select" class="form-control">
                      <option value="exclusive" ${this.doc.taxMode === 'exclusive' ? 'selected' : ''}>Tax Exclusive (Added to price)</option>
                      <option value="inclusive" ${this.doc.taxMode === 'inclusive' ? 'selected' : ''}>Tax Inclusive (Included in price)</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Right: Dates & Payment Terms -->
              <div>
                <div class="form-row" style="margin-bottom: 14px;">
                  <div class="form-group">
                    <label class="form-label required">Issue Date</label>
                    <input type="date" id="doc-date-input" class="form-control" value="${this.doc.date || getTodayDateString()}">
                  </div>
                  ${isInvoice ? `
                    <div class="form-group">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <label class="form-label" style="margin-bottom: 0;">Due Date</label>
                        <select id="doc-terms-preset" class="form-control" style="width: auto; padding: 2px 6px; font-size: 11px; height: 22px;">
                          <option value="">Terms...</option>
                          <option value="0">Due on Receipt</option>
                          <option value="7">Net 7 Days</option>
                          <option value="14" selected>Net 14 Days</option>
                          <option value="30">Net 30 Days</option>
                          <option value="60">Net 60 Days</option>
                        </select>
                      </div>
                      <input type="date" id="doc-duedate-input" class="form-control" value="${this.doc.dueDate || addDays(this.doc.date, 14)}">
                    </div>
                  ` : `
                    <div class="form-group">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <label class="form-label" style="margin-bottom: 0;">Expiration Date</label>
                        <select id="doc-expiry-preset" class="form-control" style="width: auto; padding: 2px 6px; font-size: 11px; height: 22px;">
                          <option value="">Validity...</option>
                          <option value="7">7 Days</option>
                          <option value="14">14 Days</option>
                          <option value="30" selected>30 Days</option>
                          <option value="60">60 Days</option>
                          <option value="90">90 Days</option>
                        </select>
                      </div>
                      <input type="date" id="doc-expirydate-input" class="form-control" value="${this.doc.expirationDate || addDays(this.doc.date, 30)}">
                    </div>
                  `}
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Reference / PO # (Optional)</label>
                    <input type="text" id="doc-reference-input" class="form-control" placeholder="e.g. PO-89214" value="${this.doc.reference || ''}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Document Status</label>
                    <select id="doc-status-select" class="form-control">
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
                  </div>
                </div>
              </div>
            </div>

            <!-- Customer Selection Card -->
            <div class="customer-selection-card">
              <div class="customer-card-header">
                <span style="font-weight: 700; font-size: 13.5px; display: flex; align-items: center; gap: 8px;">
                  ${getIcon('users')} Bill To Customer
                </span>
                <div style="display: flex; gap: 8px;">
                  <button type="button" id="btn-editor-new-customer" class="btn btn-subtle btn-sm">
                    ${getIcon('plus')} New Customer
                  </button>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group" style="margin-bottom: 0;">
                  <select id="doc-customer-select" class="form-control">
                    <option value="">-- Select a Customer --</option>
                    ${customers.map(c => `
                      <option value="${c.id}" ${this.doc.customer?.id === c.id ? 'selected' : ''}>
                        ${c.name} ${c.company ? `(${c.company})` : ''}
                      </option>
                    `).join('')}
                  </select>
                </div>
              </div>

              ${this.doc.customer ? `
                <div class="customer-detail-preview">
                  <strong>${this.doc.customer.name}</strong> ${this.doc.customer.company ? `• ${this.doc.customer.company}` : ''}
                  ${this.doc.customer.email ? `<div>Email: ${this.doc.customer.email}</div>` : ''}
                  ${this.doc.customer.phone ? `<div>Phone: ${this.doc.customer.phone}</div>` : ''}
                  ${this.doc.customer.address ? `<div>Address: ${this.doc.customer.address.replace(/\n/g, ', ')}</div>` : ''}
                  ${this.doc.customer.taxNumber ? `<div>Tax/VAT: ${this.doc.customer.taxNumber}</div>` : ''}
                </div>
              ` : `
                <div style="font-size: 12.5px; color: var(--text-muted);">
                  Please select an existing customer or click "New Customer" to add one.
                </div>
              `}
            </div>

            <!-- Line Items Table -->
            <div class="line-items-section">
              <div class="line-items-header">
                <h3 style="font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                  ${getIcon('package')} Line Items
                </h3>
                <div style="display: flex; gap: 8px;">
                  ${products.length > 0 ? `
                    <select id="insert-product-select" class="form-control" style="width: auto; font-size: 12.5px; padding: 5px 10px;">
                      <option value="">+ Add Product from Catalog...</option>
                      ${products.map(p => `
                        <option value="${p.id}">${p.name} - ${formatCurrency(p.unitPrice, docCurrency)}</option>
                      `).join('')}
                    </select>
                  ` : ''}
                  <button type="button" id="btn-add-line-row" class="btn btn-subtle btn-sm">
                    ${getIcon('plus')} Add Item
                  </button>
                </div>
              </div>

              <div class="table-responsive" style="overflow-x: auto;">
                <table class="line-item-table">
                  <thead>
                    <tr>
                      <th style="width: 30px;"></th>
                      <th>Description</th>
                      <th class="col-qty">Quantity</th>
                      <th class="col-unit">Unit</th>
                      <th class="col-price">Unit Price</th>
                      <th class="col-discount">Discount</th>
                      <th class="col-tax">Tax (%)</th>
                      <th class="col-total">Total</th>
                      <th class="col-actions"></th>
                    </tr>
                  </thead>
                  <tbody id="line-items-tbody">
                    ${this.doc.items.map((item, idx) => {
                      const lineCalc = calculateLineItem(item, this.doc.taxMode || 'exclusive');
                      return `
                        <tr class="line-item-row" data-index="${idx}">
                          <td>
                            <span class="btn-drag-handle">${getIcon('gripVertical')}</span>
                          </td>
                          <td>
                            <input type="text" class="form-control item-desc-input" placeholder="Service or Item Description" value="${item.description || ''}" data-field="description">
                          </td>
                          <td>
                            <input type="number" step="any" min="0" class="form-control" value="${item.quantity !== undefined ? item.quantity : 1}" data-field="quantity">
                          </td>
                          <td>
                            <input type="text" class="form-control" placeholder="hrs/ea" value="${item.unit || 'hrs'}" data-field="unit">
                          </td>
                          <td>
                            <input type="number" step="0.01" min="0" class="form-control" value="${item.unitPrice !== undefined ? item.unitPrice : 0}" data-field="unitPrice">
                          </td>
                          <td>
                            <div style="display: flex; gap: 4px;">
                              <input type="number" step="any" min="0" class="form-control" style="width: 65px;" value="${item.discountValue || 0}" data-field="discountValue">
                              <select class="form-control" style="padding: 6px 4px; width: 45px;" data-field="discountType">
                                <option value="percent" ${item.discountType === 'percent' ? 'selected' : ''}>%</option>
                                <option value="fixed" ${item.discountType === 'fixed' ? 'selected' : ''}>$</option>
                              </select>
                            </div>
                          </td>
                          <td>
                            <input type="number" step="any" min="0" class="form-control" value="${item.taxRate !== undefined ? item.taxRate : 0}" data-field="taxRate">
                          </td>
                          <td class="line-total-cell">
                            ${formatCurrency(lineCalc.lineTotal, docCurrency)}
                          </td>
                          <td>
                            <div class="line-actions-group">
                              <button type="button" class="btn btn-subtle btn-sm btn-icon-only btn-move-up-row" title="Move Up" data-index="${idx}" ${idx === 0 ? 'disabled style="opacity:0.4;cursor:default;"' : ''}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m18 15-6-6-6 6"/></svg>
                              </button>
                              <button type="button" class="btn btn-subtle btn-sm btn-icon-only btn-move-down-row" title="Move Down" data-index="${idx}" ${idx === this.doc.items.length - 1 ? 'disabled style="opacity:0.4;cursor:default;"' : ''}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
                              </button>
                              <button type="button" class="btn btn-subtle btn-sm btn-icon-only btn-dup-row" title="Duplicate Row" data-index="${idx}">
                                ${getIcon('copy')}
                              </button>
                              <button type="button" class="btn btn-subtle btn-sm btn-icon-only btn-del-row" title="Delete Row" data-index="${idx}" style="color: #ef4444;">
                                ${getIcon('trash')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Notes & Terms -->
            <div class="form-row" style="margin-top: 10px;">
              <div class="form-group">
                <label class="form-label">Notes for Customer</label>
                <textarea id="doc-notes-input" class="form-control" placeholder="Notes, project summary, or delivery details...">${this.doc.notes || ''}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Terms & Conditions</label>
                <textarea id="doc-terms-input" class="form-control" placeholder="Payment terms, bank wire info, late fees...">${this.doc.terms || ''}</textarea>
              </div>
            </div>
          </div>

          <!-- Sticky Sidebar Summary Card -->
          <div class="card editor-sidebar-card">
            <h3 class="card-title">${getIcon('dollarSign')} Calculation Summary</h3>

            <div class="summary-breakdown">
              <div class="summary-row">
                <span>Gross Subtotal</span>
                <strong>${formatCurrency(calc.grossSubtotal, docCurrency)}</strong>
              </div>

              ${calc.lineDiscountsTotal > 0 ? `
                <div class="summary-row discount-row">
                  <span>Line Item Discounts</span>
                  <strong>-${formatCurrency(calc.lineDiscountsTotal, docCurrency)}</strong>
                </div>
              ` : ''}

              <!-- Document-Level Discount Form Input -->
              <div style="padding: 8px 0; border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle); margin: 4px 0;">
                <label class="form-label" style="font-size: 12px; margin-bottom: 4px;">Overall Document Discount</label>
                <div style="display: flex; gap: 6px;">
                  <input type="number" step="any" min="0" id="doc-discount-val-input" class="form-control" style="flex: 1;" value="${this.doc.docDiscountValue || 0}">
                  <select id="doc-discount-type-select" class="form-control" style="width: 70px;">
                    <option value="percent" ${this.doc.docDiscountType === 'percent' ? 'selected' : ''}>%</option>
                    <option value="fixed" ${this.doc.docDiscountType === 'fixed' ? 'selected' : ''}>$</option>
                  </select>
                </div>
                ${calc.docDiscountAmount > 0 ? `
                  <div style="font-size: 12px; color: #16a34a; font-weight: 600; text-align: right; margin-top: 4px;">
                    -${formatCurrency(calc.docDiscountAmount, docCurrency)}
                  </div>
                ` : ''}
              </div>

              <!-- Taxes Breakdown -->
              ${calc.taxBreakdown.map(t => `
                <div class="summary-row">
                  <span>${t.taxName}</span>
                  <strong>${this.doc.taxMode === 'inclusive' ? '(Incl.) ' : ''}${formatCurrency(t.taxAmount, docCurrency)}</strong>
                </div>
              `).join('')}

              <!-- Shipping & Additional Charges Inputs -->
              <div style="padding: 6px 0; display: flex; flex-direction: column; gap: 8px;">
                <div>
                  <label class="form-label" style="font-size: 12px;">Shipping / Delivery Fee</label>
                  <input type="number" step="0.01" min="0" id="doc-shipping-input" class="form-control" value="${this.doc.shippingFee || 0}">
                </div>
                <div>
                  <label class="form-label" style="font-size: 12px;">Additional Charges / Fees</label>
                  <input type="number" step="0.01" min="0" id="doc-additional-input" class="form-control" value="${this.doc.additionalCharges || 0}">
                </div>
              </div>

              <div class="summary-row grand-total-row">
                <span>Grand Total</span>
                <span>${formatCurrency(calc.grandTotal, docCurrency)}</span>
              </div>

              ${isInvoice ? `
                <div class="summary-row">
                  <span>Amount Paid</span>
                  <strong style="color: #16a34a;">${formatCurrency(calc.amountPaid, docCurrency)}</strong>
                </div>
                <div class="summary-row amount-due-row">
                  <span>Amount Due</span>
                  <span>${formatCurrency(calc.amountDue, docCurrency)}</span>
                </div>
              ` : ''}
            </div>

            <!-- Action Buttons -->
            <div class="editor-action-buttons">
              <button type="button" id="btn-save-preview-side" class="btn btn-primary btn-lg" style="width: 100%;">
                ${getIcon('eye')} Save & View Document
              </button>
              <button type="button" id="btn-save-draft-side" class="btn btn-secondary" style="width: 100%;">
                ${getIcon('check')} Save Draft
              </button>
              <a href="#/documents" class="btn btn-subtle" style="width: 100%;">
                Cancel
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const syncDocFromInputs = () => {
      this.doc.number = this.container.querySelector('#doc-number-input')?.value || this.doc.number;
      this.doc.currency = this.container.querySelector('#doc-currency-select')?.value || 'USD';
      this.doc.taxMode = this.container.querySelector('#doc-tax-mode-select')?.value || 'exclusive';
      this.doc.date = this.container.querySelector('#doc-date-input')?.value || getTodayDateString();
      this.doc.status = this.container.querySelector('#doc-status-select')?.value || 'Draft';
      this.doc.reference = this.container.querySelector('#doc-reference-input')?.value || '';
      this.doc.notes = this.container.querySelector('#doc-notes-input')?.value || '';
      this.doc.terms = this.container.querySelector('#doc-terms-input')?.value || '';

      if (this.doc.type === 'invoice') {
        this.doc.dueDate = this.container.querySelector('#doc-duedate-input')?.value || '';
      } else {
        this.doc.expirationDate = this.container.querySelector('#doc-expirydate-input')?.value || '';
      }

      this.doc.docDiscountValue = parseFloat(this.container.querySelector('#doc-discount-val-input')?.value) || 0;
      this.doc.docDiscountType = this.container.querySelector('#doc-discount-type-select')?.value || 'percent';
      this.doc.shippingFee = parseFloat(this.container.querySelector('#doc-shipping-input')?.value) || 0;
      this.doc.additionalCharges = parseFloat(this.container.querySelector('#doc-additional-input')?.value) || 0;
    };

    // Toggle Type
    this.container.querySelector('#toggle-type-invoice')?.addEventListener('click', () => {
      if (this.doc.type !== 'invoice') {
        this.doc.type = 'invoice';
        const nextInfo = DocumentRepo.getNextDocNumber('invoice');
        this.doc.number = nextInfo.number;
        this.doc.dueDate = addDays(this.doc.date, 14);
        delete this.doc.expirationDate;
        this.renderForm();
      }
    });

    this.container.querySelector('#toggle-type-quote')?.addEventListener('click', () => {
      if (this.doc.type !== 'quote') {
        this.doc.type = 'quote';
        const nextInfo = DocumentRepo.getNextDocNumber('quote');
        this.doc.number = nextInfo.number;
        this.doc.expirationDate = addDays(this.doc.date, 30);
        delete this.doc.dueDate;
        this.renderForm();
      }
    });

    // Customer Selector
    this.container.querySelector('#doc-customer-select')?.addEventListener('change', (e) => {
      const custId = e.target.value;
      const cust = CustomerRepo.getById(custId);
      this.doc.customer = cust ? { ...cust } : null;
      syncDocFromInputs();
      this.renderForm();
    });

    // Add New Customer inline button
    this.container.querySelector('#btn-editor-new-customer')?.addEventListener('click', () => {
      syncDocFromInputs();
      window.app.showCustomerModal(null, (newCust) => {
        this.doc.customer = { ...newCust };
        this.renderForm();
      });
    });

    // Insert Product from catalog
    this.container.querySelector('#insert-product-select')?.addEventListener('change', (e) => {
      const prodId = e.target.value;
      if (!prodId) return;
      const prod = ProductRepo.getById(prodId);
      if (prod) {
        syncDocFromInputs();
        this.doc.items.push({
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          productId: prod.id,
          description: prod.name + (prod.description ? ` - ${prod.description}` : ''),
          quantity: 1,
          unit: prod.unit || 'hrs',
          unitPrice: prod.unitPrice || 0,
          discountType: 'percent',
          discountValue: 0,
          taxRate: prod.taxRate !== undefined ? prod.taxRate : 8.5,
          taxName: `Tax (${prod.taxRate || 8.5}%)`
        });
        this.renderForm();
      }
    });

    // Add empty row
    this.container.querySelector('#btn-add-line-row')?.addEventListener('click', () => {
      syncDocFromInputs();
      const settings = SettingsRepo.get();
      this.doc.items.push({
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        description: '',
        quantity: 1,
        unit: 'hrs',
        unitPrice: 0,
        discountType: 'percent',
        discountValue: 0,
        taxRate: settings.taxRate !== undefined ? settings.taxRate : 8.5,
        taxName: `Tax (${settings.taxRate || 8.5}%)`
      });
      this.renderForm();
    });

    // Line items input events
    this.container.querySelector('#line-items-tbody')?.addEventListener('input', (e) => {
      const target = e.target;
      const row = target.closest('.line-item-row');
      if (!row) return;
      const idx = parseInt(row.dataset.index, 10);
      const field = target.dataset.field;

      if (field && this.doc.items[idx]) {
        if (field === 'quantity' || field === 'unitPrice' || field === 'discountValue' || field === 'taxRate') {
          this.doc.items[idx][field] = parseFloat(target.value) || 0;
        } else {
          this.doc.items[idx][field] = target.value;
        }

        // Live update line total and sidebar calculations without destroying focus
        const lineCalc = calculateLineItem(this.doc.items[idx], this.doc.taxMode || 'exclusive');
        const cell = row.querySelector('.line-total-cell');
        if (cell) {
          cell.textContent = formatCurrency(lineCalc.lineTotal, this.doc.currency);
        }
        this.updateSidebarSummary();
      }
    });

    this.container.querySelector('#line-items-tbody')?.addEventListener('change', (e) => {
      const target = e.target;
      const row = target.closest('.line-item-row');
      if (!row) return;
      const idx = parseInt(row.dataset.index, 10);
      const field = target.dataset.field;
      if (field === 'discountType' && this.doc.items[idx]) {
        this.doc.items[idx].discountType = target.value;
        this.updateSidebarSummary();
      }
    });

    // Move row up
    this.container.querySelectorAll('.btn-move-up-row').forEach(btn => {
      btn.addEventListener('click', () => {
        syncDocFromInputs();
        const idx = parseInt(btn.dataset.index, 10);
        if (idx > 0 && this.doc.items[idx]) {
          const item = this.doc.items.splice(idx, 1)[0];
          this.doc.items.splice(idx - 1, 0, item);
          this.renderForm();
        }
      });
    });

    // Move row down
    this.container.querySelectorAll('.btn-move-down-row').forEach(btn => {
      btn.addEventListener('click', () => {
        syncDocFromInputs();
        const idx = parseInt(btn.dataset.index, 10);
        if (idx < this.doc.items.length - 1 && this.doc.items[idx]) {
          const item = this.doc.items.splice(idx, 1)[0];
          this.doc.items.splice(idx + 1, 0, item);
          this.renderForm();
        }
      });
    });

    // Duplicate line row
    this.container.querySelectorAll('.btn-dup-row').forEach(btn => {
      btn.addEventListener('click', () => {
        syncDocFromInputs();
        const idx = parseInt(btn.dataset.index, 10);
        if (this.doc.items[idx]) {
          const clone = JSON.parse(JSON.stringify(this.doc.items[idx]));
          clone.id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          this.doc.items.splice(idx + 1, 0, clone);
          this.renderForm();
        }
      });
    });

    // Delete line row
    this.container.querySelectorAll('.btn-del-row').forEach(btn => {
      btn.addEventListener('click', () => {
        syncDocFromInputs();
        const idx = parseInt(btn.dataset.index, 10);
        if (this.doc.items.length <= 1) {
          window.app.showToast('Warning', 'At least one line item is required.', 'warning');
          return;
        }
        this.doc.items.splice(idx, 1);
        this.renderForm();
      });
    });

    // Terms Presets
    this.container.querySelector('#doc-terms-preset')?.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val !== '') {
        const days = parseInt(val, 10);
        const issueDate = this.container.querySelector('#doc-date-input')?.value || getTodayDateString();
        const dueDate = addDays(issueDate, days);
        const dueInput = this.container.querySelector('#doc-duedate-input');
        if (dueInput) dueInput.value = dueDate;
        this.doc.dueDate = dueDate;
      }
    });

    this.container.querySelector('#doc-expiry-preset')?.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val !== '') {
        const days = parseInt(val, 10);
        const issueDate = this.container.querySelector('#doc-date-input')?.value || getTodayDateString();
        const expiryDate = addDays(issueDate, days);
        const expInput = this.container.querySelector('#doc-expirydate-input');
        if (expInput) expInput.value = expiryDate;
        this.doc.expirationDate = expiryDate;
      }
    });

    // Currency & Tax Mode change
    this.container.querySelector('#doc-currency-select')?.addEventListener('change', (e) => {
      this.doc.currency = e.target.value;
      this.renderForm();
    });

    this.container.querySelector('#doc-tax-mode-select')?.addEventListener('change', (e) => {
      this.doc.taxMode = e.target.value;
      this.renderForm();
    });

    // Discount, Shipping, Fees inputs
    ['#doc-discount-val-input', '#doc-discount-type-select', '#doc-shipping-input', '#doc-additional-input'].forEach(sel => {
      this.container.querySelector(sel)?.addEventListener('input', () => {
        syncDocFromInputs();
        this.updateSidebarSummary();
      });
    });

    // Save Handlers
    const handleSave = (goToPreview = false) => {
      syncDocFromInputs();
      const validation = validateDocument(this.doc);

      if (!validation.isValid) {
        window.app.showToast('Validation Error', validation.errors[0], 'error');
        return;
      }

      if (validation.warnings.length > 0) {
        window.app.showToast('Notice', validation.warnings[0], 'warning');
      }

      try {
        const saved = DocumentRepo.save(this.doc);
        window.app.showToast('Success', `${saved.type.toUpperCase()} ${saved.number} saved.`, 'success');
        if (goToPreview) {
          window.location.hash = `#/documents/${saved.id}/preview`;
        } else {
          window.location.hash = '#/documents';
        }
      } catch (err) {
        window.app.showToast('Save Error', err.message, 'error');
      }
    };

    this.container.querySelector('#btn-save-draft')?.addEventListener('click', () => handleSave(false));
    this.container.querySelector('#btn-save-preview')?.addEventListener('click', () => handleSave(true));
    this.container.querySelector('#btn-save-draft-side')?.addEventListener('click', () => handleSave(false));
    this.container.querySelector('#btn-save-preview-side')?.addEventListener('click', () => handleSave(true));
  },

  updateSidebarSummary() {
    const settings = SettingsRepo.get();
    const calc = calculateDocument(this.doc, settings);
    const docCurrency = this.doc.currency || 'USD';

    // Update grand total & summary fields in sidebar
    const grandTotalEl = this.container.querySelector('.grand-total-row span:last-child');
    if (grandTotalEl) {
      grandTotalEl.textContent = formatCurrency(calc.grandTotal, docCurrency);
    }
  }
};
