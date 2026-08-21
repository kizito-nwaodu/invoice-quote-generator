/**
 * Products & Services Catalog View Controller
 */

import { ProductRepo, SettingsRepo } from '../storage/repository.js';
import { formatCurrency } from '../engine/formatter.js';
import { getIcon } from '../../assets/icons.js';

export const ProductsView = {
  searchQuery: '',

  render(container) {
    this.container = container;
    const settings = SettingsRepo.get();
    const currency = settings.currency || 'USD';
    const allProducts = ProductRepo.getAll();

    let filtered = allProducts.filter(p => {
      if (!this.searchQuery.trim()) return true;
      const q = this.searchQuery.toLowerCase().trim();
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    });

    container.innerHTML = `
      <div class="view-container">
        <!-- Header & Action -->
        <div class="toolbar">
          <div>
            <h1 style="font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Products & Services</h1>
            <p style="color: var(--text-secondary); font-size: 13.5px; margin-top: 2px;">
              Maintain your catalog of reusable services, packages, hourly rates, and standard pricing.
            </p>
          </div>
          <button id="btn-add-product" class="btn btn-primary">
            ${getIcon('plus')} New Item
          </button>
        </div>

        <!-- Search Bar -->
        <div class="card" style="margin-bottom: 20px; padding: 14px 20px;">
          <div class="search-input-wrapper" style="max-width: 400px;">
            <span class="search-icon">${getIcon('search')}</span>
            <input type="text" id="product-search-input" class="form-control" placeholder="Search product name, SKU, description..." value="${this.searchQuery}">
          </div>
        </div>

        <!-- Products Table Card -->
        <div class="card" style="padding: 0; overflow: hidden;">
          ${filtered.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon-box">${getIcon('package')}</div>
              <div class="empty-title">No products or services found</div>
              <div class="empty-description">Add your standard services to quickly populate invoice line items in one click.</div>
              <button id="btn-empty-add-product" class="btn btn-primary btn-sm">${getIcon('plus')} Add Service / Product</button>
            </div>
          ` : `
            <div class="table-responsive" style="border: none;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Item & Description</th>
                    <th>SKU / Code</th>
                    <th>Unit</th>
                    <th style="text-align: right;">Default Price</th>
                    <th style="text-align: right;">Default Tax</th>
                    <th style="text-align: right; width: 110px;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.map(prod => `
                    <tr>
                      <td>
                        <strong>${prod.name}</strong>
                        ${prod.description ? `<div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 2px;">${prod.description}</div>` : ''}
                      </td>
                      <td>
                        <span style="font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary); background: var(--bg-surface-subtle); padding: 2px 6px; border-radius: 4px;">
                          ${prod.sku || '—'}
                        </span>
                      </td>
                      <td>${prod.unit || 'unit'}</td>
                      <td style="text-align: right; font-weight: 700;">
                        ${formatCurrency(prod.unitPrice, currency)}
                      </td>
                      <td style="text-align: right; color: var(--text-secondary);">
                        ${prod.taxRate !== undefined ? `${prod.taxRate}%` : '0%'}
                      </td>
                      <td style="text-align: right;">
                        <div style="display: inline-flex; gap: 4px;">
                          <button class="btn btn-subtle btn-sm btn-icon-only btn-edit-product" data-id="${prod.id}" title="Edit Product">
                            ${getIcon('edit')}
                          </button>
                          <button class="btn btn-subtle btn-sm btn-icon-only btn-delete-product" data-id="${prod.id}" title="Delete Product" style="color: #ef4444;">
                            ${getIcon('trash')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
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
    const searchInput = this.container.querySelector('#product-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render(this.container);
      });
    }

    const openAddModal = () => {
      window.app.showProductModal(null, () => {
        this.render(this.container);
      });
    };

    this.container.querySelector('#btn-add-product')?.addEventListener('click', openAddModal);
    this.container.querySelector('#btn-empty-add-product')?.addEventListener('click', openAddModal);

    // Edit Product
    this.container.querySelectorAll('.btn-edit-product').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        window.app.showProductModal(id, () => {
          this.render(this.container);
        });
      });
    });

    // Delete Product
    this.container.querySelectorAll('.btn-delete-product').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const prod = ProductRepo.getById(id);
        if (confirm(`Are you sure you want to delete "${prod.name}" from your catalog?`)) {
          ProductRepo.delete(id);
          window.app.showToast('Item Deleted', `Removed ${prod.name}`, 'info');
          this.render(this.container);
        }
      });
    });
  }
};
