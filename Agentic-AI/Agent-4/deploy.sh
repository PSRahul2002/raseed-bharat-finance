#!/bin/bash

# Exit on any error
set -e

# Configuration
PROJECT_ID="spend-analysis-466617"
SERVICE_NAME="receipt-data-fetch-api"
REGION="us-central1"

echo "🚀 Deploying Receipt Data Fetch API (Agent-4) to Google Cloud Run..."

# Set the project
echo "Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --source . \
    --region=$REGION \
    --allow-unauthenticated \
    --memory=1Gi \
    --timeout=300 \
    --max-instances=10 \
    --platform=managed \
    --port=8000

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo "✅ Deployment completed successfully!"
echo "📍 Service URL: $SERVICE_URL"
echo "🔍 Health check: $SERVICE_URL/health"
echo "📚 API docs: $SERVICE_URL/docs"
echo ""
echo "📋 Available endpoints:"
echo "  GET /user-data/{user_id} - Fetch all user receipts"
echo "  GET /receipt-details/{receipt_id}?user_id=email - Get detailed receipt"
echo "  GET /user-wallet-passes/{user_id} - Get user wallet passes"
echo "  GET /user-analytics/{user_id} - Get spending analytics"
echo "  GET /user-summary/{user_id} - Get user summary"
echo "  GET /categories - Get available categories"
