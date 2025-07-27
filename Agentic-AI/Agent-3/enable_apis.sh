#!/bin/bash

# Enable required Google Cloud APIs
echo "Enabling required APIs..."

# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Container Registry API
gcloud services enable containerregistry.googleapis.com

# Enable Firestore API
gcloud services enable firestore.googleapis.com

# Enable AI Platform API for Gemini
gcloud services enable generativelanguage.googleapis.com

# Enable Cloud Storage API (often needed for Cloud Build)
gcloud services enable storage.googleapis.com

# Enable Compute Engine API (needed for some Cloud Build operations)
gcloud services enable compute.googleapis.com

# Enable Resource Manager API
gcloud services enable cloudresourcemanager.googleapis.com

# Enable IAM API
gcloud services enable iam.googleapis.com

echo "All required APIs have been enabled."
echo "Note: It may take a few minutes for the APIs to be fully available."
