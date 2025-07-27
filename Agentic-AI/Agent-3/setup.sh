#!/bin/bash

# Setup script for Google Cloud deployment
echo "Setting up Google Cloud environment for Expense Query WebSocket API..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: Google Cloud SDK is not installed."
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "You are not authenticated with Google Cloud."
    echo "Please run: gcloud auth login"
    exit 1
fi

# Prompt for project ID if not set
if [ -z "$GOOGLE_PROJECT_ID" ]; then
    echo "Please enter your Google Cloud Project ID:"
    read -r GOOGLE_PROJECT_ID
    export GOOGLE_PROJECT_ID
fi

# Set the project
gcloud config set project $GOOGLE_PROJECT_ID

# Prompt for required environment variables
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "Please enter your Google API Key (for Gemini):"
    read -r GOOGLE_API_KEY
    export GOOGLE_API_KEY
fi

# Optional: Set database configuration
echo "Enter database name (default: receipts):"
read -r DATABASE_NAME
export DATABASE_NAME=${DATABASE_NAME:-"receipts"}

echo "Enter collection name (default: receipts):"
read -r COLLECTION_NAME
export COLLECTION_NAME=${COLLECTION_NAME:-"receipts"}

# Create environment file for local development
cat > .env << EOF
GOOGLE_PROJECT_ID=$GOOGLE_PROJECT_ID
GOOGLE_API_KEY=$GOOGLE_API_KEY
GOOGLE_SERVICE_ACCOUNT_PATH=$(pwd)/service_account.json
DATABASE_NAME=$DATABASE_NAME
COLLECTION_NAME=$COLLECTION_NAME
EOF

echo "Environment variables saved to .env file"

# Make scripts executable
chmod +x enable_apis.sh
chmod +x deploy.sh

echo "Setup completed!"
echo ""
echo "Next steps:"
echo "1. Run ./enable_apis.sh to enable required APIs"
echo "2. Run ./deploy.sh to deploy the application"
echo ""
echo "Or simply run ./deploy.sh - it will enable APIs automatically"
