/**
 * Central Documents Management View (Invoices & Quotes)
 */

import { DocumentRepo, CustomerRepo, SettingsRepo } from '../storage/repository.js';
import { formatCurrency, formatDate } from '../engine/formatter.js';
import { getIcon } from '../../assets/icons.js';
import { calculateDocument } from '../engine/calculation.js';

export const DocumentsView = {
  state: {
    typeFilter: 'all', // 'all' | 'invoice' | 'quote'
    statusFilter: 'all',
    customerFilter: 'all',
    searchQuery: '',
    sortBy: 'date-desc'
  },

  render(container) {
    this.container = container;
    const settings = SettingsRepo.get();
    const customers = CustomerRepo.getAll();
    const allDocs = DocumentRepo.getAll();

    // Apply filtering
    let filtered = allDocs.filter(doc => {
      // 1. Type Filter
      if (this.state.typeFilter !== 'all' && doc.type !== this.state.typeFilter) {
        return false;
      }

      // 2. Status Filter
      if (this.state.statusFilter !== 'all' && (doc.status || 'Draft').toLowerCase() !== this.state.statusFilter.toLowerCase()) {
        return false;
      }

      // 3. Customer Filter
      if (this.state.customerFilter !== 'all' && doc.customer?.id !== this.state.customerFilter && doc.customer?.name !== this.state.customerFilter) {
        return false;
      }

      // 4. Search Query
      if (this.state.searchQuery.trim()) {
        const q = this.state.searchQuery.toLowerCase().trim();
        const numMatch = (doc.number || '').toLowerCase().includes(q);
        const custNameMatch = (doc.customer?.name || '').toLowerCase().includes(q);
        const custEmailMatch = (doc.customer?.email || '').toLowerCase().includes(q);
        const custCompanyMatch = (doc.customer?.company || '').toLowerCase().includes(q);
        const notesMatch = (doc.notes || '').toLowerCase().includes(q);
        const itemMatch = (doc.items || []).some(item => (item.description || '').toLowerCase().includes(q));

        if (!numMatch && !custNameMatch && !custEmailMatch && !custCompanyMatch && !notesMatch && !itemMatch) {
          return false;
        }
      }

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      if (this.state.sortBy === 'date-desc') {
        return new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime();
      }
      if (this.state.sortBy === 'date-asc') {
        return new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime();
      }
      if (this.state.sortBy === 'number-asc') {
        return (a.number || '').localeCompare(b.number || '', undefined, { numeric: true });
      }
      if (this.state.sortBy === 'number-desc') {
        return (b.number || '').localeCompare(a.number || '', undefined, { numeric: true });
      }
      return 0;
    });

    container.innerHTML = `
      <div class="view-container">
        <!-- Header -->
        <div class="toolbar">
          <div>
            <h1 style="font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Documents</h1>
            <p style="color: var(--text-secondary); font-size: 13.5px; margin-top: 2px;">
              Manage, track, and export your invoices and quotes.
            </p>
          </div>
          <div class="filter-group">
            <a href="#/invoices/new" class="btn btn-primary">
              ${getIcon('plus')} New Invoice
            </a>
            <a href="#/quotes/new" class="btn btn-secondary">
              ${getIcon('plus')} New Quote
            </a>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="card" style="margin-bottom: 20px; padding: 16px 20px;">
          <div class="toolbar" style="margin-bottom: 0;">
            <!-- Search -->
            <div class="search-input-wrapper">
              <span class="search-icon">${getIcon('search')}</span>
              <input type="text" id="doc-search-input" class="form-control" placeholder="Search number, client, line item..." value="${this.state.searchQuery}">
            </div>

            <!-- Segmented Type Selector -->
            <div class="segmented-control">
              <button class="segment-btn ${this.state.typeFilter === 'all' ? 'active' : ''}" data-type="all">All</button>
              <button class="segment-btn ${this.state.typeFilter === 'invoice' ? 'active' : ''}" data-type="invoice">Invoices</button>
              <button class="segment-btn ${this.state.typeFilter === 'quote' ? 'active' : ''}" data-type="quote">Quotes</button>
            </div>

            <!-- Status Dropdown -->
            <select id="doc-status-filter" class="form-control" style="width: auto; min-width: 140px;">
              <option value="all" ${this.state.statusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="Draft" ${this.state.statusFilter === 'Draft' ? 'selected' : ''}>Draft</option>
              <option value="Sent" ${this.state.statusFilter === 'Sent' ? 'selected' : ''}>Sent</option>
              <option value="Partially Paid" ${this.state.statusFilter === 'Partially Paid' ? 'selected' : ''}>Partially Paid</option>
              <option value="Paid" ${this.state.statusFilter === 'Paid' ? 'selected' : ''}>Paid</option>
              <option value="Overdue" ${this.state.statusFilter === 'Overdue' ? 'selected' : ''}>Overdue</option>
              <option value="Accepted" ${this.state.statusFilter === 'Accepted' ? 'selected' : ''}>Accepted</option>
              <option value="Converted" ${this.state.statusFilter === 'Converted' ? 'selected' : ''}>Converted</option>
              <option value="Declined" ${this.state.statusFilter === 'Declined' ? 'selected' : ''}>Declined</option>
              <option value="Cancelled" ${this.state.statusFilter === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>

            <!-- Customer Filter -->
            <select id="doc-customer-filter" class="form-control" style="width: auto; min-width: 160px;">
              <option value="all" ${this.state.customerFilter === 'all' ? 'selected' : ''}>All Customers</option>
              ${customers.map(c => `
                <option value="${c.id}" ${this.state.customerFilter === c.id ? 'selected' : ''}>${c.name}</option>
              `).join('')}
            </select>

            <!-- Sort -->
            <select id="doc-sort-by" class="form-control" style="width: auto; min-width: 150px;">
              <option value="date-desc" ${this.state.sortBy === 'date-desc' ? 'selected' : ''}>Date (Newest)</option>
              <option value="date-asc" ${this.state.sortBy === 'date-asc' ? 'selected' : ''}>Date (Oldest)</option>
              <option value="number-desc" ${this.state.sortBy === 'number-desc' ? 'selected' : ''}>Number (High-Low)</option>
              <option value="number-asc" ${this.state.sortBy === 'number-asc' ? 'selected' : ''}>Number (Low-High)</option>
            </select>
          </div>
        </div>

        <!-- Documents Table -->
        <div class="card" style="padding: 0; overflow: hidden;">
          ${filtered.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon-box">${getIcon('fileText')}</div>
              <div class="empty-title">No documents match your filters</div>
              <div class="empty-description">Try adjusting your search query, status, or customer filters.</div>
              <button id="btn-reset-filters" class="btn btn-subtle btn-sm">${getIcon('refreshCw')} Reset Filters</button>
            </div>
          ` : `
            <div class="table-responsive" style="border: none;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Document Number</th>
                    <th>Customer</th>
                    <th>Issue Date</th>
                    <th>Due / Expiry</th>
                    <th>Status</th>
                    <th style="text-align: right;">Total Amount</th>
                    <th style="text-align: right;">Balance Due</th>
                    <th style="text-align: right; width: 140px;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.map(doc => {
                    const calc = calculateDocument(doc, settings);
                    const isInvoice = doc.type === 'invoice';
                    const statusClass = `badge-${(doc.status || 'draft').toLowerCase().replace(/\s+/g, '-')}`;
                    const docCurrency = doc.currency || settings.currency || 'USD';

                    return `
                      <tr>
                        <td>
                          <span style="font-weight: 700; font-size: 11px; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; background: ${isInvoice ? '#e0f2fe' : '#fef3c7'}; color: ${isInvoice ? '#0369a1' : '#b45309'};">
                            ${doc.type}
                          </span>
                        </td>
                        <td>
                          <a href="#/documents/${doc.id}/preview" style="font-weight: 700; color: var(--primary); text-decoration: none; display: flex; align-items: center; gap: 6px;">
                            ${doc.number}
                          </a>
                          ${doc.sourceQuoteNumber ? `
                            <div style="font-size: 11px; color: var(--text-muted);">From Quote ${doc.sourceQuoteNumber}</div>
                          ` : ''}
                          ${doc.convertedToInvoiceNumber ? `
                            <div style="font-size: 11px; color: #7c3aed; font-weight: 600;">Converted to ${doc.convertedToInvoiceNumber}</div>
                          ` : ''}
                        </td>
                        <td>
                          <strong>${doc.customer?.name || 'Unknown'}</strong>
                          ${doc.customer?.company ? `<div style="font-size: 12px; color: var(--text-muted);">${doc.customer.company}</div>` : ''}
                        </td>
                        <td>${formatDate(doc.date)}</td>
                        <td>
                          ${isInvoice ? (doc.dueDate ? formatDate(doc.dueDate) : '—') : (doc.expirationDate ? formatDate(doc.expirationDate) : '—')}
                        </td>
                        <td><span class="badge ${statusClass}">${doc.status}</span></td>
                        <td style="text-align: right; font-weight: 800;">
                          ${formatCurrency(calc.grandTotal, docCurrency)}
                        </td>
                        <td style="text-align: right; font-weight: 700; color: ${isInvoice && calc.amountDue > 0 ? '#dc2626' : 'var(--text-secondary)'};">
                          ${isInvoice ? (calc.amountDue > 0 ? formatCurrency(calc.amountDue, docCurrency) : '<span style="color: #16a34a;">Paid in Full</span>') : '—'}
                        </td>
                        <td style="text-align: right;">
                          <div style="display: inline-flex; gap: 4px;">
                            <a href="#/documents/${doc.id}/preview" class="btn btn-subtle btn-sm btn-icon-only" title="Preview / PDF">
                              ${getIcon('eye')}
                            </a>
                            <a href="#/documents/${doc.id}/edit" class="btn btn-subtle btn-sm btn-icon-only" title="Edit">
                              ${getIcon('edit')}
                            </a>
                            ${!isInvoice && doc.status !== 'Converted' ? `
                              <button class="btn btn-subtle btn-sm btn-icon-only btn-convert-quote" data-id="${doc.id}" title="Convert to Invoice" style="color: #7c3aed;">
                                ${getIcon('repeat')}
                              </button>
                            ` : ''}
                            ${isInvoice && calc.amountDue > 0 ? `
                              <button class="btn btn-subtle btn-sm btn-icon-only btn-record-payment" data-id="${doc.id}" title="Record Payment" style="color: #16a34a;">
                                ${getIcon('dollarSign')}
                              </button>
                            ` : ''}
                            <button class="btn btn-subtle btn-sm btn-icon-only btn-duplicate-doc" data-id="${doc.id}" title="Duplicate">
                              ${getIcon('copy')}
                            </button>
                            <button class="btn btn-subtle btn-sm btn-icon-only btn-delete-doc" data-id="${doc.id}" title="Delete" style="color: #ef4444;">
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
          `}
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    // Search input
    const searchInput = this.container.querySelector('#doc-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value;
        this.render(this.container);
      });
    }

    // Segmented Type
    this.container.querySelectorAll('.segment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.typeFilter = btn.dataset.type;
        this.render(this.container);
      });
    });

    // Status Filter
    const statusFilter = this.container.querySelector('#doc-status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.state.statusFilter = e.target.value;
        this.render(this.container);
      });
    }

    // Customer Filter
    const customerFilter = this.container.querySelector('#doc-customer-filter');
    if (customerFilter) {
      customerFilter.addEventListener('change', (e) => {
        this.state.customerFilter = e.target.value;
        this.render(this.container);
      });
    }

    // Sort Filter
    const sortBy = this.container.querySelector('#doc-sort-by');
    if (sortBy) {
      sortBy.addEventListener('change', (e) => {
        this.state.sortBy = e.target.value;
        this.render(this.container);
      });
    }

    // Reset Filters
    const btnReset = this.container.querySelector('#btn-reset-filters');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.state = {
          typeFilter: 'all',
          statusFilter: 'all',
          customerFilter: 'all',
          searchQuery: '',
          sortBy: 'date-desc'
        };
        this.render(this.container);
      });
    }

    // Convert Quote
    this.container.querySelectorAll('.btn-convert-quote').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        try {
          const newInvoice = DocumentRepo.convertQuoteToInvoice(id);
          window.app.showToast('Quote Converted', `Successfully converted to Invoice ${newInvoice.number}`, 'success');
          window.location.hash = `#/documents/${newInvoice.id}/preview`;
        } catch (err) {
          window.app.showToast('Conversion Error', err.message, 'error');
        }
      });
    });

    // Record Payment
    this.container.querySelectorAll('.btn-record-payment').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        window.app.showPaymentModal(id, () => {
          this.render(this.container);
        });
      });
    });

    // Duplicate
    this.container.querySelectorAll('.btn-duplicate-doc').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const duplicated = DocumentRepo.duplicate(id);
        if (duplicated) {
          window.app.showToast('Document Duplicated', `Created draft copy ${duplicated.number}`, 'success');
          window.location.hash = `#/documents/${duplicated.id}/edit`;
        }
      });
    });

    // Delete
    this.container.querySelectorAll('.btn-delete-doc').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const doc = DocumentRepo.getById(id);
        if (confirm(`Are you sure you want to permanently delete ${doc.type.toUpperCase()} ${doc.number}?`)) {
          DocumentRepo.delete(id);
          window.app.showToast('Document Deleted', `Deleted ${doc.number}`, 'info');
          this.render(this.container);
        }
      });
    });
  }
};
