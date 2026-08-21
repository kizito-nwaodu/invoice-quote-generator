/**
 * Dashboard View Controller
 */

import { DocumentRepo, CustomerRepo, SettingsRepo } from '../storage/repository.js';
import { formatCurrency, formatDate } from '../engine/formatter.js';
import { getIcon } from '../../assets/icons.js';
import { calculateDocument } from '../engine/calculation.js';

export const DashboardView = {
  render(container) {
    const metrics = DocumentRepo.getDashboardMetrics();
    const settings = SettingsRepo.get();
    const currency = settings.currency || 'USD';

    container.innerHTML = `
      <div class="view-container">
        <!-- Top Title & Quick Actions -->
        <div class="toolbar" style="margin-bottom: 24px;">
          <div>
            <h1 style="font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Business Overview</h1>
            <p style="color: var(--text-secondary); font-size: 13.5px; margin-top: 2px;">
              Financial performance, real-time balances, and document activity.
            </p>
          </div>
          <div class="filter-group">
            <a href="#/invoices/new" class="btn btn-primary">
              ${getIcon('plus')} New Invoice
            </a>
            <a href="#/quotes/new" class="btn btn-secondary">
              ${getIcon('fileText')} New Quote
            </a>
            <button id="btn-quick-new-customer" class="btn btn-subtle">
              ${getIcon('users')} New Customer
            </button>
          </div>
        </div>

        <!-- Metrics Cards Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-title">Total Invoiced</span>
              <div class="stat-icon-wrapper" style="background: #e0f2fe; color: #0284c7;">
                ${getIcon('dollarSign')}
              </div>
            </div>
            <div class="stat-value">${formatCurrency(metrics.totalInvoiced, currency)}</div>
            <div class="stat-subtext">${metrics.invoicesCount} total invoices issued</div>
          </div>

          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-title">Total Received</span>
              <div class="stat-icon-wrapper" style="background: #dcfce7; color: #16a34a;">
                ${getIcon('checkCircle')}
              </div>
            </div>
            <div class="stat-value" style="color: #16a34a;">${formatCurrency(metrics.totalPaid, currency)}</div>
            <div class="stat-subtext">Collected revenue in bank</div>
          </div>

          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-title">Outstanding Balance</span>
              <div class="stat-icon-wrapper" style="background: #fee2e2; color: #dc2626;">
                ${getIcon('clock')}
              </div>
            </div>
            <div class="stat-value" style="color: ${metrics.totalOutstanding > 0 ? '#dc2626' : 'var(--text-primary)'};">
              ${formatCurrency(metrics.totalOutstanding, currency)}
            </div>
            <div class="stat-subtext">Awaiting customer payment</div>
          </div>

          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-title">Quotes Pipeline</span>
              <div class="stat-icon-wrapper" style="background: #ede9fe; color: #7c3aed;">
                ${getIcon('sparkles')}
              </div>
            </div>
            <div class="stat-value" style="color: #7c3aed;">${formatCurrency(metrics.totalQuotesValue, currency)}</div>
            <div class="stat-subtext">${metrics.quotesCount} active quotes</div>
          </div>
        </div>

        <!-- Recent Documents Table & Summary Section -->
        <div class="card" style="margin-top: 12px;">
          <div class="card-header">
            <div>
              <h2 class="card-title">${getIcon('fileText')} Recent Documents</h2>
              <div class="card-subtitle">Latest quotes and invoices created in your workspace</div>
            </div>
            <a href="#/documents" class="btn btn-subtle btn-sm">
              View All Documents ${getIcon('arrowRight')}
            </a>
          </div>

          ${metrics.recentDocuments.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon-box">${getIcon('fileText')}</div>
              <div class="empty-title">No documents created yet</div>
              <div class="empty-description">Create your first professional quote or invoice to see your revenue pipeline in real-time.</div>
              <div style="display: flex; gap: 10px;">
                <a href="#/invoices/new" class="btn btn-primary btn-sm">${getIcon('plus')} Create Invoice</a>
                <a href="#/quotes/new" class="btn btn-secondary btn-sm">${getIcon('plus')} Create Quote</a>
              </div>
            </div>
          ` : `
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Number</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style="text-align: right;">Total Amount</th>
                    <th style="text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${metrics.recentDocuments.map(doc => {
                    const calc = calculateDocument(doc, settings);
                    const isInvoice = doc.type === 'invoice';
                    const statusClass = `badge-${(doc.status || 'draft').toLowerCase().replace(/\s+/g, '-')}`;
                    const docCurrency = doc.currency || currency;

                    return `
                      <tr>
                        <td>
                          <span style="font-weight: 700; font-size: 11px; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; background: ${isInvoice ? '#e0f2fe' : '#fef3c7'}; color: ${isInvoice ? '#0369a1' : '#b45309'};">
                            ${doc.type}
                          </span>
                        </td>
                        <td>
                          <a href="#/documents/${doc.id}/preview" style="font-weight: 700; color: var(--primary); text-decoration: none;">
                            ${doc.number}
                          </a>
                        </td>
                        <td>
                          <strong>${doc.customer?.name || 'Unknown Customer'}</strong>
                          ${doc.customer?.company ? `<div style="font-size: 12px; color: var(--text-muted);">${doc.customer.company}</div>` : ''}
                        </td>
                        <td>${formatDate(doc.date)}</td>
                        <td><span class="badge ${statusClass}">${doc.status}</span></td>
                        <td style="text-align: right; font-weight: 800;">
                          ${formatCurrency(calc.grandTotal, docCurrency)}
                          ${isInvoice && calc.amountDue > 0 && calc.amountPaid > 0 ? `
                            <div style="font-size: 11.5px; color: #dc2626; font-weight: 600;">Due: ${formatCurrency(calc.amountDue, docCurrency)}</div>
                          ` : ''}
                        </td>
                        <td style="text-align: right;">
                          <div style="display: inline-flex; gap: 6px;">
                            <a href="#/documents/${doc.id}/preview" class="btn btn-subtle btn-sm btn-icon-only" title="Preview">
                              ${getIcon('eye')}
                            </a>
                            <a href="#/documents/${doc.id}/edit" class="btn btn-subtle btn-sm btn-icon-only" title="Edit">
                              ${getIcon('edit')}
                            </a>
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

    // Bind Quick New Customer Button
    const btnQuickCust = container.querySelector('#btn-quick-new-customer');
    if (btnQuickCust) {
      btnQuickCust.addEventListener('click', () => {
        window.app.showCustomerModal(null, () => {
          this.render(container);
        });
      });
    }
  }
};
