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
- SMS notifications (mocked for MVP)

## What's Been Implemented (Feb 3, 2026)

### Customer Features ✅
- [x] Home page with hero, categories, and products
- [x] Category filtering and product browsing
- [x] Product details page with quantity selection
- [x] Shopping cart with persistence (localStorage)
- [x] Checkout flow with Pickup/Delivery options
- [x] Order confirmation with bank payment instructions
- [x] My Orders page (requires login)
- [x] Phone + OTP login (OTP shown for testing, SMS mocked)

### Admin Features ✅
- [x] Admin login (admin@foodnova.com / admin123)
- [x] Dashboard with stats and order summary
- [x] Orders management with status updates
- [x] Products CRUD management
- [x] Inventory management with stock adjustment
- [x] Delivery zones management
- [x] Settings (bank details, pickup slots, SMS templates)

### Technical Implementation ✅
- [x] FastAPI backend with MongoDB
- [x] React frontend with Tailwind CSS
- [x] Shadcn/UI components
- [x] JWT authentication
- [x] Africa's Talking SMS integration (MOCKED)
- [x] Mobile-first responsive design
- [x] Nigerian Naira (₦) currency formatting

## Prioritized Backlog

### P0 (Critical - Next)
- [ ] Activate Africa's Talking SMS with real API key
- [ ] Payment proof upload functionality
- [ ] Order cancellation flow

### P1 (High Priority)
- [ ] Customer profile editing
- [ ] Product search functionality
- [ ] Order history filtering
- [ ] Low stock email notifications to admin

### P2 (Nice to Have)
- [ ] Product images upload
- [ ] Bulk product import/export
- [ ] Sales reports and analytics
- [ ] Customer address book

## Technical Notes
- SMS is currently mocked (messages logged to console)
- Default admin: admin@foodnova.com / admin123
- Seeded with sample categories, products, and delivery zones
- Stock is deducted ONLY when order is confirmed (not at placement)

## API Endpoints
- POST /api/auth/send-otp - Send OTP to phone
- POST /api/auth/verify-otp - Verify OTP and login
- POST /api/auth/admin/login - Admin login
- GET /api/categories - List categories
- GET /api/products - List products
- POST /api/orders - Create order
- GET /api/orders/{order_number} - Get order details
- PUT /api/admin/orders/{id}/status - Update order status
- POST /api/admin/stock/adjust - Adjust product stock
- GET /api/delivery-zones - List delivery zones
- GET /api/settings - Get store settings
