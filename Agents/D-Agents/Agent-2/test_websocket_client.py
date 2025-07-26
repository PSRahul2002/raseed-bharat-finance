#!/usr/bin/env python3
"""
WebSocket test client for the natural language query WebSocket server
"""

import asyncio
import websockets
import json
import sys

async def test_websocket():
    """Test the WebSocket server"""
    uri = "ws://localhost:8082"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to WebSocket server")
            
            # Listen for welcome message
            welcome = await websocket.recv()
            welcome_data = json.loads(welcome)
            print(f"📝 {welcome_data['message']}")
            
            # Test queries
            test_queries = [
                {
                    "user_id": "user123",
                    "query": "How much did I spend on groceries this month?"
                },
                {
                    "user_id": "user123",
                    "query": "Show me all food expenses above $50"
                }
            ]
            
            for query_data in test_queries:
                print(f"\n🔍 Testing query: {query_data['query']}")
                print("-" * 60)
                
                # Send query
                await websocket.send(json.dumps(query_data))
                
                # Receive responses until we get the final result
                while True:
                    response = await websocket.recv()
                    data = json.loads(response)
                    
                    if data['type'] == 'welcome':
                        continue
                    elif data['type'] == 'status':
                        print(f"⏳ {data['message']}")
                    elif data['type'] == 'filter_generated':
                        print(f"🔍 MongoDB Filter: {data['mongodb_filter']}")
                    elif data['type'] == 'data_fetched':
                        print(f"📊 Found {data['receipts_count']} receipts")
                    elif data['type'] == 'result':
                        print(f"✅ Final Answer: {data['answer']}")
                        print(f"📋 Receipts Count: {data['receipts_count']}")
                        break
                    elif data['type'] == 'error':
                        print(f"❌ Error: {data['message']}")
                        break
                
                print("\n" + "=" * 60)
            
            print("\n✅ All tests completed!")
            
    except websockets.exceptions.ConnectionRefused:
        print("❌ Cannot connect to WebSocket server at ws://localhost:8082")
        print("💡 Make sure the WebSocket server is running:")
        print("   python websocket_server.py")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

async def interactive_websocket():
    """Interactive WebSocket client"""
    uri = "ws://localhost:8082"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to WebSocket server")
            print("Type 'quit' to exit\n")
            
            # Listen for welcome message
            welcome = await websocket.recv()
            welcome_data = json.loads(welcome)
            print(f"📝 {welcome_data['message']}\n")
            
            user_id = input("Enter your User ID: ").strip()
            
            while True:
                query = input("\n🔍 Enter your query (or 'quit' to exit): ").strip()
                
                if query.lower() == 'quit':
                    break
                
                # Send query
                query_data = {"user_id": user_id, "query": query}
                await websocket.send(json.dumps(query_data))
                
                print("\n" + "-" * 50)
                
                # Receive responses
                while True:
                    response = await websocket.recv()
                    data = json.loads(response)
                    
                    if data['type'] == 'status':
                        print(f"⏳ {data['message']}")
                    elif data['type'] == 'filter_generated':
                        print(f"🔍 Filter: {data['mongodb_filter']}")
                    elif data['type'] == 'data_fetched':
                        print(f"📊 Found {data['receipts_count']} receipts")
                    elif data['type'] == 'result':
                        print(f"\n💬 Answer: {data['answer']}")
                        break
                    elif data['type'] == 'error':
                        print(f"❌ Error: {data['message']}")
                        break
                
                print("-" * 50)
            
            print("\n👋 Goodbye!")
            
    except websockets.exceptions.ConnectionRefused:
        print("❌ Cannot connect to WebSocket server at ws://localhost:8082")
        print("💡 Make sure the WebSocket server is running:")
        print("   python websocket_server.py")
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

async def main():
    """Main function"""
    print("🌐 WebSocket Query Client")
    print("=" * 40)
    print("1. Run automated tests")
    print("2. Interactive mode")
    
    choice = input("\nChoose option (1 or 2): ").strip()
    
    if choice == "1":
        await test_websocket()
    elif choice == "2":
        await interactive_websocket()
    else:
        print("Invalid choice. Exiting.")

if __name__ == "__main__":
    asyncio.run(main())
