"""
Test cases for new FoodNova features:
1. Product search functionality
2. Payment proof upload
"""
import pytest
import requests
import os
import tempfile

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestProductSearch:
    """Test product search functionality"""
    
    def test_search_products_by_name(self):
        """Test searching products by name using query parameter"""
        response = requests.get(f"{BASE_URL}/api/products", params={"search": "rice"})
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify all results contain 'rice' in name (case-insensitive)
        for product in data:
            assert "rice" in product["name"].lower()
            assert "id" in product
            assert "price" in product
    
    def test_search_products_no_results(self):
        """Test search with no matching results"""
        response = requests.get(f"{BASE_URL}/api/products", params={"search": "nonexistentproduct12345"})
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_search_products_partial_match(self):
        """Test partial search matches"""
        response = requests.get(f"{BASE_URL}/api/products", params={"search": "oil"})
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        # Should find oil products
        for product in data:
            assert "oil" in product["name"].lower()
    
    def test_search_products_case_insensitive(self):
        """Test case-insensitive search"""
        response_lower = requests.get(f"{BASE_URL}/api/products", params={"search": "beans"})
        response_upper = requests.get(f"{BASE_URL}/api/products", params={"search": "BEANS"})
        
        assert response_lower.status_code == 200
        assert response_upper.status_code == 200
        
        # Both should return same results
        assert len(response_lower.json()) == len(response_upper.json())
    
    def test_search_products_dedicated_endpoint(self):
        """Test dedicated search endpoint /products/search/{query}"""
        response = requests.get(f"{BASE_URL}/api/products/search/rice")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0


class TestPaymentProofUpload:
    """Test payment proof upload functionality"""
    
    @pytest.fixture
    def test_order_id(self):
        """Get a test order ID"""
        # First create an order
        order_data = {
            "customer_name": "TEST_PaymentProof",
            "customer_phone": "08099999999",
            "items": [{
                "product_id": "2c6f01cf-2d4c-4030-b0ea-88667f37a6f3",
                "product_name": "Local Rice (50kg bag)",
                "quantity": 1,
                "price": 75000.0,
                "unit": "bag"
            }],
            "fulfillment_type": "pickup",
            "pickup_time": "9:00 AM - 10:00 AM"
        }
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        if response.status_code == 200:
            return response.json()["order"]["id"]
        return None
    
    def test_upload_payment_proof_jpg(self, test_order_id):
        """Test uploading JPG payment proof"""
        if not test_order_id:
            pytest.skip("Could not create test order")
        
        # Create a test image file
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
            f.write(b"fake jpg content for testing")
            temp_path = f.name
        
        try:
            with open(temp_path, "rb") as f:
                files = {"file": ("test_proof.jpg", f, "image/jpeg")}
                response = requests.post(
                    f"{BASE_URL}/api/orders/{test_order_id}/payment-proof",
                    files=files
                )
            
            assert response.status_code == 200
            data = response.json()
            assert "payment_proof_url" in data
            assert data["payment_proof_url"].startswith("/api/uploads/")
        finally:
            os.unlink(temp_path)
    
    def test_upload_payment_proof_png(self, test_order_id):
        """Test uploading PNG payment proof"""
        if not test_order_id:
            pytest.skip("Could not create test order")
        
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
            f.write(b"fake png content for testing")
            temp_path = f.name
        
        try:
            with open(temp_path, "rb") as f:
                files = {"file": ("test_proof.png", f, "image/png")}
                response = requests.post(
                    f"{BASE_URL}/api/orders/{test_order_id}/payment-proof",
                    files=files
                )
            
            assert response.status_code == 200
            data = response.json()
            assert "payment_proof_url" in data
        finally:
            os.unlink(temp_path)
    
    def test_upload_payment_proof_pdf(self, test_order_id):
        """Test uploading PDF payment proof"""
        if not test_order_id:
            pytest.skip("Could not create test order")
        
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(b"%PDF-1.4 fake pdf content")
            temp_path = f.name
        
        try:
            with open(temp_path, "rb") as f:
                files = {"file": ("test_proof.pdf", f, "application/pdf")}
                response = requests.post(
                    f"{BASE_URL}/api/orders/{test_order_id}/payment-proof",
                    files=files
                )
            
            assert response.status_code == 200
            data = response.json()
            assert "payment_proof_url" in data
        finally:
            os.unlink(temp_path)
    
    def test_upload_payment_proof_invalid_type(self, test_order_id):
        """Test uploading invalid file type is rejected"""
        if not test_order_id:
            pytest.skip("Could not create test order")
        
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
            f.write(b"invalid file type")
            temp_path = f.name
        
        try:
            with open(temp_path, "rb") as f:
                files = {"file": ("test.txt", f, "text/plain")}
                response = requests.post(
                    f"{BASE_URL}/api/orders/{test_order_id}/payment-proof",
                    files=files
                )
            
            assert response.status_code == 400
            assert "Only JPG, PNG, and PDF" in response.json().get("detail", "")
        finally:
            os.unlink(temp_path)
    
    def test_upload_payment_proof_nonexistent_order(self):
        """Test uploading to non-existent order returns 404"""
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
            f.write(b"fake jpg content")
            temp_path = f.name
        
        try:
            with open(temp_path, "rb") as f:
                files = {"file": ("test.jpg", f, "image/jpeg")}
                response = requests.post(
                    f"{BASE_URL}/api/orders/nonexistent-order-id/payment-proof",
                    files=files
                )
            
            assert response.status_code == 404
        finally:
            os.unlink(temp_path)
    
    def test_get_payment_proof(self, test_order_id):
        """Test getting payment proof URL for an order"""
        if not test_order_id:
            pytest.skip("Could not create test order")
        
        response = requests.get(f"{BASE_URL}/api/orders/{test_order_id}/payment-proof")
        assert response.status_code == 200
        
        data = response.json()
        assert "payment_proof_url" in data


class TestExistingOrderPaymentProof:
    """Test payment proof on existing test order"""
    
    def test_existing_order_has_payment_proof(self):
        """Verify test order FN-260203-4512 has payment proof"""
        response = requests.get(f"{BASE_URL}/api/orders/FN-260203-4512")
        assert response.status_code == 200
        
        data = response.json()
        assert "payment_proof_url" in data
        # Payment proof was uploaded during testing
        if data["payment_proof_url"]:
            assert data["payment_proof_url"].startswith("/api/uploads/")
