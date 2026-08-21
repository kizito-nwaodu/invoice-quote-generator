/**
 * High-Level Data Repository with Business Logic, Safe Sequential Numbering,
 * Relationship Integrity, and Quote-to-Invoice Conversion.
 */

import { DB, STORAGE_KEYS } from './db.js';
import { getSampleData } from './sample-data.js';
import { calculateDocument, roundToCents } from '../engine/calculation.js';
import { formatDocNumber, getTodayDateString, addDays } from '../engine/formatter.js';

export const SettingsRepo = {
  get() {
    let settings = DB.get(STORAGE_KEYS.SETTINGS);
    if (!settings) {
      // Default initial configuration
      const defaults = getSampleData().settings;
      defaults.isDemoLoaded = false;
      DB.set(STORAGE_KEYS.SETTINGS, defaults);
      return defaults;
    }
    return settings;
  },

  save(updated) {
    const current = this.get();
    const merged = { ...current, ...updated };
    DB.set(STORAGE_KEYS.SETTINGS, merged);
    return merged;
  },

  getBusiness() {
    return this.get().business || {};
  },

  saveBusiness(businessData) {
    const settings = this.get();
    settings.business = { ...settings.business, ...businessData };
    this.save(settings);
    return settings.business;
  }
};

export const CustomerRepo = {
  getAll() {
    return DB.get(STORAGE_KEYS.CUSTOMERS, []);
  },

  getById(id) {
    const list = this.getAll();
    return list.find(c => c.id === id) || null;
  },

  save(customer) {
    const list = this.getAll();
    const id = customer.id || `cust_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const record = { ...customer, id };
    
    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    DB.set(STORAGE_KEYS.CUSTOMERS, list);
    return record;
  },

  delete(id) {
    const list = this.getAll().filter(c => c.id !== id);
    DB.set(STORAGE_KEYS.CUSTOMERS, list);
    return true;
  },

  getStats(customerId) {
    const docs = DocumentRepo.getAll().filter(d => d.customer && (d.customer.id === customerId || d.customer.name === customerId));
    const invoices = docs.filter(d => d.type === 'invoice');
    const quotes = docs.filter(d => d.type === 'quote');
    const settings = SettingsRepo.get();

    let totalInvoiced = 0;
    let totalPaid = 0;

    invoices.forEach(inv => {
      if (inv.status !== 'Cancelled') {
        const calc = calculateDocument(inv, settings);
        totalInvoiced = roundToCents(totalInvoiced + calc.grandTotal);
        totalPaid = roundToCents(totalPaid + calc.amountPaid);
      }
    });

    const outstandingBalance = Math.max(0, roundToCents(totalInvoiced - totalPaid));

    return {
      documentsCount: docs.length,
      invoicesCount: invoices.length,
      quotesCount: quotes.length,
      totalInvoiced,
      totalPaid,
      outstandingBalance,
      documents: docs
    };
  }
};

export const ProductRepo = {
  getAll() {
    return DB.get(STORAGE_KEYS.PRODUCTS, []);
  },

  getById(id) {
    const list = this.getAll();
    return list.find(p => p.id === id) || null;
  },

  save(product) {
    const list = this.getAll();
    const id = product.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const record = { ...product, id };
    
    const idx = list.findIndex(p => p.id === id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    DB.set(STORAGE_KEYS.PRODUCTS, list);
    return record;
  },

  delete(id) {
    const list = this.getAll().filter(p => p.id !== id);
    DB.set(STORAGE_KEYS.PRODUCTS, list);
    return true;
  }
};

export const DocumentRepo = {
  getAll() {
    return DB.get(STORAGE_KEYS.DOCUMENTS, []);
  },

  getInvoices() {
    return this.getAll().filter(d => d.type === 'invoice');
  },

  getQuotes() {
    return this.getAll().filter(d => d.type === 'quote');
  },

  getById(id) {
    const list = this.getAll();
    return list.find(d => d.id === id) || null;
  },

  getByNumber(number) {
    const list = this.getAll();
    return list.find(d => d.number === number) || null;
  },

  /**
   * Generates next collision-free document number
   */
  getNextDocNumber(type = 'invoice') {
    const settings = SettingsRepo.get();
    const prefix = type === 'invoice' ? (settings.invoicePrefix || 'INV-') : (settings.quotePrefix || 'QUO-');
    let nextNum = type === 'invoice' ? (settings.invoiceNextNum || 1) : (settings.quoteNextNum || 1);

    const existingDocs = this.getAll().filter(d => d.type === type);
    const existingNumbers = new Set(existingDocs.map(d => d.number));

    let candidate = formatDocNumber(prefix, nextNum);
    while (existingNumbers.has(candidate)) {
      nextNum += 1;
      candidate = formatDocNumber(prefix, nextNum);
    }

    return {
      number: candidate,
      nextIndex: nextNum
    };
  },

  save(doc) {
    const list = this.getAll();
    const settings = SettingsRepo.get();
    
    // Ensure document ID
    const isNew = !doc.id;
    const id = doc.id || `doc_${doc.type}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    
    // Auto-compute status and totals before saving
    const calc = calculateDocument(doc, settings);
    const status = calc.computedStatus || doc.status || 'Draft';

    const record = {
      ...doc,
      id,
      status,
      updatedAt: new Date().toISOString()
    };

    if (isNew) {
      record.createdAt = new Date().toISOString();
      list.unshift(record);

      // Increment sequence counter in settings if this was the candidate number
      if (doc.type === 'invoice') {
        const currentCounter = settings.invoiceNextNum || 1;
        const formattedExpected = formatDocNumber(settings.invoicePrefix || 'INV-', currentCounter);
        if (doc.number === formattedExpected) {
          SettingsRepo.save({ invoiceNextNum: currentCounter + 1 });
        }
      } else {
        const currentCounter = settings.quoteNextNum || 1;
        const formattedExpected = formatDocNumber(settings.quotePrefix || 'QUO-', currentCounter);
        if (doc.number === formattedExpected) {
          SettingsRepo.save({ quoteNextNum: currentCounter + 1 });
        }
      }
    } else {
      const idx = list.findIndex(d => d.id === id);
      if (idx >= 0) {
        list[idx] = record;
      } else {
        list.unshift(record);
      }
    }

    DB.set(STORAGE_KEYS.DOCUMENTS, list);
    return record;
  },

  delete(id) {
    const list = this.getAll().filter(d => d.id !== id);
    DB.set(STORAGE_KEYS.DOCUMENTS, list);
    return true;
  },

  duplicate(id) {
    const original = this.getById(id);
    if (!original) return null;

    const nextNumberInfo = this.getNextDocNumber(original.type);

    const clone = JSON.parse(JSON.stringify(original));
    delete clone.id;
    delete clone.isDemo;
    delete clone.createdAt;
    delete clone.updatedAt;
    delete clone.convertedToInvoiceId;
    delete clone.convertedToInvoiceNumber;
    delete clone.sourceQuoteId;
    delete clone.sourceQuoteNumber;

    clone.number = nextNumberInfo.number;
    clone.status = 'Draft';
    clone.date = getTodayDateString();
    
    if (clone.type === 'invoice') {
      const settings = SettingsRepo.get();
      const termsDays = parseInt(settings.defaultPaymentTerms || '14', 10);
      clone.dueDate = addDays(clone.date, termsDays);
      clone.payments = [];
    } else {
      clone.expirationDate = addDays(clone.date, 30);
    }

    return this.save(clone);
  },

  /**
   * Convert Quote to Invoice seamlessly
   */
  convertQuoteToInvoice(quoteId) {
    const quote = this.getById(quoteId);
    if (!quote || quote.type !== 'quote') {
      throw new Error('Valid Quote not found for conversion.');
    }

    const settings = SettingsRepo.get();
    const nextInvoiceInfo = this.getNextDocNumber('invoice');
    const termsDays = parseInt(settings.defaultPaymentTerms || '14', 10);
    const today = getTodayDateString();

    // 1. Create Invoice preserving items, taxes, discounts, notes, customer
    const invoiceData = {
      type: 'invoice',
      number: nextInvoiceInfo.number,
      status: 'Draft',
      date: today,
      dueDate: addDays(today, termsDays),
      currency: quote.currency || settings.currency || 'USD',
      template: quote.template || settings.defaultTemplate || 'modern',
      taxMode: quote.taxMode || settings.taxMode || 'exclusive',
      customer: { ...quote.customer },
      items: JSON.parse(JSON.stringify(quote.items || [])),
      docDiscountType: quote.docDiscountType || 'percent',
      docDiscountValue: quote.docDiscountValue || 0,
      shippingFee: quote.shippingFee || 0,
      additionalCharges: quote.additionalCharges || 0,
      notes: quote.notes || '',
      terms: quote.terms || settings.business?.footerNotes || '',
      payments: [],
      sourceQuoteId: quote.id,
      sourceQuoteNumber: quote.number
    };

    const newInvoice = this.save(invoiceData);

    // 2. Update quote status to Converted and link invoice
    quote.status = 'Converted';
    quote.convertedToInvoiceId = newInvoice.id;
    quote.convertedToInvoiceNumber = newInvoice.number;
    this.save(quote);

    return newInvoice;
  },

  /**
   * Record a payment against an invoice
   */
  recordPayment(invoiceId, payment) {
    const invoice = this.getById(invoiceId);
    if (!invoice || invoice.type !== 'invoice') {
      throw new Error('Invoice not found.');
    }

    if (!Array.isArray(invoice.payments)) {
      invoice.payments = [];
    }

    const paymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      date: payment.date || getTodayDateString(),
      amount: roundToCents(payment.amount || 0),
      method: payment.method || 'Bank Transfer',
      reference: payment.reference || '',
      notes: payment.notes || ''
    };

    invoice.payments.push(paymentRecord);
    return this.save(invoice);
  },

  /**
   * Aggregate Metrics for Dashboard
   */
  getDashboardMetrics() {
    const settings = SettingsRepo.get();
    const invoices = this.getInvoices();
    const quotes = this.getQuotes();
    const customers = CustomerRepo.getAll();

    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalQuotesValue = 0;

    invoices.forEach(inv => {
      if (inv.status !== 'Cancelled') {
        const calc = calculateDocument(inv, settings);
        totalInvoiced = roundToCents(totalInvoiced + calc.grandTotal);
        totalPaid = roundToCents(totalPaid + calc.amountPaid);
        totalOutstanding = roundToCents(totalOutstanding + calc.amountDue);
      }
    });

    quotes.forEach(q => {
      if (q.status !== 'Declined' && q.status !== 'Expired') {
        const calc = calculateDocument(q, settings);
        totalQuotesValue = roundToCents(totalQuotesValue + calc.grandTotal);
      }
    });

    // Recent activity list
    const recentDocuments = this.getAll()
      .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
      .slice(0, 5);

    return {
      currency: settings.currency || 'USD',
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      totalQuotesValue,
      invoicesCount: invoices.length,
      quotesCount: quotes.length,
      customersCount: customers.length,
      recentDocuments
    };
  }
};

