from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import logging
from datetime import datetime
from typing import Dict, Any, List
import asyncio

# Import Firestore and Google AI dependencies
from google.cloud import firestore
from google.oauth2 import service_account
import google.generativeai as genai
from dotenv import load_dotenv
import os
import ast
import re
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get environment variables
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID")
GOOGLE_SERVICE_ACCOUNT_PATH = os.getenv("GOOGLE_SERVICE_ACCOUNT_PATH")
DATABASE_NAME = os.getenv("DATABASE_NAME", "receipts")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "receipts")

# Configure Google AI
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    logger.info("Google AI configured successfully")
else:
    logger.error("GOOGLE_API_KEY not found in environment variables")
    raise ValueError("GOOGLE_API_KEY is required")

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
    raise

app = FastAPI(
    title="Expense Query WebSocket API",
    description="Real-time natural language query API for expense tracking using WebSockets",
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

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(websocket)
        
        logger.info(f"New WebSocket connection. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket, user_id: str = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if user_id and user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending message: {e}")

    async def send_to_user(self, message: dict, user_id: str):
        if user_id in self.user_connections:
            for connection in self.user_connections[user_id]:
                await self.send_personal_message(message, connection)

manager = ConnectionManager()

def extract_code_block(text: str) -> str:
    """Extract code block from Gemini response"""
    code = re.sub(r"^```[a-zA-Z]*\s*|```$", "", text.strip(), flags=re.MULTILINE)
    return code.strip()

def enhance_filter_with_smart_dates(mongo_filter: Dict[str, Any], query: str) -> Dict[str, Any]:
    """Enhance MongoDB filter with smart date handling based on natural language"""
    query_lower = query.lower()
    today = datetime.now()
    
    # If the filter doesn't have date criteria but query mentions time periods, add them
    if "date" not in mongo_filter:
        if "last month" in query_lower:
            last_month = today - relativedelta(months=1)
            start_date = last_month.replace(day=1).strftime("%Y-%m-%d")
            end_date = (last_month.replace(day=1) + relativedelta(months=1) - timedelta(days=1)).strftime("%Y-%m-%d")
            mongo_filter["date"] = {"$gte": start_date, "$lte": end_date}
        
        elif "this month" in query_lower:
            start_date = today.replace(day=1).strftime("%Y-%m-%d")
            end_date = today.strftime("%Y-%m-%d")
            mongo_filter["date"] = {"$gte": start_date, "$lte": end_date}
        
        elif "last week" in query_lower:
            last_week = today - timedelta(weeks=1)
            start_date = (last_week - timedelta(days=last_week.weekday())).strftime("%Y-%m-%d")
            end_date = (last_week + timedelta(days=6-last_week.weekday())).strftime("%Y-%m-%d")
            mongo_filter["date"] = {"$gte": start_date, "$lte": end_date}
        
        elif "today" in query_lower:
            today_str = today.strftime("%Y-%m-%d")
            mongo_filter["date"] = today_str
        
        elif "yesterday" in query_lower:
            yesterday_str = (today - timedelta(days=1)).strftime("%Y-%m-%d")
            mongo_filter["date"] = yesterday_str
    
    return mongo_filter

async def generate_mongo_filter(user_id: str, query: str, model) -> Dict[str, Any]:
    """Generate MongoDB filter using Gemini AI - ALWAYS filters by user_id (Gmail ID)"""
    prompt = f"""
You are an assistant that helps generate MongoDB queries for an expense tracking app.

The MongoDB collection "receipts" has documents with this schema:
{{
  _id: ObjectId,
  user_id: string (Gmail ID of the user),
  vendor_name: string,
  bill_category: string,
  items: [string],
  total_amount: number,
  date: string (YYYY-MM-DD format, e.g. "2025-01-15")
}}

Main categories: Grocery, Food, Travel, OTT, Fuel, Electronics, Healthcare, Fashion, Utility Bills, Entertainment, Mobile Recharge, Insurance, Education, Home Services, Others.

CRITICAL SECURITY RULE:
- The user_id MUST ALWAYS be included in the filter for data privacy and security
- user_id is the Gmail ID of the authenticated user: {user_id}
- Never generate queries without the user_id filter

IMPORTANT RULES:
1. MANDATORY: Always include user_id: "{user_id}" in every filter
2. For date ranges, use STATIC date strings in YYYY-MM-DD format only
3. Do NOT use any function calls like datetime.now() or relativedelta()
4. For "last month" queries, use approximate dates like "2024-12-01" to "2024-12-31"
5. For "this month" queries, use approximate dates like "2025-01-01" to "2025-01-31"
6. Use simple comparison operators: $gte, $lt, $eq, $regex
7. Return ONLY a valid Python dictionary with simple values

Examples of VALID filters (notice user_id is ALWAYS present):
{{"user_id": "{user_id}", "bill_category": "Grocery"}}
{{"user_id": "{user_id}", "vendor_name": {{"$regex": "Amazon", "$options": "i"}}}}
{{"user_id": "{user_id}", "total_amount": {{"$gte": 100}}}}
{{"user_id": "{user_id}", "date": {{"$gte": "2024-12-01", "$lt": "2025-01-01"}}}}

User Gmail ID (MUST be in filter): {user_id}
Question: {query}

Respond ONLY with the Python dict for the MongoDB filter. The user_id field is MANDATORY.
"""
    
    try:
        response = model.generate_content(prompt)
        raw_filter = extract_code_block(response.text)
        logger.info(f"Raw filter from Gemini: {raw_filter}")
        
        # Parse the filter
        mongo_filter = ast.literal_eval(raw_filter)
        
        # CRITICAL: Force user_id to be present for security
        mongo_filter["user_id"] = user_id
        logger.info(f"Enforced user_id filter: {user_id}")
        
        # Enhance with smart date handling
        mongo_filter = enhance_filter_with_smart_dates(mongo_filter, query)
        
        # Final validation - ensure user_id is present
        if "user_id" not in mongo_filter or mongo_filter["user_id"] != user_id:
            logger.warning("Security violation prevented: user_id missing or incorrect")
            mongo_filter["user_id"] = user_id
            
        return mongo_filter
    except Exception as e:
        logger.error(f"Error generating MongoDB filter: {str(e)}")
        logger.error(f"Raw filter was: {raw_filter if 'raw_filter' in locals() else 'Not generated'}")
        logger.error(f"Original query: {query}")
        # Fallback to basic user filter - ALWAYS include user_id for security
        return {"user_id": user_id}

def convert_mongo_to_firestore_query(mongo_filter: Dict[str, Any], collection_ref):
    """Convert MongoDB-style filter to Firestore query"""
    query = collection_ref
    
    for field, value in mongo_filter.items():
        if isinstance(value, dict):
            # Handle MongoDB operators
            for operator, op_value in value.items():
                if operator == "$gte":
                    query = query.where(field, ">=", op_value)
                elif operator == "$lte":
                    query = query.where(field, "<=", op_value)
                elif operator == "$gt":
                    query = query.where(field, ">", op_value)
                elif operator == "$lt":
                    query = query.where(field, "<", op_value)
                elif operator == "$eq":
                    query = query.where(field, "==", op_value)
                elif operator == "$ne":
                    query = query.where(field, "!=", op_value)
                elif operator == "$in":
                    query = query.where(field, "in", op_value)
                elif operator == "$nin":
                    query = query.where(field, "not-in", op_value)
        else:
            # Direct equality match
            query = query.where(field, "==", value)
    
    return query

async def query_firestore_receipts(firestore_filter: Dict[str, Any]) -> List[Dict]:
    """Query receipts from Firestore using the converted filter"""
    try:
        collection_ref = db.collection(COLLECTION_NAME)
        query = convert_mongo_to_firestore_query(firestore_filter, collection_ref)
        
        # Execute query
        docs = query.get()
        
        receipts = []
        for doc in docs:
            receipt_data = doc.to_dict()
            receipt_data['id'] = doc.id  # Add document ID
            receipts.append(receipt_data)
        
        return receipts
    except Exception as e:
        logger.error(f"Error querying Firestore: {str(e)}")
        return []

async def polish_output(receipts: List[Dict], query: str, model) -> str:
    """Polish the output using Gemini AI"""
    receipts_json = json.dumps(receipts, default=str, indent=2)
    prompt = f"""
Here is the filtered expense data in JSON:
{receipts_json}

Answer this question based only on the above data:
{query}

Provide a clear, concise, and user-friendly answer. If no data is found, mention that no matching expenses were found for the query.
"""
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error polishing output: {str(e)}")
        return f"Found {len(receipts)} matching expenses. Please check the raw data for details."

async def process_query(user_id: str, query: str, websocket: WebSocket):
    """Process a query and send real-time updates - ALWAYS filters by user's Gmail ID"""
    try:
        # Validate user_id (Gmail ID) is provided
        if not user_id or not user_id.strip():
            await manager.send_personal_message({
                "type": "error",
                "success": False,
                "error": "User Gmail ID is required for all queries",
                "timestamp": datetime.now().isoformat()
            }, websocket)
            return
        
        # Basic Gmail ID validation
        if "@" not in user_id or "." not in user_id:
            await manager.send_personal_message({
                "type": "error",
                "success": False,
                "error": "Invalid Gmail ID format. Please provide a valid email address.",
                "timestamp": datetime.now().isoformat()
            }, websocket)
            return
        
        logger.info(f"Processing query for user: {user_id}")
        
        # Send status update
        await manager.send_personal_message({
            "type": "status",
            "message": f"Processing query for user {user_id}...",
            "user_id": user_id,
            "timestamp": datetime.now().isoformat()
        }, websocket)
        
        # Initialize Gemini model
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        # Step 1: Generate MongoDB filter (ALWAYS includes user_id)
        await manager.send_personal_message({
            "type": "status",
            "message": "Generating database query with user filter...",
            "timestamp": datetime.now().isoformat()
        }, websocket)
        
        firestore_filter = await generate_mongo_filter(user_id, query, model)
        
        # Double-check security: ensure user_id is in filter
        if "user_id" not in firestore_filter or firestore_filter["user_id"] != user_id:
            logger.error(f"Security violation: Filter missing user_id for {user_id}")
            firestore_filter["user_id"] = user_id
        
        # Step 2: Fetch data (only for this user)
        await manager.send_personal_message({
            "type": "status",
            "message": f"Searching user-specific data for {user_id}...",
            "timestamp": datetime.now().isoformat()
        }, websocket)
        
        receipts = await query_firestore_receipts(firestore_filter)
        
        # Send intermediate result
        await manager.send_personal_message({
            "type": "intermediate",
            "results_count": len(receipts),
            "firestore_filter": firestore_filter,
            "user_id": user_id,
            "timestamp": datetime.now().isoformat()
        }, websocket)
        
        # Step 3: Polish output
        await manager.send_personal_message({
            "type": "status",
            "message": "Generating personalized response...",
            "timestamp": datetime.now().isoformat()
        }, websocket)
        
        answer = await polish_output(receipts, query, model)
        
        # Send final result
        await manager.send_personal_message({
            "type": "result",
            "success": True,
            "answer": answer,
            "query_used": query,
            "user_id": user_id,
            "results_count": len(receipts),
            "firestore_filter": firestore_filter,
            "timestamp": datetime.now().isoformat()
        }, websocket)
        
    except Exception as e:
        logger.error(f"Error processing query for user {user_id}: {str(e)}")
        await manager.send_personal_message({
            "type": "error",
            "success": False,
            "error": str(e),
            "user_id": user_id,
            "timestamp": datetime.now().isoformat()
        }, websocket)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Expense Query WebSocket API is running",
        "status": "healthy",
        "database": "firestore",
        "active_connections": len(manager.active_connections),
        "services": {
            "firestore": db is not None,
            "google_ai": GOOGLE_API_KEY is not None,
            "project_id": GOOGLE_PROJECT_ID is not None
        },
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for Cloud Run"""
    return {
        "status": "healthy",
        "service": "expense-query-websocket-api",
        "database": "firestore",
        "timestamp": datetime.now().isoformat()
    }

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time expense queries - Requires user Gmail ID"""
    # Validate Gmail ID format before accepting connection
    if not user_id or "@" not in user_id or "." not in user_id:
        await websocket.close(code=4000, reason="Valid Gmail ID required in URL path")
        return
    
    await manager.connect(websocket, user_id)
    
    # Send welcome message with user context
    await manager.send_personal_message({
        "type": "connection",
        "message": f"Connected to Expense Query API for Gmail user: {user_id}",
        "user_id": user_id,
        "note": "All queries will be filtered by your Gmail ID for privacy and security",
        "timestamp": datetime.now().isoformat()
    }, websocket)
    
    try:
        while True:
            # Wait for query from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "query":
                query = message.get("query", "")
                if query.strip():
                    # Process query with enforced user filtering
                    await process_query(user_id, query, websocket)
                else:
                    await manager.send_personal_message({
                        "type": "error",
                        "error": "Empty query received",
                        "user_id": user_id,
                        "timestamp": datetime.now().isoformat()
                    }, websocket)
            
            elif message.get("type") == "ping":
                # Respond to ping with pong
                await manager.send_personal_message({
                    "type": "pong",
                    "user_id": user_id,
                    "timestamp": datetime.now().isoformat()
                }, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        logger.info(f"Gmail user {user_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error for Gmail user {user_id}: {str(e)}")
        manager.disconnect(websocket, user_id)

@app.websocket("/ws")
async def websocket_endpoint_general(websocket: WebSocket):
    """General WebSocket endpoint - REQUIRES user Gmail ID in message for security"""
    await manager.connect(websocket)
    
    await manager.send_personal_message({
        "type": "connection",
        "message": "Connected to Expense Query API",
        "note": "Gmail ID is required in every query message for security",
        "timestamp": datetime.now().isoformat()
    }, websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "query":
                user_id = message.get("user_id")  # Gmail ID from message
                query = message.get("query", "")
                
                # Strict validation of Gmail ID
                if not user_id:
                    await manager.send_personal_message({
                        "type": "error",
                        "error": "user_id (Gmail ID) is required for all queries",
                        "timestamp": datetime.now().isoformat()
                    }, websocket)
                    continue
                
                # Validate Gmail format
                if "@" not in user_id or "." not in user_id:
                    await manager.send_personal_message({
                        "type": "error",
                        "error": "Invalid Gmail ID format. Please provide a valid email address.",
                        "timestamp": datetime.now().isoformat()
                    }, websocket)
                    continue
                
                if query.strip():
                    await process_query(user_id, query, websocket)
                else:
                    await manager.send_personal_message({
                        "type": "error",
                        "error": "Empty query received",
                        "user_id": user_id,
                        "timestamp": datetime.now().isoformat()
                    }, websocket)
            
            elif message.get("type") == "ping":
                await manager.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                }, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
