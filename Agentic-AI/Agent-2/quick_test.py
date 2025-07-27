#!/usr/bin/env python3
"""
Quick manual test for debugging AI processing issues
"""

import requests
import json

# Test just the essential functionality
def test_basic_functionality():
    print("🔧 Testing Basic API Functionality")
    print("=" * 50)
    
    base_url = "http://localhost:8081"
    
    # 1. Health Check
    print("\n1. Testing Health Check...")
    try:
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            data = response.json()
            services = data.get('services', {})
            print(f"✅ Server is running")
            print(f"   Firestore: {'✅' if services.get('firestore') else '❌'}")
            print(f"   Google AI: {'✅' if services.get('google_ai') else '❌'}")
            print(f"   Project ID: {'✅' if services.get('project_id') else '❌'}")
            
            if not all(services.values()):
                print("⚠️  Some services are not configured properly")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        print("   Make sure to run: python main.py")
        return False
    
    # 2. Simple Receipt Test
    print("\n2. Testing Simple Receipt Storage...")
    simple_receipt = {
        "vendor_name": "Test Store",
        "total_amount": 10.00,
        "user_email": "test@test.com"
    }
    
    try:
        response = requests.post(
            f"{base_url}/store-receipt",
            headers={"Content-Type": "application/json"},
            json=simple_receipt
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Receipt stored successfully")
            print(f"   Document ID: {data.get('document_id')}")
            print(f"   Embedding stored: {data.get('embedding_stored')}")
            print(f"   Wallet URL created: {'Yes' if data.get('wallet_pass_url') else 'No'}")
            print(f"   Firestore status: {data.get('firestore_status')}")
            print(f"   AI processing: {data.get('ai_processing_status')}")
            
            if data.get('ai_processing_status') != 'completed':
                print(f"⚠️  AI processing issue: {data.get('ai_processing_status')}")
            
            return data.get('document_id')
        else:
            print(f"❌ Failed to store receipt: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Error: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Receipt storage failed: {e}")
        return None

if __name__ == "__main__":
    print("🚀 Quick API Test")
    print("This will test basic functionality to identify issues")
    print("\nMake sure the server is running: python main.py")
    input("Press Enter to continue...")
    
    test_basic_functionality()
    
    print("\n" + "=" * 50)
    print("🏁 Quick test completed!")
    print("\nIf you see issues:")
    print("1. Check your .env file has all required variables")
    print("2. Verify Google Cloud credentials")
    print("3. Check server logs for detailed errors")
    print("4. Run the comprehensive test: python test_comprehensive.py")
