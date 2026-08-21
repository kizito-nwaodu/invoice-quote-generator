/**
 * Customer CRM View Controller
 */

import { CustomerRepo, SettingsRepo } from '../storage/repository.js';
import { formatCurrency, formatDate } from '../engine/formatter.js';
import { getIcon } from '../../assets/icons.js';

export const CustomersView = {
  searchQuery: '',

  render(container) {
    this.container = container;
    const settings = SettingsRepo.get();
    const currency = settings.currency || 'USD';
    const allCustomers = CustomerRepo.getAll();

    let filtered = allCustomers.filter(c => {
      if (!this.searchQuery.trim()) return true;
      const q = this.searchQuery.toLowerCase().trim();
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q)
      );
    });

    container.innerHTML = `
      <div class="view-container">
        <!-- Header & Action -->
        <div class="toolbar">
          <div>
            <h1 style="font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Customers</h1>
            <p style="color: var(--text-secondary); font-size: 13.5px; margin-top: 2px;">
              Manage your client relationships, billing addresses, and payment balances.
            </p>
          </div>
          <button id="btn-add-customer" class="btn btn-primary">
            ${getIcon('plus')} New Customer
          </button>
        </div>

        <!-- Search Bar -->
        <div class="card" style="margin-bottom: 20px; padding: 14px 20px;">
          <div class="search-input-wrapper" style="max-width: 400px;">
            <span class="search-icon">${getIcon('search')}</span>
            <input type="text" id="customer-search-input" class="form-control" placeholder="Search customer name, company, email..." value="${this.searchQuery}">
          </div>
        </div>

        <!-- Customers Table Card -->
        <div class="card" style="padding: 0; overflow: hidden;">
          ${filtered.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon-box">${getIcon('users')}</div>
              <div class="empty-title">No customers found</div>
              <div class="empty-description">Add a customer to easily auto-fill quotes and invoices.</div>
              <button id="btn-empty-add-customer" class="btn btn-primary btn-sm">${getIcon('plus')} Add Customer</button>
            </div>
          ` : `
            <div class="table-responsive" style="border: none;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Customer / Business</th>
                    <th>Contact</th>
                    <th>Address</th>
                    <th style="text-align: right;">Total Invoiced</th>
                    <th style="text-align: right;">Total Paid</th>
                    <th style="text-align: right;">Balance Due</th>
                    <th style="text-align: right; width: 140px;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.map(cust => {
                    const stats = CustomerRepo.getStats(cust.id);
                    return `
                      <tr>
                        <td>
                          <strong>${cust.name}</strong>
                          ${cust.company ? `<div style="font-size: 12px; color: var(--text-secondary);">${cust.company}</div>` : ''}
                          ${cust.taxNumber ? `<div style="font-size: 11px; color: var(--text-muted);">Tax: ${cust.taxNumber}</div>` : ''}
                        </td>
                        <td>
                          ${cust.email ? `<div><a href="mailto:${cust.email}" style="color: var(--primary); text-decoration: none;">${cust.email}</a></div>` : ''}
                          ${cust.phone ? `<div style="font-size: 12px; color: var(--text-muted);">${cust.phone}</div>` : ''}
                        </td>
                        <td style="font-size: 12.5px; color: var(--text-secondary); max-width: 200px;">
                          ${cust.address ? cust.address.replace(/\n/g, ', ') : '—'}
                        </td>
                        <td style="text-align: right; font-weight: 700;">
                          ${formatCurrency(stats.totalInvoiced, currency)}
                          <div style="font-size: 11px; color: var(--text-muted);">${stats.invoicesCount} invoices</div>
                        </td>
                        <td style="text-align: right; font-weight: 700; color: #16a34a;">
                          ${formatCurrency(stats.totalPaid, currency)}
                        </td>
                        <td style="text-align: right; font-weight: 800; color: ${stats.outstandingBalance > 0 ? '#dc2626' : 'var(--text-secondary)'};">
                          ${stats.outstandingBalance > 0 ? formatCurrency(stats.outstandingBalance, currency) : '<span style="color: #16a34a;">$0.00</span>'}
                        </td>
                        <td style="text-align: right;">
                          <div style="display: inline-flex; gap: 4px;">
                            <button class="btn btn-subtle btn-sm btn-icon-only btn-view-cust-history" data-id="${cust.id}" title="View History & Documents">
                              ${getIcon('eye')}
                            </button>
                            <button class="btn btn-subtle btn-sm btn-icon-only btn-edit-customer" data-id="${cust.id}" title="Edit Customer">
                              ${getIcon('edit')}
                            </button>
                            <button class="btn btn-subtle btn-sm btn-icon-only btn-delete-customer" data-id="${cust.id}" title="Delete Customer" style="color: #ef4444;">
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
    const searchInput = this.container.querySelector('#customer-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render(this.container);
      });
    }

    const openAddModal = () => {
      window.app.showCustomerModal(null, () => {
        this.render(this.container);
      });
    };

    this.container.querySelector('#btn-add-customer')?.addEventListener('click', openAddModal);
    this.container.querySelector('#btn-empty-add-customer')?.addEventListener('click', openAddModal);

    // Edit customer
    this.container.querySelectorAll('.btn-edit-customer').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        window.app.showCustomerModal(id, () => {
          this.render(this.container);
        });
      });
    });

    // View history
    this.container.querySelectorAll('.btn-view-cust-history').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        window.app.showCustomerHistoryModal(id);
      });
    });

    // Delete customer
    this.container.querySelectorAll('.btn-delete-customer').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const cust = CustomerRepo.getById(id);
        const stats = CustomerRepo.getStats(id);

        if (stats.documentsCount > 0) {
          if (!confirm(`Notice: ${cust.name} is referenced by ${stats.documentsCount} documents. Deleting this customer will not delete the historical documents, but will remove the client profile. Proceed?`)) {
            return;
          }
        } else {
          if (!confirm(`Are you sure you want to delete ${cust.name}?`)) {
            return;
          }
        }

        CustomerRepo.delete(id);
        window.app.showToast('Customer Removed', `Deleted ${cust.name}`, 'info');
        this.render(this.container);
      });
    });
  }
};
