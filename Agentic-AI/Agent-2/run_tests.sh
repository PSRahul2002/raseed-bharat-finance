#!/bin/bash

# Quick test script for Receipt Storage API
# This script will start the server and run comprehensive tests

echo "🚀 Starting Receipt Storage API Test Suite"
echo "=========================================="

# Check if virtual environment is activated
if [[ "$VIRTUAL_ENV" != "" ]]; then
    echo "✅ Virtual environment is active: $VIRTUAL_ENV"
else
    echo "⚠️  Activating virtual environment..."
    source .venv/bin/activate
fi

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ Environment file found"
else
    echo "❌ .env file not found! Please create it with required variables:"
    echo "   GOOGLE_API_KEY=your_api_key"
    echo "   GOOGLE_PROJECT_ID=your_project_id"
    echo "   GOOGLE_SERVICE_ACCOUNT_PATH=path_to_service_account.json"
    exit 1
fi

# Start the server in background
echo "🌐 Starting API server..."
python main.py &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Server started successfully (PID: $SERVER_PID)"
else
    echo "❌ Failed to start server"
    exit 1
fi

# Run comprehensive tests
echo "🧪 Running comprehensive tests..."
python test_comprehensive.py

# Ask user if they want to keep server running
echo ""
read -p "Keep server running for manual testing? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "🛑 Stopping server..."
    kill $SERVER_PID
    echo "✅ Server stopped"
else
    echo "🌐 Server is running at http://localhost:8081"
    echo "📖 API documentation available at http://localhost:8081/docs"
    echo "🔍 Health check: http://localhost:8081/"
    echo ""
    echo "To stop the server later, run: kill $SERVER_PID"
fi

echo "🏁 Test suite completed!"
