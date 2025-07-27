from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import json
import base64
from PIL import Image
import io
import logging
import google.generativeai as genai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get Google API key from environment
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    logger.info(f"Google API configured successfully with key: {GOOGLE_API_KEY[:10]}...{GOOGLE_API_KEY[-4:]}")
else:
    logger.error("GOOGLE_API_KEY not found in environment variables")

app = FastAPI(
    title="Receipt Processing API",
    description="API to process receipt images and extract categorized information",
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

class Item(BaseModel):
    name: Optional[str] = Field(description="Name of the purchased item or service")
    quantity: Optional[float] = Field(default=1, description="Quantity of the item")
    unit_price: Optional[float] = Field(description="Price per unit")

class ReceiptCategorized(BaseModel):
    vendor_name: Optional[str] = Field(description="Vendor name")
    date: Optional[str] = Field(description="Date in YYYY-MM-DD")
    timestamp: Optional[str] = Field(description="Timestamp of the transaction")
    total_amount: Optional[float] = Field(description="Total amount billed")
    taxes: Optional[float] = Field(description="Taxes paid")
    items: Optional[List[Item]] = Field(description="Purchased item list")
    bill_category: Optional[str] = Field(description="Category for the entire bill")

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None

# System prompt for receipt processing
RECEIPT_PROCESSING_PROMPT = """
You are a smart receipt processing and categorization assistant.

You will receive a receipt image. Your task is to:
1. Extract all relevant information from the receipt including vendor name, date, items, quantities, prices, taxes, and total amount.
2. Determine a `bill_category` for the entire receipt based on the nature of the purchase and vendor.
3. Match the bill_category to one of these predefined options:

Main Categories:
- Grocery
- Food
- Travel
- OTT
- Fuel
- Electronics
- Healthcare
- Fashion
- Utility Bills
- Entertainment
- Mobile Recharge
- Insurance
- Education
- Home Services
- Others

Return only a valid JSON in this format:

{
  "vendor_name": "Vendor Name",
  "date": "2025-07-21",
  "timestamp": "2025-07-21T14:32:00",
  "total_amount": 440.00,
  "taxes": 40.00,
  "items": [
    {"name": "Logo design", "quantity": 1, "unit_price": 200.0},
    {"name": "Website design", "quantity": 1, "unit_price": 120.0}
  ],
  "bill_category": "Electronics"
}

Do not include any explanation or invalid values. If unsure, use "Others" for categories.
If you cannot extract certain information, use null for those fields.
"""

def process_receipt_with_gemini(image_data):
    """Process receipt image using Gemini API"""
    try:
        # Initialize the model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Convert image data to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Generate content
        response = model.generate_content([RECEIPT_PROCESSING_PROMPT, image])
        
        # Extract JSON from response
        response_text = response.text.strip()
        
        # Try to extract JSON from the response
        if response_text.startswith('```json'):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith('```'):
            response_text = response_text[3:-3].strip()
        
        # Parse JSON
        result = json.loads(response_text)
        return result
        
    except Exception as e:
        logger.error(f"Error processing receipt with Gemini: {str(e)}")
        raise

def process_receipt_json_with_gemini(receipt_data):
    """Process receipt JSON data using Gemini API"""
    try:
        # Initialize the model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        You are a smart categorization assistant.

        You will receive a receipt JSON without category information. Your task is to:
        1. Determine a `bill_category` for the entire receipt based on the nature of the purchase and vendor.
        2. Match the bill_category to one of these predefined options:

        Main Categories:
        - Grocery
        - Food
        - Travel
        - OTT
        - Fuel
        - Electronics
        - Healthcare
        - Fashion
        - Utility Bills
        - Entertainment
        - Mobile Recharge
        - Insurance
        - Education
        - Home Services
        - Others

        Receipt data: {json.dumps(receipt_data)}

        Return only a valid JSON with all the original data plus the bill_category information.
        """
        
        # Generate content
        response = model.generate_content(prompt)
        
        # Extract JSON from response
        response_text = response.text.strip()
        
        # Try to extract JSON from the response
        if response_text.startswith('```json'):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith('```'):
            response_text = response_text[3:-3].strip()
        
        # Parse JSON
        result = json.loads(response_text)
        return result
        
    except Exception as e:
        logger.error(f"Error processing receipt JSON with Gemini: {str(e)}")
        raise

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Receipt Processing API is running", 
        "status": "healthy",
        "api_configured": GOOGLE_API_KEY is not None
    }

@app.get("/test-api")
async def test_api():
    """Test endpoint to verify Google API connectivity"""
    try:
        if not GOOGLE_API_KEY:
            return {"error": "API key not configured"}
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Say hello")
        
        return {
            "status": "success",
            "api_working": True,
            "response": response.text[:100]
        }
    except Exception as e:
        return {
            "status": "error", 
            "api_working": False,
            "error": str(e)
        }

@app.get("/health")
async def health_check():
    """Health check endpoint for Cloud Run"""
    return {
        "status": "healthy", 
        "service": "receipt-processing-api",
        "api_configured": GOOGLE_API_KEY is not None
    }

@app.post("/process-receipt", response_model=ReceiptCategorized)
async def process_receipt(file: UploadFile = File(...)):
    """
    Process a receipt image and return categorized information
    
    - **file**: Receipt image file (JPEG, PNG, etc.)
    """
    try:
        # Check if API is configured
        if not GOOGLE_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="Google API key not configured"
            )
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400, 
                detail="File must be an image (JPEG, PNG, etc.)"
            )
        
        logger.info(f"Processing receipt image: {file.filename}")
        
        # Read image data
        image_data = await file.read()
        
        # Process the image with Gemini
        result = process_receipt_with_gemini(image_data)
        
        logger.info("Receipt processed successfully")
        
        return ReceiptCategorized(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing receipt: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error: {str(e)}"
        )

@app.post("/process-receipt-json", response_model=ReceiptCategorized)
async def process_receipt_json(receipt_data: dict):
    """
    Process a receipt JSON (without categories) and return categorized information
    This endpoint is for testing with pre-extracted receipt data
    
    - **receipt_data**: Receipt data in JSON format without categories
    """
    try:
        # Check if API is configured
        if not GOOGLE_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="Google API key not configured"
            )
        
        logger.info("Processing receipt JSON data")
        
        # Process the JSON with Gemini
        result = process_receipt_json_with_gemini(receipt_data)
        
        logger.info("Receipt JSON processed successfully")
        
        return ReceiptCategorized(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing receipt JSON: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
