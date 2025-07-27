#!/bin/bash

echo "🧪 Testing Expense Query WebSocket API"
echo "======================================"
echo ""

# Test 1: Health Check
echo "1️⃣ Health Check:"
curl -s "https://expense-query-websocket-api-acjxr5nrwa-uc.a.run.app/health" | jq '.'
echo ""

# Test 2: WebSocket Connection Test
echo "2️⃣ WebSocket Test:"
python3 -c "
import asyncio
import websockets
import json

async def quick_test():
    uri = 'wss://expense-query-websocket-api-acjxr5nrwa-uc.a.run.app/ws/test_user_$(date +%s)'
    try:
        async with websockets.connect(uri) as websocket:
            print('✅ WebSocket connected successfully')
            
            # Send test query
            query = {'type': 'query', 'query': 'What are my total expenses?'}
            await websocket.send(json.dumps(query))
            print('📤 Query sent')
            
            # Get responses
            for i in range(8):
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=15)
                    data = json.loads(response)
                    msg_type = data.get('type')
                    if msg_type == 'result':
                        print(f'✅ Final result: {data.get(\"answer\", \"No answer\")}')
                        break
                    elif msg_type == 'error':
                        print(f'❌ Error: {data.get(\"error\")}')
                        break
                    else:
                        print(f'📥 {msg_type}: {data.get(\"message\", \"Processing...\")}')
                except asyncio.TimeoutError:
                    print('⏰ Response timeout')
                    break
    except Exception as e:
        print(f'❌ Connection failed: {e}')

asyncio.run(quick_test())
"

echo ""
echo "3️⃣ Service Info:"
echo "WebSocket URL: wss://expense-query-websocket-api-acjxr5nrwa-uc.a.run.app/ws"
echo "Health Check: https://expense-query-websocket-api-acjxr5nrwa-uc.a.run.app/health"
echo "HTML Client: Open websocket_client.html in your browser"
echo ""
echo "🎉 API Test Complete!"
