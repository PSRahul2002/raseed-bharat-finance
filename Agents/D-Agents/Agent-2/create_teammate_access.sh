#!/bin/bash

# Script to create a new service account for your teammate
# Run this to create separate credentials

PROJECT_ID="spend-analysis-466617"
SERVICE_ACCOUNT_NAME="teammate-access"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🔧 Creating service account for teammate..."

# Create service account
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
    --description="Teammate access for Firestore data" \
    --display-name="Teammate Access"

# Grant necessary roles
echo "🔑 Granting permissions..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/datastore.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/firebase.admin"

# Create and download key
echo "📥 Creating key file..."
gcloud iam service-accounts keys create teammate-service-account.json \
    --iam-account=$SERVICE_ACCOUNT_EMAIL

echo "✅ Service account created!"
echo "📧 Share this file with your teammate: teammate-service-account.json"
echo ""
echo "🔧 Teammate setup instructions:"
echo "1. Save the JSON file securely"
echo "2. Set environment variable: GOOGLE_APPLICATION_CREDENTIALS=path/to/teammate-service-account.json"
echo "3. Use this in their code to access Firestore"
