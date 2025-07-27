# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for your Raseed finance app.

## Prerequisites

- A Google account
- Access to the Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "Raseed Finance App")
4. Click "Create"

## Step 2: Enable Google Identity Services

1. In your Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Identity" or "Google Sign-In"
3. Enable the "Google Identity and Access Management (IAM) API"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (unless you have a Google Workspace account)
3. Fill in the required information:
   - **App name**: Raseed Finance Assistant
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes (optional for basic login):
   - `email`
   - `profile`
   - `openid`
5. Save and continue through the steps

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Select "Web application"
4. Configure the client:
   - **Name**: Raseed Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (for Vite development server)
     - `http://localhost:4173` (for Vite preview)
     - `https://spend-analysis-466617.web.app` (for Firebase production)
     - `https://spend-analysis-466617.firebaseapp.com` (Firebase alternative domain)
   - **Authorized redirect URIs**:
     - `http://localhost:5173` (for Vite development server)
     - `http://localhost:4173` (for Vite preview)
     - `https://spend-analysis-466617.web.app` (for Firebase production)
     - `https://spend-analysis-466617.firebaseapp.com` (Firebase alternative domain)
5. Click "Create"
6. Copy the **Client ID** (it looks like: `123456789-abcdefghijk.apps.googleusercontent.com`)

## Step 5: Update Environment Variables

1. Open your `.env.local` file
2. Replace the placeholder with your actual Client ID:
   ```env
   VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
   ```

## Step 6: Test the Integration

1. Restart your development server:
   ```bash
   npm run dev
   ```
2. Go to the login page
3. Click "Continue with Google"
4. Complete the Google authentication flow

## Important Security Notes

- **Never commit your Client ID to public repositories** if it contains sensitive information
- For production, ensure your domain is properly configured in the authorized origins
- Consider implementing additional security measures like CSRF protection

## Troubleshooting

### Common Issues

1. **"Invalid client" error**:
   - Check that your Client ID is correct
   - Verify the authorized origins include your current domain

2. **"Redirect URI mismatch" or "origin_mismatch"**:
   - Check what port your development server is actually running on (e.g., 8081 instead of 5173)
   - Ensure your current URL is listed in authorized JavaScript origins
   - Wait 5-10 minutes after making changes for Google's servers to update
   - Check for typos in the URLs

3. **"Access blocked" error**:
   - Complete the OAuth consent screen setup
   - Add test users if your app is in testing mode

4. **Google button not rendering**:
   - Check browser console for JavaScript errors
   - Verify the Google Identity Services script is loaded
   - Ensure your Client ID is properly set in environment variables

### Testing Checklist

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] Client ID created and copied
- [ ] Environment variable updated
- [ ] Development server restarted
- [ ] Google button appears on login page
- [ ] Authentication flow completes successfully
- [ ] User information is correctly extracted

## Additional Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Best Practices](https://developers.google.com/identity/protocols/oauth2)
