/**
 * Calculation Engine Automated Test Runner View
 */

import { runAllTests } from '../tests/calculation.test.js';
import { getIcon } from '../../assets/icons.js';

export const TestsView = {
  render(container) {
    this.container = container;
    const testSuite = runAllTests();

    container.innerHTML = `
      <div class="view-container">
        <!-- Header -->
        <div class="toolbar">
          <div>
            <h1 style="font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Calculation Engine Verification</h1>
            <p style="color: var(--text-secondary); font-size: 13.5px; margin-top: 2px;">
              Automated unit tests validating zero floating-point drift, tax inclusivity, discounts, and payments.
            </p>
          </div>
          <button id="btn-re-run-tests" class="btn btn-primary">
            ${getIcon('refreshCw')} Re-run Test Suite
          </button>
        </div>

        <!-- Summary Banner -->
        <div class="card" style="margin-bottom: 20px; border-left: 6px solid ${testSuite.allPassed ? '#22c55e' : '#ef4444'};">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 48px; height: 48px; border-radius: var(--radius-lg); background: ${testSuite.allPassed ? '#dcfce7' : '#fee2e2'}; color: ${testSuite.allPassed ? '#15803d' : '#b91c1c'}; display: flex; align-items: center; justify-content: center;">
                ${testSuite.allPassed ? getIcon('shieldCheck') : getIcon('alertCircle')}
              </div>
              <div>
                <h2 style="font-size: 18px; font-weight: 800;">
                  ${testSuite.allPassed ? 'All 16+ Calculation Test Cases Passed (100% Deterministic)' : `${testSuite.failed} Tests Failed`}
                </h2>
                <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
                  Verified: Decimal prices, mixed tax rates, tax-inclusive models, partial payment reconciliation, sequential numbers, and large totals.
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 12px;">
              <div style="padding: 8px 16px; border-radius: var(--radius-md); background: #dcfce7; color: #15803d; font-weight: 700; font-size: 13px;">
                ${testSuite.passed} Passed
              </div>
              ${testSuite.failed > 0 ? `
                <div style="padding: 8px 16px; border-radius: var(--radius-md); background: #fee2e2; color: #b91c1c; font-weight: 700; font-size: 13px;">
                  ${testSuite.failed} Failed
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Tests List Table -->
        <div class="card" style="padding: 0; overflow: hidden;">
          <div class="table-responsive" style="border: none;">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 50px;">Status</th>
                  <th>Test Case & Verification Scope</th>
                  <th>Description / Assertion</th>
                  <th style="text-align: right;">Expected Value</th>
                  <th style="text-align: right;">Actual Value</th>
                </tr>
              </thead>
              <tbody>
                ${testSuite.results.map(r => `
                  <tr style="background: ${r.passed ? 'transparent' : '#fff5f5'};">
                    <td>
                      <span class="badge ${r.passed ? 'badge-paid' : 'badge-overdue'}" style="padding: 4px 8px;">
                        ${r.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                    <td style="font-weight: 700;">
                      ${r.testName}
                    </td>
                    <td style="font-size: 12.5px; color: var(--text-secondary);">
                      ${r.description}
                      ${r.error ? `<div style="color: #b91c1c; font-weight: 600; margin-top: 4px;">${r.error}</div>` : ''}
                    </td>
                    <td style="text-align: right; font-family: var(--font-mono); font-size: 12.5px;">
                      ${JSON.stringify(r.expected)}
                    </td>
                    <td style="text-align: right; font-family: var(--font-mono); font-size: 12.5px; font-weight: 700; color: ${r.passed ? '#15803d' : '#b91c1c'};">
                      ${JSON.stringify(r.actual)}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-re-run-tests')?.addEventListener('click', () => {
      this.render(this.container);
      window.app.showToast('Test Suite Executed', 'Calculation verification tests completed successfully.', 'success');
    });
  }
};
