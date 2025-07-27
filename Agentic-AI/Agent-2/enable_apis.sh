#!/bin/bash

# Script to enable all required Google Cloud APIs for the Receipt Storage project
# Run this after setting up your Google Cloud project

PROJECT_ID="spend-analysis-466617"

echo "🔧 Enabling Google Cloud APIs for project: $PROJECT_ID"
echo "=================================================="

# Set the project
echo "Setting active project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "Enabling Cloud Firestore API..."
gcloud services enable firestore.googleapis.com

echo "Enabling Generative AI API..."
gcloud services enable generativelanguage.googleapis.com

echo "Enabling Vertex AI API..."
gcloud services enable aiplatform.googleapis.com

echo "Enabling Cloud Run API (for deployment)..."
gcloud services enable run.googleapis.com

echo "Enabling Cloud Build API (for deployment)..."
gcloud services enable cloudbuild.googleapis.com

echo "Enabling Container Registry API..."
gcloud services enable containerregistry.googleapis.com

echo ""
echo "✅ All APIs enabled! Wait 2-3 minutes for changes to propagate."
echo ""
echo "Next steps:"
echo "1. Wait a few minutes"
echo "2. Run: python quick_test.py"
echo "3. If successful, run: python test_comprehensive.py"
