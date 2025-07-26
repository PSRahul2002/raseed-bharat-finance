from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import json
import logging
from datetime import datetime, timedelta
import uuid
import base64
import hashlib
import hmac

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Google Cloud and AI imports
import google.generativeai as genai
from google.cloud import firestore
from google.cloud import aiplatform
from google.auth.transport.requests import Request
from google.oauth2 import service_account
import requests

# MongoDB imports
from pymongo import MongoClient
import ast
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get environment variables
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID")
GOOGLE_SERVICE_ACCOUNT_PATH = os.getenv("GOOGLE_SERVICE_ACCOUNT_PATH")
WALLET_ISSUER_ID = os.getenv("WALLET_ISSUER_ID")
WALLET_CLASS_ID = os.getenv("WALLET_CLASS_ID")

# Configure Google AI
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    logger.info("Google AI configured successfully")
else:
    logger.error("GOOGLE_API_KEY not found in environment variables")

# Initialize Firestore client
try:
    if GOOGLE_SERVICE_ACCOUNT_PATH and os.path.exists(GOOGLE_SERVICE_ACCOUNT_PATH):
        credentials = service_account.Credentials.from_service_account_file(GOOGLE_SERVICE_ACCOUNT_PATH)
        db = firestore.Client(project=GOOGLE_PROJECT_ID, credentials=credentials)
        logger.info("Firestore client initialized with service account")
    else:
        db = firestore.Client(project=GOOGLE_PROJECT_ID)
        logger.info("Firestore client initialized with default credentials")
except Exception as e:
    logger.error(f"Failed to initialize Firestore client: {str(e)}")
    db = None

# Initialize MongoDB client
try:
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/")
    mongo_client = MongoClient(MONGODB_URI)
    mongo_db = mongo_client["raseed"]
    mongo_collection = mongo_db["receipts"]
    logger.info("MongoDB client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize MongoDB client: {str(e)}")
    mongo_client = None
    mongo_db = None
    mongo_collection = None

# Initialize Vertex AI
try:
    if GOOGLE_PROJECT_ID:
        aiplatform.init(project=GOOGLE_PROJECT_ID, location="us-central1")
        logger.info("Vertex AI initialized successfully")
    else:
        logger.error("GOOGLE_PROJECT_ID not found for Vertex AI initialization")
except Exception as e:
    logger.error(f"Failed to initialize Vertex AI: {str(e)}")

