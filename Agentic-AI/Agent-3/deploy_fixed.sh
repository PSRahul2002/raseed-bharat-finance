#!/bin/bash

# Deploy Expense Query WebSocket API to Google Cloud Run

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
gcloud builds submit \
    --config cloudbuild.yaml \
    --substitutions="_GOOGLE_API_KEY=$GOOGLE_API_KEY,_DATABASE_NAME=$DATABASE_NAME,_COLLECTION_NAME=$COLLECTION_NAME" \
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
