#!/bin/bash

# Deployment script for Firebase Hosting
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment process..."

echo "📦 Installing dependencies..."
npm install

echo "🔧 Building application for production..."
npm run build

echo "🔍 Checking if Firebase CLI is installed..."
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

echo "🔐 Checking Firebase authentication..."
firebase projects:list > /dev/null 2>&1 || {
    echo "❌ Not logged in to Firebase. Please run: firebase login"
    exit 1
}

echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo "✅ Deployment complete!"
echo "🌍 Your app is live at: https://spend-analysis-466617.web.app"
echo ""
echo "📝 Post-deployment checklist:"
echo "  1. Test OAuth login functionality"
echo "  2. Verify all API endpoints are working"
echo "  3. Check WebSocket connections"
echo "  4. Test on mobile devices"
