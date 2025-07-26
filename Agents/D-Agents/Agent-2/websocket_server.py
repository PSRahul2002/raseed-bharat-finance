#!/usr/bin/env python3
"""
WebSocket server for real-time natural language query processing
Alternative to REST API for real-time interactions
"""

import asyncio
import websockets
import json
import os
import logging
from datetime import datetime
from typing import Dict, Any, List
from dotenv import load_dotenv

# MongoDB imports
from pymongo import MongoClient
import ast
import re

# Google AI imports
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize MongoDB
try:
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/")
    mongo_client = MongoClient(MONGODB_URI)
    mongo_db = mongo_client["raseed"]
    mongo_collection = mongo_db["receipts"]
    logger.info("MongoDB client initialized for WebSocket server")
except Exception as e:
    logger.error(f"Failed to initialize MongoDB: {str(e)}")
    mongo_client = None
    mongo_collection = None

# Configure Google AI
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    logger.info("Google AI configured for WebSocket server")
else:
    logger.error("GOOGLE_API_KEY not found")

def extract_code_block(text: str) -> str:
    """Extract code block from Gemini response"""
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
        return mongo_filter
    except Exception as e:
        logger.error(f"Error generating MongoDB filter: {str(e)}")
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

async def handle_client(websocket, path):
    """Handle WebSocket client connections"""
    client_id = id(websocket)
    logger.info(f"Client {client_id} connected")
    
    try:
        # Send welcome message
        welcome_msg = {
            "type": "welcome",
            "message": "Connected to Receipt Query WebSocket Server",
            "timestamp": datetime.now().isoformat(),
            "instructions": "Send JSON with 'user_id' and 'query' fields"
        }
        await websocket.send(json.dumps(welcome_msg))
        
        # Handle incoming messages
        async for message in websocket:
            try:
                # Parse incoming message
                data = json.loads(message)
                
                if not isinstance(data, dict):
                    raise ValueError("Message must be a JSON object")
                
                if 'user_id' not in data or 'query' not in data:
                    raise ValueError("Message must contain 'user_id' and 'query' fields")
                
                user_id = data['user_id']
                query = data['query']
                
                logger.info(f"Processing query from client {client_id}: {query}")
                
                # Send processing status
                status_msg = {
                    "type": "status",
                    "message": "Processing your query...",
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send(json.dumps(status_msg))
                
                # Check if services are available
                if not mongo_collection:
                    error_msg = {
                        "type": "error",
                        "message": "MongoDB not available",
                        "timestamp": datetime.now().isoformat()
                    }
                    await websocket.send(json.dumps(error_msg))
                    continue
                
                if not GOOGLE_API_KEY:
                    error_msg = {
                        "type": "error",
                        "message": "Google AI API key not configured",
                        "timestamp": datetime.now().isoformat()
                    }
                    await websocket.send(json.dumps(error_msg))
                    continue
                
                # Initialize Gemini model
                model = genai.GenerativeModel("gemini-2.0-flash")
                
                # Step 1: Generate MongoDB filter
                mongo_filter = generate_mongo_filter(user_id, query, model)
                
                filter_msg = {
                    "type": "filter_generated",
                    "mongodb_filter": mongo_filter,
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send(json.dumps(filter_msg))
                
                # Step 2: Fetch data
                receipts = list(mongo_collection.find(mongo_filter))
                
                # Convert ObjectId to string
                for receipt in receipts:
                    if '_id' in receipt:
                        receipt['_id'] = str(receipt['_id'])
                
                data_msg = {
                    "type": "data_fetched",
                    "receipts_count": len(receipts),
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send(json.dumps(data_msg))
                
                # Step 3: Generate answer
                answer = polish_output(receipts, query, model)
                
                # Send final result
                result_msg = {
                    "type": "result",
                    "success": True,
                    "user_id": user_id,
                    "query": query,
                    "answer": answer,
                    "mongodb_filter": mongo_filter,
                    "receipts_count": len(receipts),
                    "receipts": receipts[:10],  # Send first 10 receipts
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send(json.dumps(result_msg))
                
            except json.JSONDecodeError:
                error_msg = {
                    "type": "error",
                    "message": "Invalid JSON format",
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send(json.dumps(error_msg))
                
            except ValueError as e:
                error_msg = {
                    "type": "error",
                    "message": str(e),
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send(json.dumps(error_msg))
                
            except Exception as e:
                logger.error(f"Error processing query: {str(e)}")
                error_msg = {
                    "type": "error",
                    "message": f"Internal server error: {str(e)}",
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send(json.dumps(error_msg))
    
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Client {client_id} disconnected")
    except Exception as e:
        logger.error(f"Error handling client {client_id}: {str(e)}")

async def main():
    """Start the WebSocket server"""
    host = "localhost"
    port = 8082
    
    logger.info(f"Starting WebSocket server on ws://{host}:{port}")
    
    # Start server
    async with websockets.serve(handle_client, host, port):
        logger.info(f"🚀 WebSocket server running on ws://{host}:{port}")
        logger.info("📝 Send JSON messages with 'user_id' and 'query' fields")
        logger.info("🛑 Press Ctrl+C to stop the server")
        
        # Keep server running
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("📝 WebSocket server stopped")
