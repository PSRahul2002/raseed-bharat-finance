#!/bin/zsh

# Configuration Variables
PROJECT_ID="spend-analysis-466617"
REGION="us-central1"
SERVICE_NAME="receipt-categorization"
MEMORY="1024Mi"
TIMEOUT="300s"

# Ensure gcloud is configured with the right project
gcloud config set project $PROJECT_ID

# Deploy the service directly to Cloud Run
echo "Deploying $SERVICE_NAME to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region=$REGION \
  --project=$PROJECT_ID \
  --allow-unauthenticated \
  --memory=$MEMORY \
  --timeout=$TIMEOUT \
  --cpu=1 \
  --max-instances=10 \
  --port=8080 \
  --platform=managed \
  --min-instances=0 \
  --clear-base-image \
  --set-env-vars=GOOGLE_API_KEY=AIzaSyAdNu-WgqhU8xAc5pmEi1SQHSpshVPxhK4

echo "Deployment completed. Getting service URL..."
gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format="value(status.url)"
