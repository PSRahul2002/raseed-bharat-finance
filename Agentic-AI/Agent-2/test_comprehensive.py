#!/usr/bin/env python3
"""
Comprehensive test suite for Receipt Storage and Wallet API
Tests all endpoints and error conditions
"""

import requests
import json
import time
from datetime import datetime
import sys

# API Configuration
BASE_URL = "http://localhost:8081"
HEADERS = {"Content-Type": "application/json"}

# Test Data
SAMPLE_RECEIPT = {
    "vendor_name": "Starbucks Coffee",
    "date": "2025-07-27",
    "total_amount": 15.75,
    "taxes": 1.25,
    "bill_category": "Food & Beverage",
    "user_email": "test@example.com",
    "items": [
        {"name": "Latte", "price": 5.50, "quantity": 1},
        {"name": "Sandwich", "price": 8.00, "quantity": 1},
        {"name": "Cookie", "price": 2.25, "quantity": 1}
    ],
    "metadata": {
        "payment_method": "Credit Card",
        "location": "Downtown Store"
    }
}

SAMPLE_RECEIPT_NO_EMAIL = {
    "vendor_name": "Target",
    "date": "2025-07-27",
    "total_amount": 45.99,
    "taxes": 3.68,
    "bill_category": "Shopping"
}

def print_test_header(test_name):
    """Print formatted test header"""
    print(f"\n{'='*60}")
    print(f"Testing: {test_name}")
    print(f"{'='*60}")

def print_result(success, message, details=None):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    if details:
        print(f"Details: {details}")
    print("-" * 60)

