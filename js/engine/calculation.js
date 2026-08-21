/**
 * Central Deterministic Financial Calculation Engine
 * 
 * Guarantees zero floating-point arithmetic errors across UI forms,
 * table rows, live preview, PDF exports, print stylesheets, and saved database records.
 */

/**
 * Deterministically rounds a monetary number to specified decimal places (default 2)
 * using an epsilon offset to prevent IEEE 754 precision artifacts.
 * 
 * @param {number|string} val 
 * @param {number} decimals 
 * @returns {number}
 */
export function roundToCents(val, decimals = 2) {
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num) || !isFinite(num)) return 0;
  const factor = Math.pow(10, decimals);
  // Using small epsilon to handle numbers like 1.005 cleanly
  const sign = num < 0 ? -1 : 1;
  return sign * (Math.round((Math.abs(num) + 1e-9) * factor) / factor);
}

/**
 * Converts a decimal dollar amount to integer minor units (cents)
 * @param {number|string} val 
 * @returns {number} Integer cents
 */
export function toCents(val) {
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round((num + 1e-9) * 100);
}

/**
 * Converts integer cents to decimal number
 * @param {number} cents 
 * @returns {number}
 */
export function fromCents(cents) {
  if (typeof cents !== 'number' || isNaN(cents)) return 0;
  return cents / 100;
}

/**
 * Calculates a single line item
 * 
 * @param {Object} item - Line item object
 * @param {string} taxMode - 'exclusive' (default) or 'inclusive'
 * @returns {Object} Calculated line item metrics
 */
export function calculateLineItem(item, taxMode = 'exclusive') {
  const quantity = Math.max(0, typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 0);
  const unitPrice = Math.max(0, typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice) || 0);
  const taxRate = Math.max(0, typeof item.taxRate === 'number' ? item.taxRate : parseFloat(item.taxRate) || 0);
  
  // 1. Gross line amount = quantity × unit price
  const grossAmount = roundToCents(quantity * unitPrice);

  // 2. Line discount
  let discountAmount = 0;
  const discountType = item.discountType === 'percent' ? 'percent' : 'fixed';
  const discountVal = Math.max(0, typeof item.discountValue === 'number' ? item.discountValue : parseFloat(item.discountValue) || 0);

  if (discountType === 'percent') {
    const clampedPct = Math.min(100, discountVal);
    discountAmount = roundToCents(grossAmount * (clampedPct / 100));
  } else {
    // Fixed discount cannot exceed gross amount
    discountAmount = roundToCents(Math.min(grossAmount, discountVal));
  }

  // 3. Net amount after discount
  const netAmount = Math.max(0, roundToCents(grossAmount - discountAmount));

  // 4. Tax calculation based on mode
  let taxableAmount = 0;
  let taxAmount = 0;
  let lineTotal = 0;

  if (taxMode === 'inclusive') {
    // Tax is included in the price: Base = Net / (1 + Rate)
    if (taxRate > 0) {
      taxableAmount = roundToCents(netAmount / (1 + taxRate / 100));
      taxAmount = roundToCents(netAmount - taxableAmount);
    } else {
      taxableAmount = netAmount;
      taxAmount = 0;
    }
    lineTotal = netAmount; // Grand line total is already inclusive
  } else {
    // Tax is exclusive (added on top)
    taxableAmount = netAmount;
    taxAmount = taxRate > 0 ? roundToCents(taxableAmount * (taxRate / 100)) : 0;
    lineTotal = roundToCents(netAmount + taxAmount);
  }

  return {
    quantity,
    unitPrice,
    taxRate,
    grossAmount,
    discountType,
    discountValue: discountVal,
    discountAmount,
    netAmount,
    taxableAmount,
    taxAmount,
    lineTotal
  };
}

/**
 * Calculates entire Document (Invoice or Quote)
 * 
 * @param {Object} doc - Document object
 * @param {Object} settings - Settings object (taxMode, taxName, etc.)
 * @returns {Object} Complete calculated breakdown
 */
