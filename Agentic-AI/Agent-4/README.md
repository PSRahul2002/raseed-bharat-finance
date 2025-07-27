# Receipt Data Fetch API (Agent-4)

This API provides endpoints to fetch user-specific receipt data from Google Cloud Firestore, optimized for frontend local storage.

## Purpose
- Fetch all user receipts filtered by Gmail ID
- Provide detailed receipt information
- Get user analytics and spending insights
- Retrieve wallet passes for users
- Optimized JSON responses for frontend local storage

## Features
- **User-specific data**: All endpoints filter by user's Gmail ID for privacy
- **Optimized payloads**: Removes embeddings and unnecessary data for frontend
- **Analytics**: Spending insights, category breakdowns, time-based analysis
- **Security**: Email validation and user data isolation
- **Frontend-ready**: JSON responses optimized for local storage

## API Endpoints

### Core Data Endpoints
- `GET /user-data/{user_id}` - Fetch all user receipts with optional filters
- `GET /receipt-details/{receipt_id}?user_id=email` - Get detailed receipt data
- `GET /user-wallet-passes/{user_id}` - Get user's wallet passes

### Analytics Endpoints
- `GET /user-analytics/{user_id}?days=30` - Get spending analytics
- `GET /user-summary/{user_id}` - Get quick user summary

### Utility Endpoints
- `GET /categories` - Get available bill categories
- `GET /health` - Health check

## Frontend Integration

### Local Storage Structure
```javascript
// Save user data to localStorage
const userData = await fetch(`/user-data/${userEmail}`).then(r => r.json());
localStorage.setItem('userReceipts', JSON.stringify(userData));

// Retrieve from localStorage
const cachedData = JSON.parse(localStorage.getItem('userReceipts'));
```

### Example Usage
```javascript
// Fetch user data with filters
const receipts = await fetch(`/user-data/user@gmail.com?category=Grocery&limit=50`);

// Get detailed receipt
const receipt = await fetch(`/receipt-details/receipt-id?user_id=user@gmail.com`);

// Get analytics for dashboard
const analytics = await fetch(`/user-analytics/user@gmail.com?days=30`);
```

## Data Models

### UserDataResponse
- `receipts`: Array of receipt summaries
- `total_count`: Total number of receipts
- `total_amount`: Sum of all amounts
- `categories`: Category breakdown
- `date_range`: Earliest and latest dates

### ReceiptDetails
- Complete receipt information including items
- User validation for security
- Serialized timestamps

## Deployment

```bash
# Deploy to Google Cloud Run
chmod +x deploy.sh
./deploy.sh
```

## Environment Variables
- `GOOGLE_PROJECT_ID`: Google Cloud project ID
- `GOOGLE_SERVICE_ACCOUNT_PATH`: Path to service account JSON (optional)
- `PORT`: Server port (default: 8000)

## Security Features
- Email format validation
- User data isolation
- Cross-user access prevention
- Firestore security rules compliance

## Response Optimization
- Removes embeddings from responses
- Serializes Firestore timestamps
- Minimizes payload size for mobile
- Structured for easy localStorage integration
