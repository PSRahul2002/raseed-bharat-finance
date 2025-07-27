#!/bin/bash

#!/bin/bash

# De# Build and deploy using Cloud Build
echo "Building and deploying with Cloud Build..."
gcloud builds submit \
    --config cloudbuild.yaml \
    --substitutions=_GOOGLE_API_KEY="$GOOGLE_API_KEY",_DATABASE_NAME="$DATABASE_NAME",_COLLECTION_NAME="$COLLECTION_NAME" \
    .xpense Query WebSocket API to Google Cloud Run

# Check if required environment variables are set
if [ -z "$GOOGLE_PROJECT_ID" ]; then
    echo "Error: GOOGLE_PROJECT_ID environment variable is not set"
    exit 1
fi

if [ -z "$GOOGLE_API_KEY" ]; then
    echo "Error: GOOGLE_API_KEY environment variable is not set"
    exit 1
fi

# Set default values for database configuration if not provided
export DATABASE_NAME=${DATABASE_NAME:-"receipts"}
export COLLECTION_NAME=${COLLECTION_NAME:-"receipts"}

echo "Setting up Google Cloud project: $GOOGLE_PROJECT_ID"

# Set the project
gcloud config set project $GOOGLE_PROJECT_ID

# Enable required APIs
echo "Enabling required APIs..."
./enable_apis.sh

# Build and deploy using Cloud Build
echo "Building and deploying with Cloud Build..."
gcloud builds submit 
    --config cloudbuild.yaml 
    --substitutions=_GOOGLE_API_KEY="$GOOGLE_API_KEY",_MONGODB_URI="$MONGODB_URI",_DATABASE_NAME="$DATABASE_NAME",_COLLECTION_NAME="$COLLECTION_NAME" 
    .

echo "Deployment completed!"
echo "Getting service URL..."

# Get the service URL
SERVICE_URL=$(gcloud run services describe expense-query-websocket-api --platform managed --region us-central1 --format 'value(status.url)')

if [ -n "$SERVICE_URL" ]; then
    echo "Service deployed successfully!"
    echo "WebSocket URL: ${SERVICE_URL}/ws"
    echo "Health check: ${SERVICE_URL}/health"
    echo ""
    echo "You can test the WebSocket connection at: ${SERVICE_URL}/ws"
else
    echo "Failed to get service URL. Please check the deployment status in the Google Cloud Console."
fi

set -e

echo "🚀 Starting deployment of Agent-3 WebSocket Expense Query API..."

# Check if required environment variables are set
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "❌ Error: GOOGLE_API_KEY environment variable is not set"
    echo "Please set it using: export GOOGLE_API_KEY=your_api_key"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual configuration values"
fi

# Install dependencies
echo "📦 Installing Python dependencies..."
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
    exit(1)
"

# Start the application
echo "🌟 Starting the WebSocket server..."
echo "📍 WebSocket will be available at: ws://localhost:8000"
echo "📚 API docs will be available at: http://localhost:8000/docs"
echo "🌐 Web client: Open websocket_client.html in browser"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python main.py
