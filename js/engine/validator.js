/**
 * Input Validation & Data Integrity Rules
 */

export function isValidEmail(email) {
  if (!email) return true; // Optional field
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).trim());
}

export function validateCustomer(customer) {
  const errors = [];
  if (!customer || !customer.name || !customer.name.trim()) {
    errors.push('Customer name is required.');
  }
  if (customer && customer.email && !isValidEmail(customer.email)) {
    errors.push('Customer email format is invalid.');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateProduct(product) {
  const errors = [];
  if (!product || !product.name || !product.name.trim()) {
    errors.push('Product / Service name is required.');
  }
  const price = parseFloat(product.unitPrice);
  if (isNaN(price) || price < 0) {
    errors.push('Unit price must be a valid non-negative number.');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateDocument(doc) {
  const errors = [];
  const warnings = [];

  if (!doc) {
    return { isValid: false, errors: ['Document data is missing.'], warnings: [] };
  }

  if (!doc.number || !String(doc.number).trim()) {
    errors.push('Document number is required.');
  }

  if (!doc.customer || (!doc.customer.name && !doc.customer.id)) {
    errors.push('Customer information is required.');
  }

  if (!doc.date) {
    errors.push('Document issue date is required.');
  }

  if (doc.type === 'invoice' && doc.dueDate && doc.date) {
    const issueDate = new Date(doc.date);
    const dueDate = new Date(doc.dueDate);
    if (dueDate < issueDate) {
      warnings.push('Due date is earlier than the invoice issue date.');
    }
  }

  if (!Array.isArray(doc.items) || doc.items.length === 0) {
    errors.push('At least one line item is required.');
  } else {
    doc.items.forEach((item, index) => {
      const lineNum = index + 1;
      if (!item.description || !item.description.trim()) {
        errors.push(`Line item #${lineNum}: Description is required.`);
      }
      const qty = parseFloat(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        errors.push(`Line item #${lineNum}: Quantity must be greater than 0.`);
      }
      const price = parseFloat(item.unitPrice);
      if (isNaN(price) || price < 0) {
        errors.push(`Line item #${lineNum}: Unit price must be a non-negative number.`);
      }
      if (item.discountValue !== undefined && item.discountValue !== null) {
        const disc = parseFloat(item.discountValue);
        if (isNaN(disc) || disc < 0) {
          errors.push(`Line item #${lineNum}: Discount cannot be negative.`);
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateImportData(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Backup file is empty or not a valid JSON object.'] };
  }

  if (!data.version) {
    errors.push('Missing database schema version.');
  }

  if (data.customers && !Array.isArray(data.customers)) {
    errors.push('Invalid customers table structure.');
  }

  if (data.products && !Array.isArray(data.products)) {
    errors.push('Invalid products table structure.');
  }

  if (data.documents && !Array.isArray(data.documents)) {
    errors.push('Invalid documents table structure.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
