import requests
import json

# Configuration - Replace with your actual service URL after deployment
BASE_URL = "https://receipt-data-fetch-api-593566622908.us-central1.run.app"
USER_EMAIL = "test@gmail.com"  # Replace with actual Gmail ID

def test_health():
    """Test health endpoint"""
    print("🏥 Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_user_data():
    """Test user data endpoint"""
    print("📊 Testing user data endpoint...")
    response = requests.get(f"{BASE_URL}/user-data/{USER_EMAIL}")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"User: {data['user_id']}")
        print(f"Total receipts: {data['total_count']}")
        print(f"Total amount: ${data['total_amount']:.2f}")
        print(f"Categories: {data['categories']}")
        print(f"First receipt: {data['receipts'][0] if data['receipts'] else 'None'}")
    else:
        print(f"Error: {response.text}")
    print()

def test_user_data_with_filters():
    """Test user data with filters"""
    print("🔍 Testing user data with filters...")
    params = {
        "category": "Grocery",
        "min_amount": 10.0,
        "limit": 5
    }
    response = requests.get(f"{BASE_URL}/user-data/{USER_EMAIL}", params=params)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Filtered receipts: {data['total_count']}")
        print(f"Applied filters: Grocery, min_amount=10.0, limit=5")
    else:
        print(f"Error: {response.text}")
    print()

def test_user_analytics():
    """Test user analytics"""
    print("📈 Testing user analytics...")
    response = requests.get(f"{BASE_URL}/user-analytics/{USER_EMAIL}?days=30")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Period: {data['period_days']} days")
        print(f"Total receipts: {data['total_receipts']}")
        print(f"Total amount: ${data['total_amount']:.2f}")
        print(f"Average daily: ${data['average_daily_spending']:.2f}")
        print(f"Categories: {data['categories']}")
    else:
        print(f"Error: {response.text}")
    print()

def test_user_summary():
    """Test user summary"""
    print("📋 Testing user summary...")
    response = requests.get(f"{BASE_URL}/user-summary/{USER_EMAIL}")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Total receipts: {data['total_receipts']}")
        print(f"Recent receipts: {data['recent_receipts_count']}")
        print(f"Recent total: ${data['recent_total_amount']:.2f}")
        print(f"Wallet passes: {data['wallet_passes_count']}")
        print(f"Last activity: {data['last_activity']}")
    else:
        print(f"Error: {response.text}")
    print()

def test_categories():
    """Test categories endpoint"""
    print("🏷️  Testing categories endpoint...")
    response = requests.get(f"{BASE_URL}/categories")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Available categories ({data['count']}): {data['categories']}")
    else:
        print(f"Error: {response.text}")
    print()

def test_wallet_passes():
    """Test wallet passes endpoint"""
    print("🎫 Testing wallet passes endpoint...")
    response = requests.get(f"{BASE_URL}/user-wallet-passes/{USER_EMAIL}")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Wallet passes: {data['total_count']}")
        if data['wallet_passes']:
            print(f"First pass: {data['wallet_passes'][0]}")
    else:
        print(f"Error: {response.text}")
    print()

def simulate_frontend_usage():
    """Simulate how frontend would use the API"""
    print("🖥️  Simulating frontend usage...")
    
    # 1. Get user summary for dashboard header
    summary_response = requests.get(f"{BASE_URL}/user-summary/{USER_EMAIL}")
    if summary_response.status_code == 200:
        summary = summary_response.json()
        print(f"Dashboard: {summary['total_receipts']} receipts, ${summary['recent_total_amount']:.2f} recent spending")
    
    # 2. Get categories for filter dropdown
    categories_response = requests.get(f"{BASE_URL}/categories")
    if categories_response.status_code == 200:
        categories = categories_response.json()['categories']
        print(f"Filter options: {len(categories)} categories available")
    
    # 3. Get filtered data for current view
    filtered_response = requests.get(f"{BASE_URL}/user-data/{USER_EMAIL}?limit=10")
    if filtered_response.status_code == 200:
        receipts = filtered_response.json()
        print(f"Current view: {receipts['total_count']} receipts loaded")
        
        # Simulate saving to localStorage
        local_storage_data = {
            "user_id": USER_EMAIL,
            "receipts": receipts['receipts'],
            "last_updated": receipts['timestamp']
        }
        print(f"LocalStorage: {len(local_storage_data['receipts'])} receipts cached")
    
    print()

if __name__ == "__main__":
    print("🧪 Testing Receipt Data Fetch API (Agent-4)")
    print(f"Base URL: {BASE_URL}")
    print(f"Test User: {USER_EMAIL}")
    print("=" * 50)
    
    try:
        test_health()
        test_categories()
        test_user_data()
        test_user_data_with_filters()
        test_user_analytics()
        test_user_summary()
        test_wallet_passes()
        simulate_frontend_usage()
        
        print("✅ All tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Make sure the service is deployed and the URL is correct")
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