export const DataRepo = {
  loadDemoData() {
    const sample = getSampleData();
    DB.set(STORAGE_KEYS.SETTINGS, sample.settings);
    DB.set(STORAGE_KEYS.CUSTOMERS, sample.customers);
    DB.set(STORAGE_KEYS.PRODUCTS, sample.products);
    DB.set(STORAGE_KEYS.DOCUMENTS, sample.documents);
    return true;
  },

  clearDemoData() {
    const customers = CustomerRepo.getAll().filter(c => !c.isDemo);
    const products = ProductRepo.getAll().filter(p => !p.isDemo);
    const documents = DocumentRepo.getAll().filter(d => !d.isDemo);

    DB.set(STORAGE_KEYS.CUSTOMERS, customers);
    DB.set(STORAGE_KEYS.PRODUCTS, products);
    DB.set(STORAGE_KEYS.DOCUMENTS, documents);

    const settings = SettingsRepo.get();
    settings.isDemoLoaded = false;
    SettingsRepo.save(settings);
    return true;
  },

  clearAllData() {
    DB.clearAll();
    const fresh = getSampleData().settings;
    fresh.isDemoLoaded = false;
    DB.set(STORAGE_KEYS.SETTINGS, fresh);
    DB.set(STORAGE_KEYS.CUSTOMERS, []);
    DB.set(STORAGE_KEYS.PRODUCTS, []);
    DB.set(STORAGE_KEYS.DOCUMENTS, []);
    return true;
  },

  exportAll() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: SettingsRepo.get(),
      customers: CustomerRepo.getAll(),
      products: ProductRepo.getAll(),
      documents: DocumentRepo.getAll()
    };
  },

  importAll(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid JSON backup file.');
    }

    if (data.settings) DB.set(STORAGE_KEYS.SETTINGS, data.settings);
    if (Array.isArray(data.customers)) DB.set(STORAGE_KEYS.CUSTOMERS, data.customers);
    if (Array.isArray(data.products)) DB.set(STORAGE_KEYS.PRODUCTS, data.products);
    if (Array.isArray(data.documents)) DB.set(STORAGE_KEYS.DOCUMENTS, data.documents);
    return true;
  }
};