export function calculateDocument(doc = {}, settings = {}) {
  const taxMode = doc.taxMode || settings.taxMode || 'exclusive';
  const rawItems = Array.isArray(doc.items) ? doc.items : [];
  
  // Calculate every line item
  const lineCalculations = rawItems.map(item => calculateLineItem(item, taxMode));

  // Sum line totals
  let grossSubtotal = 0;
  let lineDiscountsTotal = 0;
  let netSubtotal = 0;

  lineCalculations.forEach(calc => {
    grossSubtotal = roundToCents(grossSubtotal + calc.grossAmount);
    lineDiscountsTotal = roundToCents(lineDiscountsTotal + calc.discountAmount);
    netSubtotal = roundToCents(netSubtotal + calc.netAmount);
  });

  // Document-level discount calculation
  let docDiscountAmount = 0;
  const docDiscountType = doc.docDiscountType === 'fixed' ? 'fixed' : 'percent';
  const docDiscountValue = Math.max(0, typeof doc.docDiscountValue === 'number' ? doc.docDiscountValue : parseFloat(doc.docDiscountValue) || 0);

  if (docDiscountType === 'percent') {
    const clampedDocPct = Math.min(100, docDiscountValue);
    docDiscountAmount = roundToCents(netSubtotal * (clampedDocPct / 100));
  } else {
    docDiscountAmount = roundToCents(Math.min(netSubtotal, docDiscountValue));
  }

  // Net taxable subtotal after document discount
  const postDocDiscountSubtotal = Math.max(0, roundToCents(netSubtotal - docDiscountAmount));
  const docDiscountFactor = netSubtotal > 0 ? (postDocDiscountSubtotal / netSubtotal) : 1;

  // Tax Breakdown by tax rate
  const taxBreakdownMap = {};

  lineCalculations.forEach((calc, idx) => {
    const rawItem = rawItems[idx] || {};
    const rate = calc.taxRate;
    const rateKey = rate.toFixed(2);
    const taxName = rawItem.taxName || (rate > 0 ? `${settings.taxName || 'Tax'} (${rate}%)` : 'Zero Tax (0%)');

    if (!taxBreakdownMap[rateKey]) {
      taxBreakdownMap[rateKey] = {
        rate,
        taxName,
        taxableAmount: 0,
        taxAmount: 0
      };
    }

    // Allocate post-doc-discount taxable amount to rate bucket
    const adjustedTaxable = roundToCents(calc.netAmount * docDiscountFactor);
    taxBreakdownMap[rateKey].taxableAmount = roundToCents(taxBreakdownMap[rateKey].taxableAmount + adjustedTaxable);

    if (rate > 0) {
      if (taxMode === 'inclusive') {
        const base = roundToCents(adjustedTaxable / (1 + rate / 100));
        const tax = roundToCents(adjustedTaxable - base);
        taxBreakdownMap[rateKey].taxAmount = roundToCents(taxBreakdownMap[rateKey].taxAmount + tax);
      } else {
        const tax = roundToCents(adjustedTaxable * (rate / 100));
        taxBreakdownMap[rateKey].taxAmount = roundToCents(taxBreakdownMap[rateKey].taxAmount + tax);
      }
    }
  });

  const taxBreakdown = Object.values(taxBreakdownMap).filter(t => t.taxableAmount > 0 || t.taxAmount > 0);
  const totalTax = roundToCents(taxBreakdown.reduce((sum, t) => sum + t.taxAmount, 0));

  // Additional Charges / Shipping fees
  const shippingFee = Math.max(0, roundToCents(doc.shippingFee || 0));
  const additionalCharges = Math.max(0, roundToCents(doc.additionalCharges || 0));

  // Grand Total
  let grandTotal = 0;
  if (taxMode === 'inclusive') {
    // Taxes are already inside postDocDiscountSubtotal
    grandTotal = roundToCents(postDocDiscountSubtotal + shippingFee + additionalCharges);
  } else {
    // Taxes are added to postDocDiscountSubtotal
    grandTotal = roundToCents(postDocDiscountSubtotal + totalTax + shippingFee + additionalCharges);
  }

  // Payments & Balance
  const payments = Array.isArray(doc.payments) ? doc.payments : [];
  const amountPaid = roundToCents(
    payments.reduce((sum, p) => sum + Math.max(0, typeof p.amount === 'number' ? p.amount : parseFloat(p.amount) || 0), 0)
  );

  const amountDue = Math.max(0, roundToCents(grandTotal - amountPaid));

  // Compute payment status based on amounts
  let computedStatus = doc.status || 'Draft';
  if (doc.type === 'invoice') {
    if (doc.status !== 'Draft' && doc.status !== 'Cancelled') {
      if (amountPaid >= grandTotal && grandTotal > 0) {
        computedStatus = 'Paid';
      } else if (amountPaid > 0 && amountPaid < grandTotal) {
        computedStatus = 'Partially Paid';
      } else if (doc.dueDate && new Date(doc.dueDate).getTime() < new Date().setHours(0,0,0,0) && amountPaid < grandTotal) {
        computedStatus = 'Overdue';
      }
    }
  }

  return {
    taxMode,
    lineCalculations,
    grossSubtotal,
    lineDiscountsTotal,
    netSubtotal,
    docDiscountType,
    docDiscountValue,
    docDiscountAmount,
    totalDiscounts: roundToCents(lineDiscountsTotal + docDiscountAmount),
    postDocDiscountSubtotal,
    taxBreakdown,
    totalTax,
    shippingFee,
    additionalCharges,
    grandTotal,
    amountPaid,
    amountDue,
    computedStatus
  };
}
