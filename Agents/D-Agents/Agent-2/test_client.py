#!/usr/bin/env python3
"""
Test client for Receipt Storage and Wallet API
"""

import requests
import json
import time
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8081"  # Change to your deployed URL
# BASE_URL = "https://your-service-url.run.app"

def test_health_check():
    """Test the health check endpoint"""
    print("🏥 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_store_receipt():
    """Test storing a receipt"""
    print("\n💾 Testing receipt storage...")
    
    # Sample receipt data
    receipt_data = {
        "vendor_name": "Tech Store Inc.",
        "date": "2025-01-27",
        "timestamp": "2025-01-27T14:30:00",
        "total_amount": 1299.99,
        "taxes": 104.00,
        "items": [
            {
                "name": "MacBook Pro",
                "quantity": 1,
                "unit_price": 1199.99,
                "category": "Electronics",
                "subcategory": "Computers"
            },
            {
                "name": "USB-C Cable",
                "quantity": 1,
                "unit_price": 29.99,
                "category": "Electronics",
                "subcategory": "Accessories"
            }
        ],
        "bill_category": "Electronics",
        "metadata": {
            "payment_method": "Credit Card",
            "store_location": "Downtown Branch"
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/store-receipt",
            json=receipt_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Receipt stored successfully!")
            print(f"Document ID: {result['document_id']}")
            print(f"Embeddings stored: {result['embedding_stored']}")
            if result['wallet_pass_url']:
                print(f"Wallet pass URL: {result['wallet_pass_url']}")
            return result['document_id']
        else:
            print(f"❌ Failed to store receipt: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Store receipt failed: {e}")
        return None

def test_get_receipt(document_id: str):
    """Test retrieving a receipt by ID"""
    print(f"\n📄 Testing receipt retrieval for ID: {document_id}")
    
    try:
        response = requests.get(f"{BASE_URL}/receipt/{document_id}")
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            receipt = response.json()
            print("✅ Receipt retrieved successfully!")
            print(f"Vendor: {receipt.get('vendor_name', 'N/A')}")
            print(f"Total: ${receipt.get('total_amount', 0):.2f}")
            print(f"Items: {len(receipt.get('items', []))}")
            return True
        else:
            print(f"❌ Failed to retrieve receipt: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Get receipt failed: {e}")
        return False

def test_list_receipts():
    """Test listing receipts"""
    print("\n📋 Testing receipt listing...")
    
    try:
        response = requests.get(f"{BASE_URL}/receipts?limit=5")
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Retrieved {result['count']} receipts")
            
            for i, receipt in enumerate(result['receipts']):
                print(f"  {i+1}. {receipt.get('vendor_name', 'Unknown')} - ${receipt.get('total_amount', 0):.2f}")
            
            return True
        else:
            print(f"❌ Failed to list receipts: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ List receipts failed: {e}")
        return False

def test_search_receipts():
    """Test searching receipts"""
    print("\n🔍 Testing receipt search...")
    
    search_query = "MacBook"
    
    try:
        response = requests.post(
            f"{BASE_URL}/search-receipts",
            params={"query": search_query, "limit": 5}
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result['count']} receipts matching '{search_query}'")
            
            for i, receipt in enumerate(result['results']):
                print(f"  {i+1}. {receipt.get('vendor_name', 'Unknown')} - ${receipt.get('total_amount', 0):.2f}")
            
            return True
        else:
            print(f"❌ Failed to search receipts: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Search receipts failed: {e}")
        return False

def run_tests():
    """Run all tests"""
    print("🧪 Starting Receipt Storage and Wallet API Tests")
    print("=" * 50)
    
    # Test health check
    if not test_health_check():
        print("❌ Health check failed, stopping tests")
        return
    
    # Wait a bit
    time.sleep(1)
    
    # Test storing a receipt
    document_id = test_store_receipt()
    if not document_id:
        print("❌ Receipt storage failed, skipping dependent tests")
        return
    
    # Wait a bit for the document to be stored
    time.sleep(2)
    
    # Test retrieving the receipt
    test_get_receipt(document_id)
    
    # Test listing receipts
    test_list_receipts()
    
    # Test searching receipts
    test_search_receipts()
    
    print("\n" + "=" * 50)
    print("🎉 All tests completed!")

if __name__ == "__main__":
    run_tests()
