from fastapi import FastAPI, HTTPException, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import os
import json
import logging
from datetime import datetime, timedelta
import uuid

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Google Cloud imports
from google.cloud import firestore
from google.oauth2 import service_account

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get environment variables
GOOGLE_PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID")
GOOGLE_SERVICE_ACCOUNT_PATH = os.getenv("GOOGLE_SERVICE_ACCOUNT_PATH")

# Initialize Firestore client
try:
    if GOOGLE_SERVICE_ACCOUNT_PATH and os.path.exists(GOOGLE_SERVICE_ACCOUNT_PATH):
        credentials = service_account.Credentials.from_service_account_file(GOOGLE_SERVICE_ACCOUNT_PATH)
        db = firestore.Client(project=GOOGLE_PROJECT_ID, credentials=credentials)
        logger.info("Firestore client initialized with service account")
    else:
        db = firestore.Client(project=GOOGLE_PROJECT_ID)
        logger.info("Firestore client initialized with default credentials")
    
    # Test Firestore connection
    collections = list(db.collections())
    logger.info(f"Firestore connected successfully to project: {GOOGLE_PROJECT_ID}")
except Exception as e:
    logger.error(f"Failed to connect to Firestore: {str(e)}")
    db = None

app = FastAPI(
    title="Receipt Data Fetch API",
    description="API to fetch user-specific receipt data from Google Cloud Firestore for frontend local storage",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReceiptSummary(BaseModel):
    id: str
    vendor_name: Optional[str] = None
    date: Optional[str] = None
    total_amount: Optional[float] = None
    bill_category: Optional[str] = None
    created_at: Optional[str] = None

class ReceiptDetails(BaseModel):
    id: str
    user_id: str
    vendor_name: Optional[str] = None
    date: Optional[str] = None
    timestamp: Optional[str] = None
    total_amount: Optional[float] = None
    taxes: Optional[float] = None
    items: Optional[List[Dict[str, Any]]] = None
    bill_category: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class UserDataResponse(BaseModel):
    success: bool
    user_id: str
    receipts: List[ReceiptSummary]
    total_count: int
    total_amount: float
    categories: Dict[str, int]
    date_range: Dict[str, str]
    timestamp: str
    message: str

class DetailedReceiptResponse(BaseModel):
    success: bool
    receipt: ReceiptDetails
    timestamp: str

class WalletPassSummary(BaseModel):
    pass_id: str
    receipt_id: Optional[str] = None
    pass_url: Optional[str] = None
    created_at: Optional[str] = None
    status: str

class UserWalletPassesResponse(BaseModel):
    success: bool
    user_id: str
    wallet_passes: List[WalletPassSummary]
    total_count: int
    timestamp: str

class FilterOptions(BaseModel):
    category: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    vendor_name: Optional[str] = None

class ErrorResponse(BaseModel):
    error: str
    detail: str
    timestamp: str
    user_id: Optional[str] = None

def validate_email(email: str) -> bool:
    """Basic email validation"""
    return "@" in email and "." in email and len(email) > 5

def serialize_firestore_data(data: dict) -> dict:
    """Convert Firestore data to JSON-serializable format"""
    if isinstance(data, dict):
        return {k: serialize_firestore_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [serialize_firestore_data(item) for item in data]
    elif isinstance(data, datetime):
        return data.isoformat()
    else:
        return data

async def get_user_receipts_from_firestore(user_id: str, filters: Optional[FilterOptions] = None, limit: int = 100) -> List[dict]:
    """Fetch user receipts from Firestore with optional filters"""
    try:
        if not db:
            raise Exception("Firestore client not initialized")
        
        # Start with user filter
        query = db.collection('receipts').where('user_id', '==', user_id)
        
        # Apply additional filters if provided
        if filters:
            if filters.category:
                query = query.where('bill_category', '==', filters.category)
            
            if filters.min_amount is not None:
                query = query.where('total_amount', '>=', filters.min_amount)
            
            if filters.max_amount is not None:
                query = query.where('total_amount', '<=', filters.max_amount)
            
            if filters.start_date:
                query = query.where('date', '>=', filters.start_date)
            
            if filters.end_date:
                query = query.where('date', '<=', filters.end_date)
        
        # Order by creation date (newest first)
        query = query.order_by('created_at', direction=firestore.Query.DESCENDING)
        
        # Limit results
        query = query.limit(limit)
        
        # Execute query
        docs = query.get()
        
        receipts = []
        for doc in docs:
            receipt_data = doc.to_dict()
            # Remove embeddings to reduce payload size
            receipt_data.pop('embeddings', None)
            receipt_data.pop('embedding_metadata', None)
            # Serialize datetime objects
            receipt_data = serialize_firestore_data(receipt_data)
            receipts.append(receipt_data)
        
        logger.info(f"Retrieved {len(receipts)} receipts for user: {user_id}")
        return receipts
        
    except Exception as e:
        logger.error(f"Error fetching user receipts: {str(e)}")
        return []

async def get_receipt_by_id(receipt_id: str, user_id: str) -> Optional[dict]:
    """Get detailed receipt data by ID for a specific user"""
    try:
        if not db:
            raise Exception("Firestore client not initialized")
        
        doc_ref = db.collection('receipts').document(receipt_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return None
        
        receipt_data = doc.to_dict()
        
        # Verify the receipt belongs to the user
        if receipt_data.get('user_id') != user_id:
            logger.warning(f"User {user_id} attempted to access receipt {receipt_id} belonging to {receipt_data.get('user_id')}")
            return None
        
        # Remove embeddings to reduce payload size
        receipt_data.pop('embeddings', None)
        receipt_data.pop('embedding_metadata', None)
        
        # Serialize datetime objects
        receipt_data = serialize_firestore_data(receipt_data)
        
        return receipt_data
        
    except Exception as e:
        logger.error(f"Error fetching receipt {receipt_id}: {str(e)}")
        return None

async def get_user_wallet_passes(user_id: str) -> List[dict]:
    """Get user's wallet passes from Firestore"""
    try:
        if not db:
            raise Exception("Firestore client not initialized")
        
        passes_ref = db.collection('user_wallet_passes')
        query = passes_ref.where('user_id', '==', user_id)
        docs = query.get()
        
        passes = []
        for doc in docs:
            pass_data = doc.to_dict()
            pass_data = serialize_firestore_data(pass_data)
            passes.append(pass_data)
        
        # Sort by created_at in Python since Firestore ordering requires an index
        passes.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        logger.info(f"Retrieved {len(passes)} wallet passes for user: {user_id}")
        return passes
        
    except Exception as e:
        logger.error(f"Error fetching wallet passes: {str(e)}")
        return []

def calculate_user_analytics(receipts: List[dict]) -> Dict[str, Any]:
    """Calculate analytics from user receipts"""
    total_amount = sum(receipt.get('total_amount', 0) for receipt in receipts)
    
    # Category breakdown
    categories = {}
    for receipt in receipts:
        category = receipt.get('bill_category', 'Unknown')
        categories[category] = categories.get(category, 0) + 1
    
    # Date range
    dates = [receipt.get('date') for receipt in receipts if receipt.get('date')]
    date_range = {}
    if dates:
        date_range = {
            'earliest': min(dates),
            'latest': max(dates)
        }
    
    return {
        'total_amount': total_amount,
        'categories': categories,
        'date_range': date_range
    }

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Receipt Data Fetch API is running",
        "status": "healthy",
        "purpose": "Fetch user-specific receipt data for frontend local storage",
        "database": "firestore",
        "services": {
            "firestore": db is not None,
            "project_id": GOOGLE_PROJECT_ID is not None
        },
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for Cloud Run"""
    return {
        "status": "healthy",
        "service": "receipt-data-fetch-api",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/user-data/{user_id}", response_model=UserDataResponse)
async def get_user_data(
    user_id: str = Path(..., description="User's Gmail ID"),
    limit: int = Query(100, description="Maximum number of receipts to fetch"),
    category: Optional[str] = Query(None, description="Filter by bill category"),
    min_amount: Optional[float] = Query(None, description="Minimum amount filter"),
    max_amount: Optional[float] = Query(None, description="Maximum amount filter"),
    start_date: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)")
):
    """
    Fetch all user data (receipts) filtered by user's Gmail ID
    Perfect for frontend local storage - returns optimized JSON data
    """
    try:
        # Validate email format
        if not validate_email(user_id):
            raise HTTPException(
                status_code=400, 
                detail="Invalid email format for user_id"
            )
        
        if not db:
            raise HTTPException(
                status_code=500,
                detail="Firestore not configured"
            )
        
        # Create filter options
        filters = FilterOptions(
            category=category,
            min_amount=min_amount,
            max_amount=max_amount,
            start_date=start_date,
            end_date=end_date
        )
        
        # Fetch user receipts
        receipts = await get_user_receipts_from_firestore(user_id, filters, limit)
        
        # Convert to summary format for frontend
        receipt_summaries = []
        for receipt in receipts:
            summary = ReceiptSummary(
                id=receipt.get('id', ''),
                vendor_name=receipt.get('vendor_name'),
                date=receipt.get('date'),
                total_amount=receipt.get('total_amount'),
                bill_category=receipt.get('bill_category'),
                created_at=receipt.get('created_at')
            )
            receipt_summaries.append(summary)
        
        # Calculate analytics
        analytics = calculate_user_analytics(receipts)
        
        logger.info(f"Successfully fetched data for user: {user_id}")
        
        return UserDataResponse(
            success=True,
            user_id=user_id,
            receipts=receipt_summaries,
            total_count=len(receipt_summaries),
            total_amount=analytics['total_amount'],
            categories=analytics['categories'],
            date_range=analytics['date_range'],
            timestamp=datetime.now().isoformat(),
            message=f"Successfully fetched {len(receipt_summaries)} receipts for local storage"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.get("/receipt-details/{receipt_id}", response_model=DetailedReceiptResponse)
async def get_receipt_details(
    receipt_id: str = Path(..., description="Receipt document ID"),
    user_id: str = Query(..., description="User's Gmail ID for security validation")
):
    """
    Get detailed receipt data by ID with user validation
    Returns complete receipt information for frontend display
    """
    try:
        # Validate email format
        if not validate_email(user_id):
            raise HTTPException(
                status_code=400,
                detail="Invalid email format for user_id"
            )
        
        if not db:
            raise HTTPException(
                status_code=500,
                detail="Firestore not configured"
            )
        
        # Fetch receipt with user validation
        receipt_data = await get_receipt_by_id(receipt_id, user_id)
        
        if not receipt_data:
            raise HTTPException(
                status_code=404,
                detail="Receipt not found or access denied"
            )
        
        # Convert to detailed response model
        receipt_details = ReceiptDetails(**receipt_data)
        
        logger.info(f"Successfully fetched receipt {receipt_id} for user: {user_id}")
        
        return DetailedReceiptResponse(
            success=True,
            receipt=receipt_details,
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching receipt details: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.get("/user-wallet-passes/{user_id}", response_model=UserWalletPassesResponse)
async def get_user_wallet_passes_endpoint(
    user_id: str = Path(..., description="User's Gmail ID")
):
    """
    Get all wallet passes for a specific user
    Returns wallet pass data for frontend management
    """
    try:
        # Validate email format
        if not validate_email(user_id):
            raise HTTPException(
                status_code=400,
                detail="Invalid email format for user_id"
            )
        
        if not db:
            raise HTTPException(
                status_code=500,
                detail="Firestore not configured"
            )
        
        # Fetch wallet passes
        passes = await get_user_wallet_passes(user_id)
        
        # Convert to summary format
        pass_summaries = []
        for pass_data in passes:
            summary = WalletPassSummary(
                pass_id=pass_data.get('pass_id', ''),
                receipt_id=pass_data.get('receipt_id'),
                pass_url=pass_data.get('pass_url'),
                created_at=pass_data.get('created_at'),
                status=pass_data.get('status', 'unknown')
            )
            pass_summaries.append(summary)
        
        logger.info(f"Successfully fetched wallet passes for user: {user_id}")
        
        return UserWalletPassesResponse(
            success=True,
            user_id=user_id,
            wallet_passes=pass_summaries,
            total_count=len(pass_summaries),
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching wallet passes: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.get("/user-analytics/{user_id}")
async def get_user_analytics(
    user_id: str = Path(..., description="User's Gmail ID"),
    days: int = Query(30, description="Number of days to analyze")
):
    """
    Get user spending analytics for the specified period
    Perfect for dashboard components in frontend
    """
    try:
        # Validate email format
        if not validate_email(user_id):
            raise HTTPException(
                status_code=400,
                detail="Invalid email format for user_id"
            )
        
        if not db:
            raise HTTPException(
                status_code=500,
                detail="Firestore not configured"
            )
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Create filter for date range
        filters = FilterOptions(
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d")
        )
        
        # Fetch receipts for the period
        receipts = await get_user_receipts_from_firestore(user_id, filters, 1000)
        
        # Calculate detailed analytics
        analytics = calculate_user_analytics(receipts)
        
        # Add time-based insights
        daily_spending = {}
        monthly_spending = {}
        
        for receipt in receipts:
            date = receipt.get('date')
            amount = receipt.get('total_amount', 0)
            
            if date:
                # Daily spending
                daily_spending[date] = daily_spending.get(date, 0) + amount
                
                # Monthly spending
                month = date[:7]  # YYYY-MM format
                monthly_spending[month] = monthly_spending.get(month, 0) + amount
        
        # Calculate averages
        avg_daily = analytics['total_amount'] / max(days, 1)
        avg_transaction = analytics['total_amount'] / max(len(receipts), 1)
        
        logger.info(f"Successfully calculated analytics for user: {user_id}")
        
        return {
            "success": True,
            "user_id": user_id,
            "period_days": days,
            "total_receipts": len(receipts),
            "total_amount": analytics['total_amount'],
            "average_daily_spending": round(avg_daily, 2),
            "average_transaction_amount": round(avg_transaction, 2),
            "categories": analytics['categories'],
            "daily_spending": daily_spending,
            "monthly_spending": monthly_spending,
            "date_range": analytics['date_range'],
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating analytics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.get("/categories")
async def get_available_categories():
    """
    Get list of available bill categories
    Useful for frontend filter dropdowns
    """
    categories = [
        "Grocery", "Food", "Travel", "OTT", "Fuel", "Electronics", 
        "Healthcare", "Fashion", "Utility Bills", "Entertainment", 
        "Mobile Recharge", "Insurance", "Education", "Home Services", "Others"
    ]
    
    return {
        "success": True,
        "categories": categories,
        "count": len(categories),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/user-summary/{user_id}")
async def get_user_summary(user_id: str = Path(..., description="User's Gmail ID")):
    """
    Get a quick summary of user's data
    Perfect for dashboard headers and overview components
    """
    try:
        # Validate email format
        if not validate_email(user_id):
            raise HTTPException(
                status_code=400,
                detail="Invalid email format for user_id"
            )
        
        if not db:
            raise HTTPException(
                status_code=500,
                detail="Firestore not configured"
            )
        
        # Fetch recent receipts (last 10)
        receipts = await get_user_receipts_from_firestore(user_id, None, 10)
        
        # Get wallet passes count
        passes = await get_user_wallet_passes(user_id)
        
        # Calculate basic stats
        total_receipts_query = db.collection('receipts').where('user_id', '==', user_id)
        total_receipts_count = len(list(total_receipts_query.stream()))
        
        recent_total = sum(receipt.get('total_amount', 0) for receipt in receipts)
        
        # Get most recent receipt
        latest_receipt = receipts[0] if receipts else None
        
        logger.info(f"Successfully generated summary for user: {user_id}")
        
        return {
            "success": True,
            "user_id": user_id,
            "total_receipts": total_receipts_count,
            "recent_receipts_count": len(receipts),
            "recent_total_amount": recent_total,
            "wallet_passes_count": len(passes),
            "latest_receipt": latest_receipt,
            "last_activity": latest_receipt.get('created_at') if latest_receipt else None,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating user summary: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
