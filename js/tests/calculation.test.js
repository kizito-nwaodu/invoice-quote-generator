/**
 * Automated Financial Calculation & Integrity Unit Test Suite
 * 
 * Verifies that all monetary arithmetic, discounts, tax inclusivity/exclusivity,
 * partial payments, edge cases, and conversions produce 100% exact, deterministic results.
 */

import { calculateLineItem, calculateDocument, roundToCents, toCents, fromCents } from '../engine/calculation.js';
import { formatDocNumber } from '../engine/formatter.js';

export function runAllTests() {
  const results = [];

  function assert(testName, actual, expected, description = '') {
    const passed = JSON.stringify(actual) === JSON.stringify(expected);
    results.push({
      testName,
      passed,
      actual,
      expected,
      description,
      error: passed ? null : `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    });
  }

  // 1. Simple Quantity × Price
  {
    const line = calculateLineItem({ quantity: 5, unitPrice: 20 });
    assert('1. Simple Quantity × Price', line.grossAmount, 100.00, '5 × $20 = $100.00');
    assert('1b. Line Total (Zero Tax)', line.lineTotal, 100.00, 'Line total equals gross when 0 tax');
  }

  // 2. Decimal Prices (Avoiding floating-point drift: 3 × $19.99 = $59.97)
  {
    const line = calculateLineItem({ quantity: 3, unitPrice: 19.99 });
    assert('2. Decimal Price Exactness', line.grossAmount, 59.97, '3 × $19.99 must strictly equal $59.97 (not 59.970000000000006)');
  }

  // 3. Decimal Quantities (e.g. 2.75 hrs @ $125.50/hr = $345.13)
  {
    const line = calculateLineItem({ quantity: 2.75, unitPrice: 125.50 });
    assert('3. Decimal Quantity Calculation', line.grossAmount, 345.13, '2.75 × $125.50 = $345.125 rounded to $345.13');
  }

  // 4. Line Percentage Discount
  {
    const line = calculateLineItem({
      quantity: 2,
      unitPrice: 500.00,
      discountType: 'percent',
      discountValue: 10
    });
    assert('4a. Line Percentage Discount Amount', line.discountAmount, 100.00, '10% of $1,000.00 = $100.00');
    assert('4b. Line Net after Discount', line.netAmount, 900.00, '$1,000.00 - $100.00 = $900.00');
  }

  // 5. Line Fixed Discount and Clamping
  {
    const line = calculateLineItem({
      quantity: 1,
      unitPrice: 250.00,
      discountType: 'fixed',
      discountValue: 75.50
    });
    assert('5a. Line Fixed Discount Amount', line.discountAmount, 75.50, 'Fixed discount of $75.50');
    assert('5b. Line Net with Fixed Discount', line.netAmount, 174.50, '$250.00 - $75.50 = $174.50');

    // Clamping test: discount exceeds gross
    const clampedLine = calculateLineItem({
      quantity: 1,
      unitPrice: 50.00,
      discountType: 'fixed',
      discountValue: 100.00
    });
    assert('5c. Fixed Discount Safe Clamping', clampedLine.discountAmount, 50.00, 'Discount cannot exceed gross amount');
    assert('5d. Net Amount Clamped to Zero', clampedLine.netAmount, 0.00, 'Net amount is clamped to $0');
  }

  // 6. Tax Calculation (Tax-Exclusive Mode)
  {
    const line = calculateLineItem({
      quantity: 2,
      unitPrice: 100.00,
      taxRate: 15
    }, 'exclusive');
    assert('6a. Tax-Exclusive Tax Amount', line.taxAmount, 30.00, '15% on $200.00 = $30.00');
    assert('6b. Tax-Exclusive Line Total', line.lineTotal, 230.00, '$200.00 + $30.00 = $230.00');
  }

  // 7. Tax-Inclusive Pricing Mode
  {
    // If net is $115.00 inclusive of 15% tax: Base = 115 / 1.15 = 100.00, Tax = 15.00
    const line = calculateLineItem({
      quantity: 1,
      unitPrice: 115.00,
      taxRate: 15
    }, 'inclusive');
    assert('7a. Tax-Inclusive Taxable Base', line.taxableAmount, 100.00, '$115.00 incl 15% VAT base = $100.00');
    assert('7b. Tax-Inclusive Tax Extract', line.taxAmount, 15.00, 'Tax extracted = $15.00');
    assert('7c. Tax-Inclusive Total', line.lineTotal, 115.00, 'Line total remains $115.00');
  }

  // 8. Multiple Line Items with Mixed Tax Rates & Discounts (Document Level)
  {
    const doc = {
      taxMode: 'exclusive',
      items: [
        {
          quantity: 2,
          unitPrice: 500.00, // Gross 1000
          discountType: 'percent',
          discountValue: 10, // Disc 100 -> Net 900
          taxRate: 10 // Tax 90
        },
        {
          quantity: 1,
          unitPrice: 200.00, // Gross 200
          discountType: 'fixed',
          discountValue: 50, // Disc 50 -> Net 150
          taxRate: 20 // Tax 30
        }
      ],
      docDiscountType: 'percent',
      docDiscountValue: 0,
      shippingFee: 25.00,
      additionalCharges: 10.00
    };

    const calc = calculateDocument(doc);
    assert('8a. Gross Subtotal', calc.grossSubtotal, 1200.00, '1000 + 200 = $1200.00');
    assert('8b. Line Discounts Total', calc.lineDiscountsTotal, 150.00, '100 + 50 = $150.00');
    assert('8c. Net Subtotal', calc.netSubtotal, 1050.00, '900 + 150 = $1050.00');
    assert('8d. Total Tax Sum', calc.totalTax, 120.00, '90 (10%) + 30 (20%) = $120.00');
    assert('8e. Grand Total with Shipping & Fees', calc.grandTotal, 1205.00, '1050 + 120 + 25 + 10 = $1205.00');
  }

  // 9. Document-Level Discount Calculation
  {
    const doc = {
      taxMode: 'exclusive',
      items: [
        { quantity: 1, unitPrice: 1000.00, taxRate: 10 }
      ],
      docDiscountType: 'percent',
      docDiscountValue: 10 // 10% off $1000 = $100 -> Post-discount base = $900 -> Tax 10% on 900 = $90
    };

    const calc = calculateDocument(doc);
    assert('9a. Document Discount Amount', calc.docDiscountAmount, 100.00, '10% doc discount on $1000 = $100.00');
    assert('9b. Post-Discount Subtotal', calc.postDocDiscountSubtotal, 900.00, '$1000 - $100 = $900.00');
    assert('9c. Adjusted Tax on Post-Discount Base', calc.totalTax, 90.00, '10% tax on $900 base = $90.00');
    assert('9d. Grand Total after Doc Discount', calc.grandTotal, 990.00, '$900 + $90 = $990.00');
  }

  // 10. Partial Payment & Status Transition
  {
    const doc = {
      type: 'invoice',
      status: 'Sent',
      taxMode: 'exclusive',
      items: [{ quantity: 1, unitPrice: 1000.00, taxRate: 0 }],
      payments: [
        { amount: 400.00 }
      ]
    };

    const calc = calculateDocument(doc);
    assert('10a. Amount Paid Calculation', calc.amountPaid, 400.00, 'Sum of payments = $400.00');
    assert('10b. Amount Due Calculation', calc.amountDue, 600.00, '$1000 - $400 = $600.00');
    assert('10c. Auto Status: Partially Paid', calc.computedStatus, 'Partially Paid', 'Invoice status is Partially Paid');
  }

  // 11. Full Payment & Status Transition
  {
    const doc = {
      type: 'invoice',
      status: 'Sent',
      taxMode: 'exclusive',
      items: [{ quantity: 1, unitPrice: 1000.00, taxRate: 0 }],
      payments: [
        { amount: 600.00 },
        { amount: 400.00 }
      ]
    };

    const calc = calculateDocument(doc);
    assert('11a. Full Amount Paid', calc.amountPaid, 1000.00, 'Sum of payments = $1000.00');
    assert('11b. Full Amount Due', calc.amountDue, 0.00, 'Balance is $0.00');
    assert('11c. Auto Status: Paid', calc.computedStatus, 'Paid', 'Invoice status is Paid');
  }

  // 12. Large Totals Precision ($10,000,000.00+)
  {
    const line = calculateLineItem({ quantity: 50000, unitPrice: 250.75, taxRate: 10 });
    assert('12a. Large Number Gross', line.grossAmount, 12537500.00, '50000 × $250.75 = $12,537,500.00');
    assert('12b. Large Number Tax', line.taxAmount, 1253750.00, '10% on $12,537,500.00 = $1,253,750.00');
    assert('12c. Large Number Total', line.lineTotal, 13791250.00, 'Total = $13,791,250.00');
  }

  // 13. Sequential Document Number Generation
  {
    const invNum1 = formatDocNumber('INV-', 1);
    const invNum42 = formatDocNumber('INV-', 42);
    const customPrefix = formatDocNumber('BILL-2026-', 5, 4);

    assert('13a. Standard Invoice Number', invNum1, 'INV-00001', 'Formatted to INV-00001');
    assert('13b. Two-Digit Number', invNum42, 'INV-00042', 'Formatted to INV-00042');
    assert('13c. Custom Prefix and Padding', customPrefix, 'BILL-2026-0005', 'Custom prefix BILL-2026-0005');
  }

  // 14. Zero Tax Calculation
  {
    const doc = {
      taxMode: 'exclusive',
      items: [
        { quantity: 4, unitPrice: 50.00, taxRate: 0 }
      ]
    };
    const calc = calculateDocument(doc);
    assert('14a. Zero Tax Subtotal', calc.netSubtotal, 200.00, 'Subtotal is $200.00');
    assert('14b. Zero Tax Total Tax', calc.totalTax, 0.00, 'Tax is $0.00');
    assert('14c. Zero Tax Grand Total', calc.grandTotal, 200.00, 'Grand total equals subtotal');
  }

  // 15. Invalid Input Sanitization & Clamping
  {
    const line = calculateLineItem({
      quantity: -5,
      unitPrice: 'invalid',
      discountValue: -20,
      taxRate: 'not-a-number'
    });
    assert('15a. Negative Qty Clamped to Zero', line.quantity, 0, 'Negative quantity is clamped to 0');
    assert('15b. Invalid Price Sanitized to Zero', line.unitPrice, 0, 'Invalid price defaults to 0');
    assert('15c. Invalid Tax Sanitized to Zero', line.taxRate, 0, 'Invalid tax defaults to 0');
    assert('15d. Safe Zero Line Total', line.lineTotal, 0, 'Line total safely evaluates to 0 without NaN');
  }

  // 16. Cents Converter Precision
  {
    assert('16a. To Cents Conversion', toCents(19.99), 1999, '$19.99 converts to 1999 integer cents');
    assert('16b. From Cents Conversion', fromCents(1999), 19.99, '1999 cents converts back to $19.99');
    assert('16c. Epsilon Rounding on Half Cents', roundToCents(10.005), 10.01, '$10.005 rounds deterministically to $10.01');
  }

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    allPassed: failedCount === 0,
    results
  };
}
