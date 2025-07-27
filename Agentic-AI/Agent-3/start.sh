#!/bin/bash

# Startup script for Agent-3 WebSocket Expense Query API

set -e

echo "🚀 Agent-3 WebSocket Expense Query API Startup Script"
echo "===================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your actual configuration values"
    echo "At minimum, you need to set GOOGLE_API_KEY"
    exit 1
fi

# Load environment variables
source .env

# Check for required environment variables
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "❌ Error: GOOGLE_API_KEY is not set in .env file"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

echo "🔧 Activating virtual environment..."
source venv/bin/activate

echo "📦 Installing/updating dependencies..."
pip install -r requirements.txt

# Check MongoDB connection
echo "🔍 Checking MongoDB connection..."
python -c "
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://127.0.0.1:27017/')

try:
    client = MongoClient(mongodb_uri)
    client.admin.command('ping')
    print('✅ MongoDB connection successful')
except Exception as e:
    print(f'❌ MongoDB connection failed: {e}')
    print('Please ensure MongoDB is running and accessible')
    exit(1)
"

echo " Starting WebSocket server..."
echo "📍 WebSocket server will be available at: ws://localhost:8000"
echo "📚 API docs will be available at: http://localhost:8000/docs"
echo "🌐 WebSocket client: Open websocket_client.html in browser"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python main.py
