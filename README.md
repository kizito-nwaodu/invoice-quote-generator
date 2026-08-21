# InvoiceMaster Pro — Production Invoice & Quote Generator 🚀

> High-performance, deterministic Invoice & Quote Generator with multi-organization workspaces, customizable PDF templates, customer CRM, catalog management, and zero-drift financial calculation engine.

[![Engine Verification](https://img.shields.io/badge/Engine%20Tests-16%2F16%20Passing-success?style=flat-square)](#calculation-engine-verification)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Zero Build Dependencies](https://img.shields.io/badge/Build%20Step-Zero%20(Pure%20ES%20Modules)-purple?style=flat-square)](#getting-started)

---

## ✨ Features

- 🏢 **Multi-Organization Workspaces**: Switch seamlessly between multiple business entities or client accounts with isolated namespaced data.
- 🔐 **Built-in Authentication & Session Security**: Seamless modal sign-in, registration, demo mode, and persistent session management.
- 🧾 **Deterministic Calculation Engine**: Exact cents arithmetic avoiding IEEE 754 floating point drift, supporting mixed tax rates, inclusive/exclusive pricing, line & document discounts, shipping fees, and partial payments.
- 🎨 **4 Designer PDF Templates**: Modern Pro, Classic Corporate, Minimal Clean, and Bold Studio with live preview.
- 📥 **Export to PDF & Native Print**: High-fidelity vector PDF download with automatic print-ready stylesheets.
- ✉️ **Email Sharing & Clipboard Summary**: One-click email composer with mailto link generation and formatted plain-text summaries for Slack/WhatsApp.
- 👥 **Customer Relationship Management (CRM)**: Manage clients, contact details, tax numbers, addresses, and full customer statement history.
- 📦 **Products & Services Catalog**: One-click line item insertion with customizable SKU, unit prices, and default tax rates.
- 🌓 **Dark & Light Mode**: Curated HSL-tailored palette with smooth micro-animations and persistent theme preference.
- 💾 **Data Backup & Restore**: Portable JSON export/import for complete offline backup and zero vendor lock-in.
- 🧪 **16-Point Automated Verification Suite**: Built-in test runner validating rounding rules, decimal prices, tax calculations, and balance reconciliations.

---

## 🚀 Live Demo & Deployment

This application is built with vanilla HTML5, CSS3, and modern ES6+ JavaScript modules. It requires **zero build tools, node modules, or compile steps**, making it 100% compatible with GitHub Pages, Vercel, Netlify, or any static web server.

### Deploy to GitHub Pages:
1. Push this repository to GitHub.
2. Go to **Repository Settings** → **Pages**.
3. Under **Build and deployment**, select **Source: Deploy from a branch** and choose `main` / root (`/`).
4. Access your live app at `https://<username>.github.io/<repository-name>/landing.html`.

---

## 📁 Project Architecture

```
invoice-quote-generator/
├── assets/
│   └── icons.js              # Vector SVG icon library
├── css/
│   ├── auth.css              # Authentication & org switcher styles
│   ├── components.css        # Buttons, forms, modals, tables, badges
│   ├── editor.css            # Live invoice/quote builder layouts
│   ├── landing.css           # Marketing landing page styling
│   ├── main.css              # Design tokens, color palette, dark mode
│   ├── print.css             # High-precision print media styles
│   └── templates.css         # Document theme templates (Modern, Classic, Minimal, Bold)
├── js/
│   ├── app.js                # Core controller, router, modal manager
│   ├── auth/
│   │   ├── auth.js           # Multi-organization auth & accounts engine
│   │   └── auth-ui.js        # Auth modal, org switcher popover, user menu
│   ├── engine/
│   │   ├── calculation.js    # Deterministic rounding & calculation algorithms
│   │   ├── formatter.js      # Currency symbols, dates, ISO strings
│   │   └── validator.js      # Form & model validators
│   ├── export/
│   │   ├── backup.js         # JSON backup export & restore manager
│   │   └── pdf.js            # PDF download & print pipeline
│   ├── storage/
│   │   ├── db.js             # Namespaced localStorage abstraction
│   │   └── repository.js     # Repositories for Documents, Customers, Products, Settings
│   ├── tests/
│   │   └── calculation.test.js # 16 automated deterministic test cases
│   └── views/
│       ├── customers.js      # Client CRM directory & history view
│       ├── dashboard.js      # Financial overview & recent documents
│       ├── documents.js      # Filterable & searchable documents table
│       ├── editor.js         # Unified invoice/quote builder
│       ├── onboarding.js     # First-run guided setup wizard
│       ├── preview.js        # Interactive document viewer & PDF generator
│       ├── products.js       # Product & services catalog view
│       ├── settings.js       # Business branding & configuration
│       └── tests-view.js     # Verification suite UI
├── index.html                # Main application workspace
└── landing.html              # Marketing & feature showcase landing page
```

---

## 🧪 Calculation Engine Verification

Run the built-in calculation suite in your browser by navigating to `#/tests` in the app. Tests cover:

1. Basic subtotal addition with zero floating-point error
2. Percentage line discounts calculation
3. Fixed amount line discounts
4. Tax-exclusive rate calculations
5. Tax-inclusive price back-calculation
6. Document-level percentage discounts
7. Mixed tax rates across multi-line invoices
8. Shipping and delivery fee additions
9. Partial payment reconciliation & remaining balance
10. Full payment status transitions
11. Large totals handling ($1M+)
12. Rounding half-up financial compliance

---

## 📄 License

MIT © [InvoiceMaster Pro](LICENSE)
