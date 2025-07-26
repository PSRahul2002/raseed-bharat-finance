# Receipt Storage and Wallet API

A comprehensive API service that stores receipt data in Google Cloud Firestore (MongoDB alternative), converts data to embeddings for vector search, and creates Google Wallet passes.

## Features

- 📄 **Receipt Data Storage**: Store receipt JSON data in Google Cloud Firestore
- 🧠 **Embeddings Generation**: Convert receipt data to vector embeddings for semantic search
- 🔍 **Vector Search**: Search receipts using semantic similarity
- 💳 **Google Wallet Integration**: Generate Google Wallet passes for receipts
- 🚀 **Cloud-Native**: Designed for Google Cloud Run deployment
- 📊 **REST API**: Full REST API with automatic documentation

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   FastAPI App   │───▶│  Google Cloud    │───▶│  Vector Search  │
│                 │    │   Firestore      │    │  (Embeddings)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                              
         ▼                       
┌─────────────────┐    ┌──────────────────┐
│ Google Wallet   │    │   Google AI      │
│     Pass        │    │   (Gemini)       │
└─────────────────┘    └──────────────────┘
```

## Prerequisites

- **Python 3.11+** (required for modern dependencies)
- **Google Cloud Project** with billing enabled
- **Google AI API key** (for Gemini)
- **Docker** (for containerization)
- **Git** (for version control)

## Environment Setup

### Virtual Environment
This project uses a Python virtual environment to isolate dependencies:

```bash
# The setup script handles this automatically
./setup.sh

# Manual activation when needed
source .venv/bin/activate

# Deactivate when done
deactivate
```

### Required Environment Variables

Create a `.env` file or set these environment variables:

```bash
# Required
GOOGLE_PROJECT_ID=your-google-cloud-project-id
GOOGLE_API_KEY=your-google-ai-api-key

# Optional (for Google Wallet)
GOOGLE_SERVICE_ACCOUNT_PATH=/path/to/service-account.json
WALLET_ISSUER_ID=your-wallet-issuer-id
WALLET_CLASS_ID=your-wallet-class-id
```

## Quick Start

### 1. Local Development Setup

```bash
# Navigate to Agent-2 directory
cd Agent-2

# Run the setup script (creates venv and installs dependencies)
chmod +x setup.sh
./setup.sh

# Edit the .env file with your configuration
nano .env

# Run the development server
chmod +x run_dev.sh
./run_dev.sh
```

**Manual Setup (Alternative):**
```bash
# Create virtual environment
python3.11 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.template .env

# Edit .env with your values
nano .env

# Run the application
python main.py
```

The API will be available at `http://localhost:8081`

### 2. Google Cloud Deployment

```bash
# Make the deployment script executable
chmod +x deploy.sh

# Set required environment variables
export GOOGLE_PROJECT_ID=your-project-id
export GOOGLE_API_KEY=your-api-key

# Deploy to Google Cloud
./deploy.sh
```

### 3. Using Docker

```bash
# Build the Docker image
docker build -t receipt-storage-api .

# Run the container
docker run -p 8081:8081 \
  -e GOOGLE_PROJECT_ID=your-project-id \
  -e GOOGLE_API_KEY=your-api-key \
  receipt-storage-api
```

## API Endpoints

### Health Check
- `GET /` - Basic health check
- `GET /health` - Detailed health check

### Receipt Management
- `POST /store-receipt` - Store receipt data with embeddings and create wallet pass
- `GET /receipt/{document_id}` - Retrieve a specific receipt
- `GET /receipts` - List receipts with pagination
- `POST /search-receipts` - Search receipts using semantic similarity

### API Documentation
- `GET /docs` - Interactive API documentation (Swagger)
- `GET /redoc` - Alternative API documentation

## Usage Examples

### Store a Receipt

```bash
curl -X POST "http://localhost:8081/store-receipt" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_name": "Tech Store Inc.",
    "date": "2025-01-27",
    "total_amount": 1299.99,
    "taxes": 104.00,
    "items": [
      {
        "name": "MacBook Pro",
        "quantity": 1,
        "unit_price": 1199.99,
        "category": "Electronics",
        "subcategory": "Computers"
      }
    ],
    "bill_category": "Electronics"
  }'
```

### Search Receipts

```bash
curl -X POST "http://localhost:8081/search-receipts?query=MacBook&limit=5"
```

### List Receipts

```bash
curl -X GET "http://localhost:8081/receipts?limit=10&offset=0"
```

## Data Models

### Receipt Data Input
```json
{
  "vendor_name": "string",
  "date": "YYYY-MM-DD",
  "timestamp": "ISO 8601 timestamp",
  "total_amount": "number",
  "taxes": "number",
  "items": [
    {
      "name": "string",
      "quantity": "number",
      "unit_price": "number",
      "category": "string",
      "subcategory": "string"
    }
  ],
  "bill_category": "string",
  "metadata": {}
}
```

### Storage Response
```json
{
  "success": true,
  "document_id": "uuid",
  "embedding_stored": true,
  "wallet_pass_url": "https://pay.google.com/gp/v/save/...",
  "message": "Receipt stored successfully"
}
```

## Google Cloud Services Used

1. **Cloud Run**: Serverless container hosting
2. **Firestore**: NoSQL document database (MongoDB alternative)
3. **Vertex AI**: AI and ML services for embeddings
4. **Cloud Build**: CI/CD pipeline
5. **Container Registry**: Docker image storage
6. **Google AI (Gemini)**: Text processing and embeddings

## Google Wallet Integration

The API creates Google Wallet passes for stored receipts with:
- Receipt title and vendor name
- Total amount
- Date and category
- Digital pass format

## Vector Search Capabilities

- Converts receipt data to embeddings using Google AI
- Stores embeddings alongside document data
- Enables semantic search across receipts
- Supports similarity-based retrieval

## Security Features

- CORS middleware for cross-origin requests
- Environment variable configuration
- Service account authentication
- Health check endpoints for monitoring

## Testing

Run the test client to verify all functionality:

```bash
# Update the BASE_URL in test_client.py to your deployed URL
python test_client.py
```

## Monitoring and Logging

- Structured logging with Python logging
- Cloud Logging integration when deployed
- Health check endpoints for uptime monitoring
- Error handling with detailed responses

## Performance

- Async FastAPI for high concurrency
- Efficient Firestore queries with pagination
- Optimized Docker image with multi-stage builds
- Auto-scaling with Cloud Run

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the API documentation at `/docs`
2. Review the logs for error details
3. Ensure all environment variables are set correctly
4. Verify Google Cloud APIs are enabled
