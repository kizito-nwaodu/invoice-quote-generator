/**
 * Sample Demo Data for instant testing and demonstration
 */

import { getTodayDateString, addDays } from '../engine/formatter.js';

export function getSampleData() {
  const today = getTodayDateString();

  const business = {
    name: 'Apex Digital Studio',
    tagline: 'Design, Engineering & Brand Strategy',
    logo: '',
    address: '100 Innovation Blvd, Suite 400\nSan Francisco, CA 94107',
    email: 'billing@apexdigital.io',
    phone: '+1 (555) 234-8900',
    website: 'https://apexdigital.io',
    taxNumber: 'US-EIN-884920194',
    regNumber: 'CA-LLC-2023-99120',
    paymentInfo: 'Bank: Silicon Valley Bank\nAccount: 9876-5432-1098\nRouting: 121000358\nSwift/BIC: SVBUS6S\nPayPal: pay@apexdigital.io',
    footerNotes: 'Thank you for your business! Please pay within the specified terms.'
  };

  const settings = {
    business,
    currency: 'USD',
    taxName: 'Sales Tax',
    taxRate: 8.5,
    taxEnabled: true,
    taxMode: 'exclusive', // 'exclusive' | 'inclusive'
    invoicePrefix: 'INV-',
    quotePrefix: 'QUO-',
    invoiceNextNum: 6,
    quoteNextNum: 4,
    defaultPaymentTerms: '14',
    defaultTemplate: 'modern', // 'modern' | 'classic' | 'minimal' | 'bold'
    brandColor: '#2563eb',
    accentColor: '#4f46e5',
    fontFamily: 'Inter',
    isDemoLoaded: true
  };

  const customers = [
    {
      id: 'cust_1',
      isDemo: true,
      name: 'Acme Corporation',
      company: 'Acme Corporation Ltd.',
      contactPerson: 'Sarah Jenkins',
      email: 'sjenkins@acmecorp.com',
      phone: '+1 (555) 432-1100',
      address: '742 Evergreen Terrace\nSeattle, WA 98101',
      taxNumber: 'WA-TAX-9821034',
      notes: 'Key client for SaaS web design and cloud infrastructure.'
    },
    {
      id: 'cust_2',
      isDemo: true,
      name: 'Nexora Health Inc.',
      company: 'Nexora Health Technologies',
      contactPerson: 'Dr. Marcus Vance',
      email: 'accounts@nexorahealth.com',
      phone: '+1 (555) 876-5432',
      address: '450 Biomedical Parkway\nBoston, MA 02115',
      taxNumber: 'MA-MED-5541920',
      notes: 'Healthcare portal redesign and HIPAA compliance consulting.'
    },
    {
      id: 'cust_3',
      isDemo: true,
      name: 'Luminary Coffee Co.',
      company: 'Luminary Artisan Roasters',
      contactPerson: 'Elena Rodriguez',
      email: 'elena@luminarycoffee.com',
      phone: '+1 (555) 321-9988',
      address: '128 Market Square\nPortland, OR 97204',
      taxNumber: 'OR-RET-8812903',
      notes: 'E-commerce store setup and packaging branding.'
    }
  ];

  const products = [
    {
      id: 'prod_1',
      isDemo: true,
      sku: 'SRV-UIUX-01',
      name: 'UI/UX Design System & Prototyping',
      description: 'Comprehensive design system, responsive component library, and Figma prototype.',
      unit: 'hrs',
      unitPrice: 150.00,
      taxRate: 8.5
    },
    {
      id: 'prod_2',
      isDemo: true,
      sku: 'SRV-DEV-02',
      name: 'Frontend Web Application Development',
      description: 'Production-ready responsive frontend architecture, state management, and API integration.',
      unit: 'hrs',
      unitPrice: 175.00,
      taxRate: 8.5
    },
    {
      id: 'prod_3',
      isDemo: true,
      sku: 'PKG-AUDIT-03',
      name: 'Cloud Security & Performance Audit',
      description: 'Full-stack audit including Lighthouse optimization, accessibility review, and security hardening.',
      unit: 'audit',
      unitPrice: 1800.00,
      taxRate: 8.5
    },
    {
      id: 'prod_4',
      isDemo: true,
      sku: 'RET-MAINT-04',
      name: 'Monthly Priority Maintenance Retainer',
      description: 'Dedicated 20-hour monthly retainer for ongoing support, bug fixes, and feature enhancements.',
      unit: 'month',
      unitPrice: 2800.00,
      taxRate: 8.5
    }
  ];

  const documents = [
    // Invoice 1: Paid
    {
      id: 'doc_inv_1',
      isDemo: true,
      type: 'invoice',
      number: 'INV-00001',
      status: 'Paid',
      date: addDays(today, -30),
      dueDate: addDays(today, -16),
      currency: 'USD',
      template: 'modern',
      taxMode: 'exclusive',
      customer: { ...customers[0] },
      items: [
        {
          id: 'item_1_1',
          description: 'UI/UX Design System & Prototyping - Phase 1',
          quantity: 24,
          unit: 'hrs',
          unitPrice: 150.00,
          discountType: 'percent',
          discountValue: 0,
          taxRate: 8.5,
          taxName: 'Sales Tax (8.5%)'
        },
        {
          id: 'item_1_2',
          description: 'Frontend Web Application Development - Sprint 1 & 2',
          quantity: 36,
          unit: 'hrs',
          unitPrice: 175.00,
          discountType: 'percent',
          discountValue: 5,
          taxRate: 8.5,
          taxName: 'Sales Tax (8.5%)'
        }
      ],
      docDiscountType: 'fixed',
      docDiscountValue: 0,
      shippingFee: 0,
      additionalCharges: 0,
      notes: 'Initial milestone completed and approved by client.',
      terms: 'Payment due within 14 days. 1.5% late fee per month applies.',
      payments: [
        {
          id: 'pay_1',
          date: addDays(today, -18),
          amount: 10398.83,
          method: 'Bank Wire',
          reference: 'WIRE-ACME-8832'
        }
      ]
    },

    // Invoice 2: Partially Paid
    {
      id: 'doc_inv_2',
      isDemo: true,
      type: 'invoice',
      number: 'INV-00002',
      status: 'Partially Paid',
      date: addDays(today, -10),
      dueDate: addDays(today, 4),
      currency: 'USD',
      template: 'classic',
      taxMode: 'exclusive',
      customer: { ...customers[1] },
      items: [
        {
          id: 'item_2_1',
          description: 'Cloud Security & Performance Audit',
          quantity: 1,
          unit: 'audit',
          unitPrice: 1800.00,
          discountType: 'percent',
          discountValue: 0,
          taxRate: 8.5,
          taxName: 'Sales Tax (8.5%)'
        },
        {
          id: 'item_2_2',
          description: 'HIPAA Portal Architecture Consulting',
          quantity: 12,
          unit: 'hrs',
          unitPrice: 175.00,
          discountType: 'percent',
          discountValue: 0,
          taxRate: 8.5,
          taxName: 'Sales Tax (8.5%)'
        }
      ],
      docDiscountType: 'percent',
      docDiscountValue: 0,
      shippingFee: 0,
      additionalCharges: 0,
      notes: 'Phase 1 Audit report delivered. Consulting sessions ongoing.',
      terms: 'Net 14 payment terms.',
      payments: [
        {
          id: 'pay_2',
          date: addDays(today, -5),
          amount: 2000.00,
          method: 'Credit Card',
          reference: 'CC-NEX-4491'
        }
      ]
    },

    // Invoice 3: Overdue
    {
      id: 'doc_inv_3',
      isDemo: true,
      type: 'invoice',
      number: 'INV-00003',
      status: 'Overdue',
      date: addDays(today, -40),
      dueDate: addDays(today, -26),
      currency: 'USD',
      template: 'minimal',
      taxMode: 'exclusive',
      customer: { ...customers[2] },
      items: [
        {
          id: 'item_3_1',
          description: 'E-commerce Store Setup & Shopify Integration',
          quantity: 1,
          unit: 'pkg',
          unitPrice: 3200.00,
          discountType: 'fixed',
          discountValue: 200.00,
          taxRate: 8.5,
          taxName: 'Sales Tax (8.5%)'
        }
      ],
      docDiscountType: 'fixed',
      docDiscountValue: 0,
      shippingFee: 0,
      additionalCharges: 50.00,
      notes: 'Store deployed live on production domain.',
      terms: 'Payment due on receipt.',
      payments: []
    },

    // Invoice 4: Sent / Pending
    {
      id: 'doc_inv_4',
      isDemo: true,
      type: 'invoice',
      number: 'INV-00004',
      status: 'Sent',
      date: addDays(today, -2),
      dueDate: addDays(today, 12),
      currency: 'USD',
      template: 'bold',
      taxMode: 'exclusive',
      customer: { ...customers[0] },
      items: [
        {
          id: 'item_4_1',
          description: 'Monthly Priority Maintenance Retainer - Current Month',
          quantity: 1,
          unit: 'month',
          unitPrice: 2800.00,
          discountType: 'percent',
          discountValue: 0,
          taxRate: 8.5,
          taxName: 'Sales Tax (8.5%)'
        }
      ],
      docDiscountType: 'fixed',
      docDiscountValue: 0,
      shippingFee: 0,
      additionalCharges: 0,
      notes: 'Scheduled monthly maintenance for cloud deployments.',
      terms: 'Due in 14 days.',
      payments: []
    },

    // Invoice 5: Draft
    {
      id: 'doc_inv_5',
      isDemo: true,
      type: 'invoice',
      number: 'INV-00005',
      status: 'Draft',
      date: today,
      dueDate: addDays(today, 14),
      currency: 'USD',
      template: 'modern',
      taxMode: 'exclusive',
      customer: { ...customers[1] },
      items: [
        {
          id: 'item_5_1',
          description: 'Mobile App API Gateway Integration',
          quantity: 16,
          unit: 'hrs',
          unitPrice: 175.00,
          discountType: 'percent',
          discountValue: 10,
          taxRate: 8.5,
          taxName: 'Sales Tax (8.5%)'
        }
      ],
      docDiscountType: 'fixed',
      docDiscountValue: 0,
      shippingFee: 0,
      additionalCharges: 0,
      notes: 'Draft proposal under internal technical review.',
      terms: 'Standard terms apply.',
      payments: []
    },

    // Quote 1: Accepted / Converted
    {
      id: 'doc_quo_1',
      isDemo: true,
      type: 'quote',
      number: 'QUO-00001',
      status: 'Converted',
      date: addDays(today, -35),
      expirationDate: addDays(today, -5),
      convertedToInvoiceId: 'doc_inv_1',
      convertedToInvoiceNumber: 'INV-00001',
      currency: 'USD',
      template: 'modern',
      taxMode: 'exclusive',
      customer: { ...customers[0] },
      items: [
        {
          id: 'item_q1_1',
          description: 'UI/UX Design System & Prototyping - Phase 1',
          quantity: 24,
          unit: 'hrs',
          unitPrice: 150.00,
          discountType: 'percent',
          discountValue: 0,
          taxRate: 8.5,
          taxName: 'Sales Tax (8.5%)'
        },
        {
          id: 'item_q1_2',
          description: 'Frontend Web Application Development - Sprint 1 & 2',
          quantity: 36,
          unit: 'hrs',
          unitPrice: 175.00,
          discountType: 'percent',
          discountValue: 5,
          taxRate: 8.5,
          taxName: 'Sales Tax (8.5%)'
        }
      ],
      docDiscountType: 'fixed',
      docDiscountValue: 0,
      shippingFee: 0,
      additionalCharges: 0,
      notes: 'Quote converted to Invoice INV-00001.',
      terms: 'Estimate valid for 30 days.'
    },

    // Quote 2: Sent / Active
    {
      id: 'doc_quo_2',
      isDemo: true,
      type: 'quote',
      number: 'QUO-00002',
      status: 'Sent',
      date: addDays(today, -4),
      expirationDate: addDays(today, 26),
      currency: 'USD',
      template: 'bold',
      taxMode: 'exclusive',
      customer: { ...customers[2] },
      items: [
        {
          id: 'item_q2_1',
          description: 'Brand Identity Guidelines & Packaging Asset Kit',
          quantity: 1,
          unit: 'kit',
          unitPrice: 2500.00,
          discountType: 'percent',
          discountValue: 0,
          taxRate: 8.5,
          taxName: 'Sales Tax (8.5%)'
        },
        {
          id: 'item_q2_2',
          description: 'Custom Shopify Theme Customization & Photography Direction',
          quantity: 20,
          unit: 'hrs',
          unitPrice: 150.00,
          discountType: 'percent',
          discountValue: 10,
          taxRate: 8.5,
          taxName: 'Sales Tax (8.5%)'
        }
      ],
      docDiscountType: 'percent',
      docDiscountValue: 5,
      shippingFee: 0,
      additionalCharges: 0,
      notes: 'Proposal submitted for upcoming Autumn packaging rebrand.',
      terms: 'Estimate valid for 30 days from issue date.'
    },

    // Quote 3: Draft
    {
      id: 'doc_quo_3',
      isDemo: true,
      type: 'quote',
      number: 'QUO-00003',
      status: 'Draft',
      date: today,
      expirationDate: addDays(today, 30),
      currency: 'USD',
      template: 'minimal',
      taxMode: 'exclusive',
      customer: { ...customers[1] },
      items: [
        {
          id: 'item_q3_1',
          description: 'Annual Healthcare Platform Retainer Agreement',
          quantity: 12,
          unit: 'months',
          unitPrice: 2500.00,
          discountType: 'percent',
          discountValue: 15,
          taxRate: 8.5,
          taxName: 'Sales Tax (8.5%)'
        }
      ],
      docDiscountType: 'fixed',
      docDiscountValue: 0,
      shippingFee: 0,
      additionalCharges: 0,
      notes: 'Annual contract volume discount included.',
      terms: 'Estimate valid for 30 days.'
    }
  ];

  return {
    version: 1,
    settings,
    customers,
    products,
    documents
  };
}
