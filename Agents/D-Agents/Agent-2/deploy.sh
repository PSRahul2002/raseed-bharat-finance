#!/bin/bash

# Receipt Storage and Wallet API Deployment Script
# This script deploys the application to Google Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying Receipt Storage and Wallet API to Google Cloud${NC}"

# Check if required environment variables are set
if [ -z "$GOOGLE_PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: GOOGLE_PROJECT_ID environment variable is not set${NC}"
    echo "Please set it with: export GOOGLE_PROJECT_ID=your-project-id"
    exit 1
fi

if [ -z "$GOOGLE_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  Warning: GOOGLE_API_KEY environment variable is not set${NC}"
    echo "The API will not work without this key"
fi

echo -e "${YELLOW}📋 Project ID: $GOOGLE_PROJECT_ID${NC}"

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required Google Cloud APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com --project=$GOOGLE_PROJECT_ID
gcloud services enable run.googleapis.com --project=$GOOGLE_PROJECT_ID
gcloud services enable firestore.googleapis.com --project=$GOOGLE_PROJECT_ID
gcloud services enable aiplatform.googleapis.com --project=$GOOGLE_PROJECT_ID

# Set up Firestore (if not already done)
echo -e "${YELLOW}🗄️  Setting up Firestore...${NC}"
if ! gcloud firestore databases describe --project=$GOOGLE_PROJECT_ID &>/dev/null; then
    echo "Creating Firestore database..."
    gcloud firestore databases create --region=us-central --project=$GOOGLE_PROJECT_ID
else
    echo "Firestore database already exists"
fi

# Build and deploy using Cloud Build
echo -e "${YELLOW}🏗️  Building and deploying application...${NC}"

# Submit the build
gcloud builds submit \
    --config cloudbuild.yaml \
    --substitutions _GOOGLE_API_KEY="$GOOGLE_API_KEY",_WALLET_ISSUER_ID="$WALLET_ISSUER_ID",_WALLET_CLASS_ID="$WALLET_CLASS_ID" \
    --project=$GOOGLE_PROJECT_ID

# Get the service URL
SERVICE_URL=$(gcloud run services describe receipt-storage-wallet-api \
    --region=us-central1 \
    --project=$GOOGLE_PROJECT_ID \
    --format="value(status.url)")

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Service URL: $SERVICE_URL${NC}"
echo ""
echo -e "${YELLOW}📚 Available endpoints:${NC}"
echo "  - GET  $SERVICE_URL/ (Health check)"
echo "  - POST $SERVICE_URL/store-receipt (Store receipt data)"
echo "  - GET  $SERVICE_URL/receipt/{id} (Get receipt by ID)"
echo "  - GET  $SERVICE_URL/receipts (List receipts)"
echo "  - POST $SERVICE_URL/search-receipts (Search receipts)"
echo ""
echo -e "${YELLOW}🧪 Test the API:${NC}"
echo "curl -X GET $SERVICE_URL/"
echo ""
echo -e "${YELLOW}📖 API Documentation:${NC}"
echo "$SERVICE_URL/docs"
