# Firebase Deployment Guide for Expense Tracker

This guide explains how to deploy your React expense tracker app to Firebase Hosting and configure OAuth for both local and production environments.

## Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- Google Cloud Console access
- Your project already configured locally

## Step 1: Update Google Cloud OAuth Configuration

### 1.1 Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (the one with Client ID: `593566622908-o31jc0t35jc33ldf8e3sssltaubcg7am.apps.googleusercontent.com`)

### 1.2 Update OAuth Client Configuration
1. Navigate to **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID and click the edit icon
3. Update **Authorized JavaScript origins** to include:
   ```
   http://localhost:5173
   http://localhost:4173
   https://spend-analysis-466617.web.app
   https://spend-analysis-466617.firebaseapp.com
   ```

4. Update **Authorized redirect URIs** to include:
   ```
   http://localhost:5173
   http://localhost:4173
   https://spend-analysis-466617.web.app
   https://spend-analysis-466617.firebaseapp.com
   ```

5. Click **Save**

⚠️ **Important**: Wait 5-10 minutes after making these changes for Google's servers to update.

## Step 2: Firebase Project Setup

### 2.1 Initialize Firebase (if not already done)
```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project directory
firebase init hosting
```

Select the following options:
- Use an existing project: `spend-analysis-466617`
- Public directory: `dist`
- Configure as single-page app: `Yes`
- Set up automatic builds and deploys with GitHub: `No` (for now)

### 2.2 Update firebase.json
Your `firebase.json` should look like this:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*",
        "headers": [
          {
            "key": "Cross-Origin-Embedder-Policy",
            "value": "credentialless"
          },
          {
            "key": "Cross-Origin-Opener-Policy",
            "value": "same-origin-allow-popups"
          }
        ]
      }
    ]
  }
}
```

## Step 3: Build and Deploy

### 3.1 Build for Production
```bash
# Build the application
npm run build
```

### 3.2 Test Locally (Optional)
```bash
# Preview the production build locally
npm run preview

# Or use Firebase hosting emulator
firebase serve
```

### 3.3 Deploy to Firebase
```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## Step 4: Environment Configuration

Your app is configured with environment-specific settings:

### Local Development (`.env.local`):
```env
VITE_API_BASE_URL=https://receipt-storage-api-593566622908.us-central1.run.app
VITE_RECEIPT_PROCESSING_URL=https://receipt-categorization-acjxr5nrwa-uc.a.run.app
VITE_WEBSOCKET_URL=wss://expense-query-websocket-api-acjxr5nrwa-uc.a.run.app/ws
VITE_GOOGLE_CLIENT_ID=593566622908-o31jc0t35jc33ldf8e3sssltaubcg7am.apps.googleusercontent.com
```

### Production (`.env.production`):
```env
VITE_API_BASE_URL=https://receipt-storage-api-593566622908.us-central1.run.app
VITE_RECEIPT_PROCESSING_URL=https://receipt-categorization-acjxr5nrwa-uc.a.run.app
VITE_WEBSOCKET_URL=wss://expense-query-websocket-api-acjxr5nrwa-uc.a.run.app/ws
VITE_GOOGLE_CLIENT_ID=593566622908-o31jc0t35jc33ldf8e3sssltaubcg7am.apps.googleusercontent.com
```

## Step 5: Verify Deployment

### 5.1 Test OAuth Integration
1. Visit `https://spend-analysis-466617.web.app`
2. Go to the login page
3. Click "Continue with Google"
4. Verify the authentication flow works

### 5.2 Test Core Features
- [ ] Login/Logout functionality
- [ ] Dashboard loads correctly
- [ ] Add expense functionality
- [ ] Receipt processing (if applicable)
- [ ] WebSocket connection (if applicable)

## Step 6: Ongoing Deployment

### Automated Deployment Script
Create a deployment script for easier future deployments:

```bash
#!/bin/bash
# deploy.sh

echo "Building application for production..."
npm run build

echo "Deploying to Firebase..."
firebase deploy --only hosting

echo "Deployment complete!"
echo "Your app is live at: https://spend-analysis-466617.web.app"
```

Make it executable:
```bash
chmod +x deploy.sh
```

## Troubleshooting

### OAuth Issues
1. **"Invalid origin" error**: Verify your domain is in authorized JavaScript origins
2. **"Redirect URI mismatch"**: Check authorized redirect URIs match exactly
3. **"Access blocked"**: Ensure OAuth consent screen is properly configured

### Firebase Issues
1. **Build fails**: Check all environment variables are set correctly
2. **404 on refresh**: Ensure `rewrites` are configured in `firebase.json`
3. **CORS issues**: Verify API endpoints allow your Firebase domain

### Performance Optimization
1. **Large bundle size**: Consider code splitting and lazy loading
2. **Slow loading**: Implement service worker for caching
3. **API latency**: Consider using Firebase Functions as a proxy

## Security Considerations

1. **Environment Variables**: Never commit sensitive keys to git
2. **CORS Configuration**: Ensure your APIs only allow your domains
3. **OAuth Scopes**: Only request necessary Google permissions
4. **HTTPS Only**: Always use HTTPS in production

## Next Steps

1. Set up Firebase Analytics (optional)
2. Configure Firebase Performance Monitoring
3. Set up continuous deployment with GitHub Actions
4. Implement Firebase Authentication (if you want to replace Google OAuth)
5. Add Firebase Cloud Messaging for notifications

Your app should now be successfully deployed and accessible at:
**https://spend-analysis-466617.web.app**