def test_health_check():
    """Test health check endpoints"""
    print_test_header("Health Check Endpoints")
    
    try:
        # Test root endpoint
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Root endpoint accessible", f"Status: {data.get('status')}")
            
            # Check service statuses
            services = data.get('services', {})
            print(f"Service Status:")
            print(f"  - Firestore: {'✅' if services.get('firestore') else '❌'}")
            print(f"  - Google AI: {'✅' if services.get('google_ai') else '❌'}")
            print(f"  - Project ID: {'✅' if services.get('project_id') else '❌'}")
        else:
            print_result(False, "Root endpoint failed", f"Status: {response.status_code}")
        
        # Test health endpoint
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print_result(True, "Health endpoint accessible")
        else:
            print_result(False, "Health endpoint failed", f"Status: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print_result(False, "Server not running", "Please start the server first")
        return False
    except Exception as e:
        print_result(False, "Health check failed", str(e))
        return False
    
    return True

def test_store_receipt_with_email():
    """Test storing receipt with user email"""
    print_test_header("Store Receipt with User Email")
    
    try:
        response = requests.post(
            f"{BASE_URL}/store-receipt",
            headers=HEADERS,
            json=SAMPLE_RECEIPT
        )
        
        if response.status_code == 200:
            data = response.json()
            document_id = data.get('document_id')
            wallet_url = data.get('wallet_pass_url')
            
            print_result(True, "Receipt stored successfully")
            print(f"Document ID: {document_id}")
            print(f"Embedding stored: {data.get('embedding_stored')}")
            print(f"Wallet URL: {wallet_url[:50]}..." if wallet_url else "No wallet URL")
            print(f"Firestore status: {data.get('firestore_status')}")
            print(f"AI processing status: {data.get('ai_processing_status')}")
            
            return document_id
        else:
            error_data = response.json() if response.headers.get('content-type') == 'application/json' else response.text
            print_result(False, f"Failed to store receipt", f"Status: {response.status_code}, Error: {error_data}")
            return None
            
    except Exception as e:
        print_result(False, "Store receipt test failed", str(e))
        return None

def test_store_receipt_without_email():
    """Test storing receipt without user email"""
    print_test_header("Store Receipt without User Email")
    
    try:
        response = requests.post(
            f"{BASE_URL}/store-receipt",
            headers=HEADERS,
            json=SAMPLE_RECEIPT_NO_EMAIL
        )
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Receipt without email stored successfully")
            return data.get('document_id')
        else:
            error_data = response.json() if response.headers.get('content-type') == 'application/json' else response.text
            print_result(False, "Failed to store receipt without email", f"Status: {response.status_code}, Error: {error_data}")
            return None
            
    except Exception as e:
        print_result(False, "Store receipt without email test failed", str(e))
        return None

def test_get_receipt(document_id):
    """Test retrieving a receipt by ID"""
    print_test_header("Get Receipt by ID")
    
    if not document_id:
        print_result(False, "No document ID provided", "Skipping test")
        return
    
    try:
        response = requests.get(f"{BASE_URL}/receipt/{document_id}")
        
        if response.status_code == 200:
            data = response.json()
            print_result(True, "Receipt retrieved successfully")
            print(f"Vendor: {data.get('vendor_name')}")
            print(f"Amount: ${data.get('total_amount')}")
            print(f"Has embeddings: {'embeddings' in data}")
        elif response.status_code == 404:
            print_result(False, "Receipt not found", "Document may not exist in database")
        else:
            print_result(False, "Failed to retrieve receipt", f"Status: {response.status_code}")
            
    except Exception as e:
        print_result(False, "Get receipt test failed", str(e))

def test_list_receipts():
    """Test listing receipts"""
    print_test_header("List Receipts")
    
    try:
        response = requests.get(f"{BASE_URL}/receipts?limit=5")
        
        if response.status_code == 200:
            data = response.json()
            receipts = data.get('receipts', [])
            print_result(True, f"Retrieved {len(receipts)} receipts")
            
            for i, receipt in enumerate(receipts[:3]):  # Show first 3
                print(f"  {i+1}. {receipt.get('vendor_name', 'Unknown')} - ${receipt.get('total_amount', 0)}")
        else:
            print_result(False, "Failed to list receipts", f"Status: {response.status_code}")
            
    except Exception as e:
        print_result(False, "List receipts test failed", str(e))

def test_search_receipts():
    """Test searching receipts"""
    print_test_header("Search Receipts")
    
    try:
        # Search for coffee
        response = requests.post(
            f"{BASE_URL}/search-receipts?query=coffee&limit=5",
            headers=HEADERS
        )
        
        if response.status_code == 200:
            data = response.json()
            results = data.get('results', [])
            print_result(True, f"Search returned {len(results)} results for 'coffee'")
        else:
            print_result(False, "Failed to search receipts", f"Status: {response.status_code}")
            
    except Exception as e:
        print_result(False, "Search receipts test failed", str(e))

def test_user_wallet_passes():
    """Test retrieving user wallet passes"""
    print_test_header("User Wallet Passes")
    
    try:
        user_email = "test@example.com"
        response = requests.get(f"{BASE_URL}/user-wallet-passes/{user_email}")
        
        if response.status_code == 200:
            data = response.json()
            passes = data.get('wallet_passes', [])
            print_result(True, f"Retrieved {len(passes)} wallet passes for {user_email}")
            
            for i, pass_data in enumerate(passes[:3]):  # Show first 3
                print(f"  {i+1}. Pass ID: {pass_data.get('pass_id', 'Unknown')}")
                print(f"     Created: {pass_data.get('created_at', 'Unknown')}")
        else:
            print_result(False, "Failed to get user wallet passes", f"Status: {response.status_code}")
            
    except Exception as e:
        print_result(False, "User wallet passes test failed", str(e))

def test_error_conditions():
    """Test various error conditions"""
    print_test_header("Error Condition Tests")
    
    # Test invalid JSON
    try:
        response = requests.post(
            f"{BASE_URL}/store-receipt",
            headers=HEADERS,
            data="invalid json"
        )
        if response.status_code in [400, 422]:
            print_result(True, "Invalid JSON properly rejected")
        else:
            print_result(False, "Invalid JSON not properly handled", f"Status: {response.status_code}")
    except Exception as e:
        print_result(False, "Invalid JSON test failed", str(e))
    
    # Test missing receipt endpoint
    try:
        response = requests.get(f"{BASE_URL}/receipt/nonexistent-id")
        if response.status_code == 404:
            print_result(True, "Non-existent receipt properly returns 404")
        else:
            print_result(False, "Non-existent receipt not handled properly", f"Status: {response.status_code}")
    except Exception as e:
        print_result(False, "Non-existent receipt test failed", str(e))

def run_diagnostic_check():
    """Run diagnostic checks to identify issues"""
    print_test_header("Diagnostic Checks")
    
    # Check if server is responding
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        health_data = response.json()
        services = health_data.get('services', {})
        
        print("🔍 Service Diagnostics:")
        print(f"  Firestore connected: {'✅' if services.get('firestore') else '❌'}")
        print(f"  Google AI configured: {'✅' if services.get('google_ai') else '❌'}")
        print(f"  Project ID set: {'✅' if services.get('project_id') else '❌'}")
        
        if not services.get('firestore'):
            print("\n⚠️  FIRESTORE ISSUE DETECTED:")
            print("   - Check GOOGLE_PROJECT_ID in .env")
            print("   - Check GOOGLE_SERVICE_ACCOUNT_PATH in .env")
            print("   - Verify service account has Firestore permissions")
        
        if not services.get('google_ai'):
            print("\n⚠️  GOOGLE AI ISSUE DETECTED:")
            print("   - Check GOOGLE_API_KEY in .env")
            print("   - Verify API key has Gemini API access")
        
        if not services.get('project_id'):
            print("\n⚠️  PROJECT ID ISSUE DETECTED:")
            print("   - Check GOOGLE_PROJECT_ID in .env")
        
    except requests.exceptions.ConnectionError:
        print("❌ Server is not running")
        print("   Run: python main.py")
    except Exception as e:
        print(f"❌ Diagnostic check failed: {e}")

def main():
    """Run all tests"""
    print("🧪 Starting Comprehensive API Tests")
    print(f"Testing API at: {BASE_URL}")
    print(f"Time: {datetime.now().isoformat()}")
    
    # Run diagnostic check first
    run_diagnostic_check()
    
    # Check if server is accessible
    if not test_health_check():
        print("\n❌ Server not accessible. Please start the server and try again.")
        print("Run: python main.py")
        sys.exit(1)
    
    # Run main tests
    document_id = test_store_receipt_with_email()
    test_store_receipt_without_email()
    test_get_receipt(document_id)
    test_list_receipts()
    test_search_receipts()
    test_user_wallet_passes()
    test_error_conditions()
    
    print(f"\n{'='*60}")
    print("🏁 Test Suite Completed")
    print(f"{'='*60}")
    
    print("\n📋 Next Steps:")
    print("1. Review any failed tests above")
    print("2. Check server logs for detailed error messages")
    print("3. Verify environment variables in .env file")
    print("4. Test the wallet pass URLs in a browser")

if __name__ == "__main__":
    main()
