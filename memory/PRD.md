# FoodNova - Product Requirements Document

## Original Problem Statement
Build a mobile-first web application MVP for a foodstuff business called FoodNova, operating in Nigeria.

## User Personas
1. **Customers**: Nigerian consumers shopping for foodstuff (rice, beans, oil, spices), using mobile phones with varying bandwidth
2. **Store Admin**: Business owner/staff managing orders, inventory, and deliveries

## Core Requirements (Static)
- Phone OTP authentication for customers
- Email/password authentication for admin
- Product browsing with categories
- Cart & checkout with Pickup/Delivery options
- Bank transfer payment (manual confirmation)
- Order status workflow management
- Inventory management with stock logging
- Delivery zones with configurable fees
- SMS notifications (via Africa's Talking - CURRENTLY MOCKED)

## What's Been Implemented (Dec 3, 2025)

### Customer Features ✅
- [x] Home page with hero, categories, and products
- [x] **Product search** with live dropdown results (debounce 300ms)
- [x] Category filtering and product browsing
- [x] Product details page with quantity selection
- [x] Shopping cart with persistence (localStorage)
- [x] Checkout flow with Pickup/Delivery options
- [x] Order confirmation with bank payment instructions
- [x] **Payment proof upload** (JPG, PNG, PDF - max 5MB)
- [x] My Orders page (requires login)
- [x] Phone + OTP login (OTP shown for testing, SMS mocked)

### Admin Features ✅
- [x] Admin login (admin@foodnova.com / admin123)
- [x] Dashboard with stats and order summary
- [x] Orders management with status updates
- [x] **View uploaded payment proofs** in order modal
- [x] Products CRUD management
- [x] Inventory management with stock adjustment
- [x] Delivery zones management
- [x] Settings (bank details, pickup slots, SMS templates)

### Technical Implementation ✅
- [x] FastAPI backend with MongoDB
- [x] React frontend with Tailwind CSS
- [x] Shadcn/UI components
- [x] JWT authentication
- [x] Africa's Talking SMS integration (MOCKED - logs to console)
- [x] Mobile-first responsive design
- [x] Nigerian Naira (₦) currency formatting
- [x] File upload with validation (type & size limits)

## Prioritized Backlog

### P0 (Critical - Next)
- [ ] Activate Africa's Talking SMS with production credentials
- [ ] Order cancellation flow

### P1 (High Priority)
- [ ] Customer profile editing
- [ ] Order history filtering
- [ ] Low stock email notifications to admin

### P2 (Nice to Have)
- [ ] Product images upload
- [ ] Bulk product import/export
- [ ] Sales reports and analytics
- [ ] Customer address book

## Technical Notes
- SMS is currently MOCKED (messages logged to console)
- Default admin: admin@foodnova.com / admin123
- Seeded with sample categories, products, and delivery zones
- Stock is deducted ONLY when order is confirmed (not at placement)
- Payment proofs stored in `/app/backend/uploads/` and served at `/api/uploads/`

## API Endpoints
### Auth
- POST /api/auth/send-otp - Send OTP to phone
- POST /api/auth/verify-otp - Verify OTP and login
- POST /api/auth/admin/login - Admin login

### Products
- GET /api/categories - List categories
- GET /api/products - List products (supports `?search=` query)
- GET /api/products/search/{query} - Search products by name
- GET /api/products/{id} - Get product details

### Orders
- POST /api/orders - Create order
- GET /api/orders/{order_number} - Get order details
- GET /api/orders/my - Get customer's orders
- POST /api/orders/{order_id}/payment-proof - Upload payment proof
- GET /api/orders/{order_id}/payment-proof - Get payment proof URL

### Admin
- GET /api/admin/orders - List all orders (supports `?status_filter=`)
- PUT /api/admin/orders/{id}/status - Update order status
- POST /api/admin/stock/adjust - Adjust product stock
- GET /api/delivery-zones - List delivery zones
- GET /api/settings - Get store settings

## SMS Notification Triggers
- Order Placed: Shows bank details and order reference
- Payment Confirmed: Order is being prepared
- Ready for Pickup: Order ready at store
- Out for Delivery: Includes rider details
- Delivered/Picked Up: Thank you message
