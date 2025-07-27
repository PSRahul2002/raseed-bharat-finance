#!/bin/bash

# Quick setup script for Google Cloud Firestore
# This will enable APIs and create the Firestore database

PROJECT_ID="spend-analysis-466617"

echo "🚀 Setting up Firestore for project: $PROJECT_ID"
echo "=============================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please enable APIs manually:"
    echo "   1. Visit: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=$PROJECT_ID"
    echo "   2. Click 'Enable'"
    echo "   3. Then visit: https://console.firebase.google.com/project/$PROJECT_ID/firestore"
    echo "   4. Click 'Create database'"
    echo "   5. Choose 'Start in production mode'"
    echo "   6. Select a location (e.g., us-central1)"
    exit 1
fi

# Set the project
echo "📋 Setting active project..."
gcloud config set project $PROJECT_ID

# Enable Firestore API
echo "🔧 Enabling Cloud Firestore API..."
gcloud services enable firestore.googleapis.com

# Enable other useful APIs
echo "🔧 Enabling Generative AI API..."
gcloud services enable generativelanguage.googleapis.com

echo "🔧 Enabling Vertex AI API..."
gcloud services enable aiplatform.googleapis.com

# Wait a moment
echo "⏳ Waiting for APIs to activate..."
sleep 10

# Create Firestore database (Native mode)
echo "📊 Creating Firestore database..."
gcloud firestore databases create --region=us-central1 --type=firestore-native

echo ""
echo "✅ Setup completed!"
echo ""
echo "🧪 Test your setup:"
echo "   python quick_test.py"
echo ""
echo "📝 Note: If you get permission errors, make sure your service account has the following roles:"
echo "   - Cloud Datastore User"
echo "   - Firebase Admin"