app = FastAPI(
    title="Receipt Storage and Wallet API",
    description="API to store receipt data in MongoDB, create embeddings, and generate Google Wallet passes",
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

class ReceiptData(BaseModel):
    vendor_name: Optional[str] = None
    date: Optional[str] = None
    timestamp: Optional[str] = None
    total_amount: Optional[float] = None
    taxes: Optional[float] = None
    items: Optional[List[Dict[str, Any]]] = None
    bill_category: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    user_email: Optional[str] = None  # Optional for wallet pass personalization

class StorageResponse(BaseModel):
    success: bool
    document_id: str
    embedding_stored: bool
    wallet_pass_url: Optional[str] = None
    message: str
    timestamp: str
    firestore_status: str
    ai_processing_status: str

class QueryRequest(BaseModel):
    user_id: str
    query: str

class QueryResponse(BaseModel):
    success: bool
    answer: str
    mongodb_filter: Dict[str, Any]
    receipts_count: int
    timestamp: str

class ErrorResponse(BaseModel):
    error: str
    detail: str
    timestamp: str
    error_code: Optional[str] = None

class WalletPassData(BaseModel):
    title: str
    vendor: str
    amount: float
    date: str
    category: str
    pass_id: str

def generate_embeddings(text: str) -> List[float]:
    """Generate embeddings using Google's text embedding model"""
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Create a prompt for embedding generation
        embedding_prompt = f"Generate a semantic representation for this receipt data: {text}"
        
        # For now, we'll use a simple hash-based approach since Gemini doesn't directly provide embeddings
        # In production, you'd use Vertex AI's text embedding models
        import hashlib
        text_hash = hashlib.md5(text.encode()).hexdigest()
        
        # Convert hash to pseudo-embedding (768 dimensions)
        embedding = []
        for i in range(0, len(text_hash), 2):
            hex_pair = text_hash[i:i+2]
            embedding.append(int(hex_pair, 16) / 255.0)
        
        # Pad to 768 dimensions
        while len(embedding) < 768:
            embedding.extend(embedding[:min(len(embedding), 768 - len(embedding))])
        
        return embedding[:768]
        
    except Exception as e:
        logger.error(f"Error generating embeddings: {str(e)}")
        # Return zero vector as fallback
        return [0.0] * 768

def store_in_firestore(data: dict) -> str:
    """Store receipt data in Firestore (MongoDB alternative on Google Cloud)"""
    try:
        if not db:
            raise Exception("Firestore client not initialized")
        
        # Add metadata
        document_data = {
            **data,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "id": str(uuid.uuid4())
        }
        
        # Store in receipts collection
        doc_ref = db.collection('receipts').document(document_data["id"])
        doc_ref.set(document_data)
        
        logger.info(f"Document stored in Firestore with ID: {document_data['id']}")
        return document_data["id"]
        
    except Exception as e:
        logger.error(f"Error storing data in Firestore: {str(e)}")
        raise

def extract_code_block(text: str) -> str:
    """Extract code block from Gemini response"""
    # Remove triple backticks and optional language specifier from start and end
    code = re.sub(r"^```[a-zA-Z]*\s*|```$", "", text.strip(), flags=re.MULTILINE)
    return code.strip()

def generate_mongo_filter(user_id: str, query: str, model) -> Dict[str, Any]:
    """Generate MongoDB filter using Gemini AI"""
    prompt = f"""
You are an assistant that helps generate MongoDB queries for an expense tracking app.

The MongoDB collection "receipts" has documents with this schema:
{{
  _id: ObjectId,
  user_id: string,
  vendor_name: string,
  category: string,
  sub_category: string,
  items: [string],
  total_price: number,
  date: string (YYYY-MM-DD)
}}

Main categories: Grocery, Food, Travel, OTT, Fuel, Electronics, Healthcare, Fashion, Utility Bills, Entertainment, Mobile Recharge, Insurance, Education, Home Services, Others.

Given a user_id and a user's question, generate a MongoDB filter (Python dict) to fetch relevant receipts for that user. Always include the user_id in the filter.

User ID: {user_id}
Question: {query}

Respond ONLY with the Python dict for the MongoDB filter.
"""
    
    try:
        response = model.generate_content(prompt)
        raw_filter = extract_code_block(response.text)
        mongo_filter = ast.literal_eval(raw_filter)
        logger.info(f"Generated MongoDB filter: {mongo_filter}")
        return mongo_filter
    except Exception as e:
        logger.error(f"Error generating MongoDB filter: {str(e)}")
        # Fallback to basic user_id filter
        return {"user_id": user_id}

def polish_output(receipts: List[Dict], query: str, model) -> str:
    """Polish the output using Gemini AI"""
    try:
        receipts_json = json.dumps(receipts, default=str, indent=2)
        prompt = f"""
Here is the filtered expense data in JSON:
{receipts_json}

Answer this question based only on the above data:
{query}

Provide a clear, concise, and user-friendly answer.
"""
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error polishing output: {str(e)}")
        return f"Found {len(receipts)} receipts matching your query."

def store_embeddings_in_vector_db(document_id: str, embeddings: List[float], metadata: dict):
    """Store embeddings in Vertex AI Vector Search"""
    try:
        # For this example, we'll store embeddings back in Firestore with the document
        # In production, you'd use Vertex AI Vector Search or another vector database
        
        if not db:
            raise Exception("Firestore client not initialized")
        
        # Update the document with embeddings
        doc_ref = db.collection('receipts').document(document_id)
        doc_ref.update({
            "embeddings": embeddings,
            "embedding_metadata": metadata,
            "embeddings_created_at": datetime.now()
        })
        
        logger.info(f"Embeddings stored for document: {document_id}")
        
    except Exception as e:
        logger.error(f"Error storing embeddings: {str(e)}")
        raise

def create_google_wallet_pass(receipt_data: dict) -> str:
    """Create a user-specific Google Wallet pass for the receipt"""
    try:
        # Generate user-specific pass ID
        user_identifier = receipt_data.get("user_email", "anonymous")
        user_hash = hashlib.md5(user_identifier.encode()).hexdigest()[:8]
        pass_id = f"{user_hash}_{receipt_data.get('id', uuid.uuid4())}"
        
        # Create user-specific pass data
        pass_data = {
            "iss": WALLET_ISSUER_ID or "demo-issuer",
            "aud": "google",
            "typ": "savetowallet",
            "iat": int(datetime.now().timestamp()),
            "payload": {
                "genericObjects": [{
                    "id": f"{WALLET_ISSUER_ID or 'demo'}.{pass_id}",
                    "classId": f"{WALLET_ISSUER_ID or 'demo'}.{WALLET_CLASS_ID or 'receipt_class'}",
                    "state": "ACTIVE",
                    "headerObject": {
                        "header": receipt_data.get("vendor_name", "Receipt"),
                        "subHeader": f"${receipt_data.get('total_amount', 0):.2f}"
                    },
                    "textObjectsV2": [
                        {
                            "header": "Date",
                            "body": receipt_data.get("date", datetime.now().strftime("%Y-%m-%d"))
                        },
                        {
                            "header": "Category", 
                            "body": receipt_data.get("bill_category", "General")
                        },
                        {
                            "header": "Amount",
                            "body": f"${receipt_data.get('total_amount', 0):.2f}"
                        },
                        {
                            "header": "Receipt ID",
                            "body": receipt_data.get('id', 'N/A')[:8]
                        }
                    ],
                    "hexBackgroundColor": "#4CAF50",
                    "logo": {
                        "sourceUri": {
                            "uri": "https://storage.googleapis.com/wallet-lab-tools-codelab-artifacts-public/pass_google_logo.jpg"
                        }
                    },
                    # User-specific grouping and personalization
                    "groupingInfo": {
                        "groupingId": f"user-receipts-{user_hash}",
                        "sortIndex": int(datetime.now().timestamp())
                    },
                    # Add user context in pass
                    "notifications": {
                        "upcomingNotification": {
                            "enableNotification": True
                        }
                    }
                }]
            }
        }
        
        # Add user-specific metadata if email is provided
        if receipt_data.get("user_email"):
            pass_data["payload"]["genericObjects"][0]["textObjectsV2"].append({
                "header": "User",
                "body": receipt_data["user_email"][:20] + "..." if len(receipt_data["user_email"]) > 20 else receipt_data["user_email"]
            })
            
            # Add user-specific barcode for tracking
            pass_data["payload"]["genericObjects"][0]["barcode"] = {
                "type": "QR_CODE",
                "value": f"receipt:{receipt_data.get('id')}:user:{user_hash}",
                "alternateText": f"Receipt {receipt_data.get('id', 'N/A')[:8]}"
            }
        
        # Add validation period (valid for 1 year)
        expiry_date = datetime.now() + timedelta(days=365)
        pass_data["payload"]["genericObjects"][0]["validTimeInterval"] = {
            "start": {
                "date": datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
            },
            "end": {
                "date": expiry_date.strftime("%Y-%m-%dT%H:%M:%S")
            }
        }
        
        # Create JWT token (simplified - in production use proper signing)
        header = {"alg": "RS256", "typ": "JWT"}
        
        # Create user-specific save URL
        encoded_pass = base64.urlsafe_b64encode(json.dumps(pass_data).encode()).decode()
        pass_url = f"https://pay.google.com/gp/v/save/{encoded_pass}"
        
        # Store pass information in Firestore for user tracking
        if db and receipt_data.get("user_email"):
            pass_ref = db.collection('user_wallet_passes').document(pass_id)
            pass_ref.set({
                "user_email": receipt_data["user_email"],
                "receipt_id": receipt_data.get("id"),
                "pass_id": pass_id,
                "pass_url": pass_url,
                "created_at": datetime.now(),
                "status": "active"
            })
        
        logger.info(f"User-specific Google Wallet pass created for user: {user_identifier[:20]}...")
        return pass_url
        
    except Exception as e:
        logger.error(f"Error creating user-specific Google Wallet pass: {str(e)}")
        return None

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Receipt Storage and Wallet API is running",
        "status": "healthy",
        "services": {
            "firestore": db is not None,
            "google_ai": GOOGLE_API_KEY is not None,
            "project_id": GOOGLE_PROJECT_ID is not None
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for Cloud Run"""
    return {
        "status": "healthy",
        "service": "receipt-storage-wallet-api",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/query-receipts", response_model=QueryResponse)
async def query_receipts(request: QueryRequest):
    """Query receipts using natural language"""
    try:
        # Check if MongoDB is available
        if not mongo_collection:
            raise HTTPException(status_code=500, detail="MongoDB not available")
        
        # Check if Google AI is configured
        if not GOOGLE_API_KEY:
            raise HTTPException(status_code=500, detail="Google AI API key not configured")
        
        # Initialize Gemini model
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        # Step 1: Generate MongoDB filter using Gemini
        mongo_filter = generate_mongo_filter(request.user_id, request.query, model)
        
        # Step 2: Fetch data using the generated filter
        receipts = list(mongo_collection.find(mongo_filter))
        
        # Convert ObjectId to string for JSON serialization
        for receipt in receipts:
            if '_id' in receipt:
                receipt['_id'] = str(receipt['_id'])
        
        # Step 3: Use Gemini to polish the output
        answer = polish_output(receipts, request.query, model)
        
        return QueryResponse(
            success=True,
            answer=answer,
            mongodb_filter=mongo_filter,
            receipts_count=len(receipts),
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

@app.post("/store-receipt", response_model=StorageResponse)
async def store_receipt(receipt_data: ReceiptData):
    """
    Store receipt data in Firestore, create embeddings, and generate Google Wallet pass
    
    - **receipt_data**: Receipt data in JSON format
    """
    try:
        # Validate required services
        if not db:
            raise HTTPException(
                status_code=500,
                detail="Firestore not configured"
            )
        
        if not GOOGLE_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="Google AI API not configured"
            )
        
        logger.info("Processing receipt storage request")
        
        # Convert to dict for processing
        data_dict = receipt_data.dict()
        
        # Store in Firestore
        document_id = store_in_firestore(data_dict)
        firestore_status = "stored"
        
        # Generate embeddings with error handling
        embedding_stored = False
        ai_processing_status = "failed"
        try:
            text_for_embedding = json.dumps(data_dict, default=str)
            embeddings = generate_embeddings(text_for_embedding)
            
            # Store embeddings
            embedding_metadata = {
                "model": "custom-hash-based",
                "dimensions": len(embeddings),
                "created_at": datetime.now().isoformat()
            }
            
            store_embeddings_in_vector_db(document_id, embeddings, embedding_metadata)
            embedding_stored = True
            ai_processing_status = "completed"
            logger.info("AI processing completed successfully")
            
        except Exception as ai_error:
            logger.error(f"AI processing failed: {str(ai_error)}")
            ai_processing_status = f"failed: {str(ai_error)}"
            # Continue with wallet pass creation even if AI processing fails
        
        # Create Google Wallet pass
        data_dict["id"] = document_id
        wallet_pass_url = create_google_wallet_pass(data_dict)
        
        logger.info("Receipt processed and stored successfully")
        
        return StorageResponse(
            success=True,
            document_id=document_id,
            embedding_stored=embedding_stored,
            wallet_pass_url=wallet_pass_url,
            message="Receipt stored successfully with embeddings and wallet pass created" if embedding_stored else "Receipt stored successfully, wallet pass created (AI processing had issues)",
            timestamp=datetime.now().isoformat(),
            firestore_status=firestore_status,
            ai_processing_status=ai_processing_status
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error storing receipt: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.get("/receipt/{document_id}")
async def get_receipt(document_id: str):
    """Retrieve a receipt by document ID"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Firestore not configured")
        
        doc_ref = db.collection('receipts').document(document_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Receipt not found")
        
        return doc.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving receipt: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/receipts")
async def list_receipts(limit: int = 10, offset: int = 0):
    """List receipts with pagination"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Firestore not configured")
        
        query = db.collection('receipts').order_by('created_at', direction=firestore.Query.DESCENDING)
        
        if offset > 0:
            # Get the document at offset position for pagination
            offset_docs = query.limit(offset).get()
            if offset_docs:
                last_doc = offset_docs[-1]
                query = query.start_after(last_doc)
        
        docs = query.limit(limit).get()
        
        receipts = []
        for doc in docs:
            receipt_data = doc.to_dict()
            # Remove embeddings from list view for performance
            receipt_data.pop('embeddings', None)
            receipts.append(receipt_data)
        
        return {
            "receipts": receipts,
            "count": len(receipts),
            "offset": offset,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Error listing receipts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/search-receipts")
async def search_receipts(query: str, limit: int = 10):
    """Search receipts using semantic similarity (simplified version)"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Firestore not configured")
        
        # Generate embedding for search query
        query_embedding = generate_embeddings(query)
        
        # For this demo, we'll do a simple text search
        # In production, you'd use proper vector similarity search
        receipts_ref = db.collection('receipts')
        docs = receipts_ref.limit(limit).get()
        
        results = []
        for doc in docs:
            receipt_data = doc.to_dict()
            # Simple text matching for demo
            receipt_text = json.dumps(receipt_data, default=str).lower()
            if query.lower() in receipt_text:
                receipt_data.pop('embeddings', None)  # Remove embeddings from results
                results.append(receipt_data)
        
        return {
            "query": query,
            "results": results,
            "count": len(results)
        }
        
    except Exception as e:
        logger.error(f"Error searching receipts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/user-wallet-passes/{user_email}")
async def get_user_wallet_passes(user_email: str):
    """Get all wallet passes for a specific user"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Firestore not configured")
        
        passes_ref = db.collection('user_wallet_passes')
        query = passes_ref.where('user_email', '==', user_email)
        docs = query.get()
        
        passes = []
        for doc in docs:
            pass_data = doc.to_dict()
            passes.append(pass_data)
        
        # Sort by created_at in Python since Firestore ordering requires an index
        passes.sort(key=lambda x: x.get('created_at', datetime.min), reverse=True)
        
        return {
            "user_email": user_email,
            "wallet_passes": passes,
            "count": len(passes)
        }
        
    except Exception as e:
        logger.error(f"Error retrieving user wallet passes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8081))
    uvicorn.run(app, host="0.0.0.0", port=port)
