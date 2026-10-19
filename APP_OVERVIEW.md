# Spectra Inventory — Current App Overview

## What the app does

Spectra Inventory is a web app for small businesses to manage products and stock, record sales and purchases, track expenses, and review sales and profit data. It has a React frontend and an Express API backed by MongoDB/Mongoose.

## Main user workflows

- **Accounts:** Register and sign in, view and edit a profile, and change a password. Managers can create salesperson accounts. Access to some pages and actions depends on the user role.
- **Products and inventory:** Browse and search products, filter by category or stock status, add products, and remove products when permitted. Product records include SKU, category, supplier, cost and selling prices, quantity, and reorder level.
- **Sales:** Record sales against products. The backend checks available stock, records sale totals and profit, updates inventory, and provides sales history and daily sales data.
- **Purchases / stock in:** Record incoming stock purchases and review purchase records.
- **Expenses:** Managers can add, view, summarize, and delete business expenses.
- **Categories:** Managers can create, edit, and delete product categories; users can retrieve categories for product workflows.
- **Notifications:** View notifications and mark them as read.
- **Plans and team:** View plan information and manage salesperson accounts. The repository contains plan presentation, but no payment processing flow was identified.

## Dashboard and reporting

The dashboard presents sales and profit figures, inventory value, low-stock items, top-selling products, and recent sales. It supports 7-, 30-, and 90-day chart ranges. Comparison deltas are shown when comparison data is available. The backend also exposes analytics and report endpoints for sales and profit summaries.

## Pages in the frontend

The app includes a landing page, login and registration, dashboard, products, sales, stock in, stock out, expenses, reports, profile, settings, team accounts, and plan information. Some routes are role-restricted. The category page component exists, but it is not registered as a standalone route in the app router.

## API and runtime

The Express API currently uses unversioned routes under `/api`, including `/api/users`, `/api/products`, `/api/sales`, `/api/purchases`, `/api/expenses`, `/api/categories`, `/api/dashboard`, `/api/analytics`, `/api/reports`, and `/api/notifications`. It also provides `/health`. The backend uses JWT authentication and password hashing, and the frontend uses React with Vite, TanStack Query, and chart libraries.

## Current implementation boundaries

- The requested versioned `/api/v1` API is not present; the API routes are currently unversioned.
- The frontend has a “Snap to add” image-analysis flow, but no matching backend image-analysis endpoint was found. Image analysis therefore depends on an endpoint that is not currently implemented in this repository.
- A refresh-token flow and Swagger/OpenAPI documentation were not found.
- The app overview reflects the code in this repository, not a live check of deployed services or external integrations.
