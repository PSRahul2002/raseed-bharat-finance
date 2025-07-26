#!/usr/bin/env python3
"""
Test client for the Receipt Processing API
"""

import requests
import json
import sys
import argparse
from pathlib import Path

def test_health_check(base_url):
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_process_receipt_image(base_url, image_path):
    """Test processing a receipt image"""
    if not Path(image_path).exists():
        print(f"❌ Image file not found: {image_path}")
        return False
    
    try:
        with open(image_path, 'rb') as f:
            files = {'file': (Path(image_path).name, f, 'image/jpeg')}
            response = requests.post(f"{base_url}/process-receipt", files=files)
        
        if response.status_code == 200:
            print("✅ Receipt image processing successful")
            result = response.json()
            print(f"Vendor: {result.get('vendor_name', 'N/A')}")
            print(f"Date: {result.get('date', 'N/A')}")
            print(f"Total: ${result.get('total_amount', 0)}")
            print(f"Bill Category: {result.get('bill_category', 'N/A')}")
            print(f"Items: {len(result.get('items', []))}")
            return True
        else:
            print(f"❌ Receipt processing failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Receipt processing error: {e}")
        return False

def test_process_receipt_json(base_url):
    """Test processing receipt JSON data"""
    test_data = {
        "vendor_name": "Test Store",
        "date": "2025-07-27",
        "total_amount": 150.00,
        "taxes": 15.00,
        "items": [
            {"name": "Coffee", "quantity": 2, "unit_price": 4.50},
            {"name": "Sandwich", "quantity": 1, "unit_price": 12.00}
        ]
    }
    
    try:
        response = requests.post(
            f"{base_url}/process-receipt-json",
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            print("✅ Receipt JSON processing successful")
            result = response.json()
            print(f"Vendor: {result.get('vendor_name', 'N/A')}")
            print(f"Bill Category: {result.get('bill_category', 'N/A')}")
            print("Items with categories:")
            for item in result.get('items', []):
                print(f"  - {item.get('name')}: {item.get('category', 'N/A')} -> {item.get('subcategory', 'N/A')}")
            return True
        else:
            print(f"❌ Receipt JSON processing failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Receipt JSON processing error: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Test Receipt Processing API')
    parser.add_argument('--url', default='http://localhost:8080', 
                       help='Base URL of the API (default: http://localhost:8080)')
    parser.add_argument('--image', help='Path to receipt image file for testing')
    parser.add_argument('--health-only', action='store_true', 
                       help='Only run health check')
    
    args = parser.parse_args()
    
    base_url = args.url.rstrip('/')
    
    print(f"Testing Receipt Processing API at: {base_url}")
    print("-" * 50)
    
    # Test health check
    if not test_health_check(base_url):
        print("❌ API is not healthy, stopping tests")
        sys.exit(1)
    
    if args.health_only:
        print("✅ Health check only - completed successfully")
        return
    
    print()
    
    # Test JSON processing
    print("Testing receipt JSON processing...")
    test_process_receipt_json(base_url)
    print()
    
    # Test image processing if image provided
    if args.image:
        print("Testing receipt image processing...")
        test_process_receipt_image(base_url, args.image)
    else:
        print("ℹ️  To test image processing, provide --image /path/to/receipt.jpg")
    
    print()
    print("🎉 Testing completed!")

if __name__ == "__main__":
    main()
