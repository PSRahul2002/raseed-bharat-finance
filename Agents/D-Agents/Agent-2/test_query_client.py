#!/usr/bin/env python3
"""
Test client for the natural language query API endpoint
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API configuration
API_BASE_URL = "http://localhost:8081"
QUERY_ENDPOINT = f"{API_BASE_URL}/query-receipts"

def test_query_api():
    """Test the query receipts API endpoint"""
    
    # Test cases
    test_cases = [
        {
            "user_id": "user123",
            "query": "How much did I spend on groceries this month?"
        },
        {
            "user_id": "user123", 
            "query": "Show me all food expenses above $50"
        },
        {
            "user_id": "user123",
            "query": "What are my travel expenses?"
        },
        {
            "user_id": "user123",
            "query": "List all receipts from last week"
        }
    ]
    
    print("🧪 Testing Natural Language Query API")
    print("=" * 60)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📝 Test Case {i}:")
        print(f"User ID: {test_case['user_id']}")
        print(f"Query: {test_case['query']}")
        print("-" * 40)
        
        try:
            # Make API request
            response = requests.post(
                QUERY_ENDPOINT,
                json=test_case,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Request successful!")
                print(f"📊 Found {result['receipts_count']} receipts")
                print(f"🔍 MongoDB Filter: {result['mongodb_filter']}")
                print(f"💬 Answer: {result['answer']}")
            else:
                print(f"❌ Request failed with status code: {response.status_code}")
                print(f"Error: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Connection error. Make sure the API server is running at http://localhost:8081")
        except Exception as e:
            print(f"❌ Error: {str(e)}")
        
        print()

def test_health_check():
    """Test if the API is running"""
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            print("✅ API is running and healthy")
            return True
        else:
            print(f"⚠️ API responded with status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API. Make sure it's running at http://localhost:8081")
        return False

def interactive_query():
    """Interactive query mode"""
    print("\n🎯 Interactive Query Mode")
    print("Type 'quit' to exit")
    print("-" * 40)
    
    user_id = input("Enter your User ID: ").strip()
    
    while True:
        query = input("\n🔍 Enter your query (or 'quit' to exit): ").strip()
        
        if query.lower() == 'quit':
            break
            
        try:
            response = requests.post(
                QUERY_ENDPOINT,
                json={"user_id": user_id, "query": query},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"\n📊 Found {result['receipts_count']} receipts")
                print(f"💬 Answer: {result['answer']}")
            else:
                print(f"❌ Error: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Connection error. Make sure the API server is running.")
            break
        except Exception as e:
            print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("🚀 Query API Test Client")
    print("=" * 60)
    
    # Check if API is running
    if not test_health_check():
        print("\n💡 To start the API server, run:")
        print("   python main.py")
        print("   # or")
        print("   ./run_dev.sh")
        exit(1)
    
    print("\nChoose an option:")
    print("1. Run automated tests")
    print("2. Interactive query mode")
    print("3. Both")
    
    choice = input("\nEnter your choice (1-3): ").strip()
    
    if choice in ["1", "3"]:
        test_query_api()
    
    if choice in ["2", "3"]:
        interactive_query()
    
    print("\n👋 Test complete!")
