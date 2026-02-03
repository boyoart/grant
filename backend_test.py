#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class FoodNovaAPITester:
    def __init__(self, base_url="https://naija-eats-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.customer_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")

    def make_request(self, method, endpoint, data=None, headers=None, token=None):
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}/api/{endpoint}"
        
        request_headers = {'Content-Type': 'application/json'}
        if headers:
            request_headers.update(headers)
        if token:
            request_headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=request_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=request_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=request_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=request_headers, timeout=30)
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {str(e)}")
            return None

    def test_root_endpoint(self):
        """Test API root endpoint"""
        response = self.make_request('GET', '')
        if response and response.status_code == 200:
            data = response.json()
            success = "FoodNova API" in data.get("message", "")
            self.log_test("API Root Endpoint", success, f"Status: {response.status_code}")
        else:
            self.log_test("API Root Endpoint", False, f"Failed to connect or bad status: {response.status_code if response else 'No response'}")

    def test_seed_data(self):
        """Test data seeding"""
        response = self.make_request('POST', 'seed')
        if response and response.status_code == 200:
            self.log_test("Seed Data", True, "Data seeded successfully")
        else:
            self.log_test("Seed Data", False, f"Status: {response.status_code if response else 'No response'}")

    def test_admin_login(self):
        """Test admin login with default credentials"""
        data = {
            "email": "admin@foodnova.com",
            "password": "admin123"
        }
        response = self.make_request('POST', 'auth/admin/login', data)
        
        if response and response.status_code == 200:
            result = response.json()
            if 'token' in result:
                self.admin_token = result['token']
                self.log_test("Admin Login", True, "Login successful, token received")
                return True
            else:
                self.log_test("Admin Login", False, "No token in response")
        else:
            self.log_test("Admin Login", False, f"Status: {response.status_code if response else 'No response'}")
        return False

    def test_categories(self):
        """Test category endpoints"""
        # Test public categories
        response = self.make_request('GET', 'categories')
        if response and response.status_code == 200:
            categories = response.json()
            success = isinstance(categories, list) and len(categories) > 0
            self.log_test("Get Categories (Public)", success, f"Found {len(categories)} categories")
        else:
            self.log_test("Get Categories (Public)", False, f"Status: {response.status_code if response else 'No response'}")

        # Test admin categories (requires admin token)
        if self.admin_token:
            response = self.make_request('GET', 'admin/categories', token=self.admin_token)
            if response and response.status_code == 200:
                categories = response.json()
                success = isinstance(categories, list)
                self.log_test("Get Categories (Admin)", success, f"Found {len(categories)} categories")
            else:
                self.log_test("Get Categories (Admin)", False, f"Status: {response.status_code if response else 'No response'}")

    def test_products(self):
        """Test product endpoints"""
        # Test public products
        response = self.make_request('GET', 'products')
        if response and response.status_code == 200:
            products = response.json()
            success = isinstance(products, list) and len(products) > 0
            self.log_test("Get Products (Public)", success, f"Found {len(products)} products")
            
            # Test product filtering by category
            if products:
                first_product = products[0]
                category_id = first_product.get('category_id')
                if category_id:
                    response = self.make_request('GET', f'products?category_id={category_id}')
                    if response and response.status_code == 200:
                        filtered_products = response.json()
                        success = isinstance(filtered_products, list)
                        self.log_test("Filter Products by Category", success, f"Found {len(filtered_products)} products in category")
        else:
            self.log_test("Get Products (Public)", False, f"Status: {response.status_code if response else 'No response'}")

        # Test admin products
        if self.admin_token:
            response = self.make_request('GET', 'admin/products', token=self.admin_token)
            if response and response.status_code == 200:
                products = response.json()
                success = isinstance(products, list)
                self.log_test("Get Products (Admin)", success, f"Found {len(products)} products")
            else:
                self.log_test("Get Products (Admin)", False, f"Status: {response.status_code if response else 'No response'}")

    def test_delivery_zones(self):
        """Test delivery zone endpoints"""
        # Test public delivery zones
        response = self.make_request('GET', 'delivery-zones')
        if response and response.status_code == 200:
            zones = response.json()
            success = isinstance(zones, list) and len(zones) > 0
            self.log_test("Get Delivery Zones (Public)", success, f"Found {len(zones)} zones")
        else:
            self.log_test("Get Delivery Zones (Public)", False, f"Status: {response.status_code if response else 'No response'}")

        # Test admin delivery zones
        if self.admin_token:
            response = self.make_request('GET', 'admin/delivery-zones', token=self.admin_token)
            if response and response.status_code == 200:
                zones = response.json()
                success = isinstance(zones, list)
                self.log_test("Get Delivery Zones (Admin)", success, f"Found {len(zones)} zones")
            else:
                self.log_test("Get Delivery Zones (Admin)", False, f"Status: {response.status_code if response else 'No response'}")

    def test_settings(self):
        """Test settings endpoints"""
        # Test public settings
        response = self.make_request('GET', 'settings')
        if response and response.status_code == 200:
            settings = response.json()
            success = isinstance(settings, dict) and 'store_name' in settings
            self.log_test("Get Settings (Public)", success, f"Store name: {settings.get('store_name', 'N/A')}")
        else:
            self.log_test("Get Settings (Public)", False, f"Status: {response.status_code if response else 'No response'}")

        # Test admin settings
        if self.admin_token:
            response = self.make_request('GET', 'admin/settings', token=self.admin_token)
            if response and response.status_code == 200:
                settings = response.json()
                success = isinstance(settings, dict)
                self.log_test("Get Settings (Admin)", success, "Settings retrieved")
            else:
                self.log_test("Get Settings (Admin)", False, f"Status: {response.status_code if response else 'No response'}")

    def test_dashboard_stats(self):
        """Test admin dashboard stats"""
        if not self.admin_token:
            self.log_test("Dashboard Stats", False, "No admin token available")
            return

        response = self.make_request('GET', 'admin/dashboard/stats', token=self.admin_token)
        if response and response.status_code == 200:
            stats = response.json()
            required_keys = ['orders', 'low_stock_count', 'today_orders', 'total_revenue']
            success = all(key in stats for key in required_keys)
            self.log_test("Dashboard Stats", success, f"Stats keys: {list(stats.keys())}")
        else:
            self.log_test("Dashboard Stats", False, f"Status: {response.status_code if response else 'No response'}")

    def test_order_creation(self):
        """Test order creation flow"""
        # First get products and delivery zones
        products_response = self.make_request('GET', 'products')
        zones_response = self.make_request('GET', 'delivery-zones')
        
        if not (products_response and products_response.status_code == 200 and 
                zones_response and zones_response.status_code == 200):
            self.log_test("Order Creation Setup", False, "Failed to get products or zones")
            return

        products = products_response.json()
        zones = zones_response.json()
        
        if not products or not zones:
            self.log_test("Order Creation Setup", False, "No products or zones available")
            return

        # Test pickup order
        pickup_order_data = {
            "customer_name": "Test Customer",
            "customer_phone": "08012345678",
            "items": [{
                "product_id": products[0]['id'],
                "product_name": products[0]['name'],
                "quantity": 1,
                "price": products[0]['price'],
                "unit": products[0]['unit']
            }],
            "fulfillment_type": "pickup",
            "pickup_time": "10:00 AM - 11:00 AM"
        }

        response = self.make_request('POST', 'orders', pickup_order_data)
        if response and response.status_code == 200:
            order = response.json()
            success = 'order' in order and 'order_number' in order['order']
            self.log_test("Create Pickup Order", success, f"Order number: {order.get('order', {}).get('order_number', 'N/A')}")
        else:
            self.log_test("Create Pickup Order", False, f"Status: {response.status_code if response else 'No response'}")

        # Test delivery order
        delivery_order_data = {
            "customer_name": "Test Customer 2",
            "customer_phone": "08087654321",
            "items": [{
                "product_id": products[0]['id'],
                "product_name": products[0]['name'],
                "quantity": 2,
                "price": products[0]['price'],
                "unit": products[0]['unit']
            }],
            "fulfillment_type": "delivery",
            "delivery_zone_id": zones[0]['id'],
            "delivery_address": "123 Test Street, Lagos",
            "delivery_note": "Test delivery note"
        }

        response = self.make_request('POST', 'orders', delivery_order_data)
        if response and response.status_code == 200:
            order = response.json()
            success = 'order' in order and 'order_number' in order['order']
            self.log_test("Create Delivery Order", success, f"Order number: {order.get('order', {}).get('order_number', 'N/A')}")
        else:
            self.log_test("Create Delivery Order", False, f"Status: {response.status_code if response else 'No response'}")

    def test_admin_orders(self):
        """Test admin order management"""
        if not self.admin_token:
            self.log_test("Admin Orders", False, "No admin token available")
            return

        response = self.make_request('GET', 'admin/orders', token=self.admin_token)
        if response and response.status_code == 200:
            orders = response.json()
            success = isinstance(orders, list)
            self.log_test("Get Admin Orders", success, f"Found {len(orders)} orders")
        else:
            self.log_test("Get Admin Orders", False, f"Status: {response.status_code if response else 'No response'}")

    def test_low_stock_products(self):
        """Test low stock products endpoint"""
        if not self.admin_token:
            self.log_test("Low Stock Products", False, "No admin token available")
            return

        response = self.make_request('GET', 'admin/stock/low', token=self.admin_token)
        if response and response.status_code == 200:
            products = response.json()
            success = isinstance(products, list)
            self.log_test("Low Stock Products", success, f"Found {len(products)} low stock products")
        else:
            self.log_test("Low Stock Products", False, f"Status: {response.status_code if response else 'No response'}")

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting FoodNova Backend API Tests")
        print("=" * 50)
        
        # Basic connectivity and setup
        self.test_root_endpoint()
        self.test_seed_data()
        
        # Authentication
        admin_login_success = self.test_admin_login()
        
        # Core functionality
        self.test_categories()
        self.test_products()
        self.test_delivery_zones()
        self.test_settings()
        
        # Admin functionality
        if admin_login_success:
            self.test_dashboard_stats()
            self.test_admin_orders()
            self.test_low_stock_products()
        
        # Order creation
        self.test_order_creation()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = FoodNovaAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())