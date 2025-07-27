# Receipt Processing API

A FastAPI-based service that processes receipt images and extracts categorized information using Google's ADK Agents with Gemini 2.0 Flash model.

## Features

- **Image Processing**: Upload receipt images (JPEG, PNG, GIF, WebP)
- **Text Extraction**: Extract vendor name, date, items, prices, and taxes
- **Smart Categorization**: Automatically categorize items and entire bills
- **JSON Output**: Structured response with categorized receipt data
- **Health Checks**: Built-in health monitoring for Cloud Run
- **CORS Support**: Cross-origin resource sharing enabled

## API Endpoints

### `POST /process-receipt`
Upload a receipt image and get categorized data.

**Request**: Multipart form data with image file
**Response**: Categorized receipt data in JSON format

### `POST /process-receipt-json`
Process pre-extracted receipt JSON data (for testing).

**Request**: JSON object with receipt data
**Response**: Categorized receipt data in JSON format

### `GET /health`
Health check endpoint for monitoring.

### `GET /docs`
Interactive API documentation (Swagger UI).

## Response Format

```json
{
  "vendor_name": "Store Name",
  "date": "2025-07-27",
  "timestamp": "2025-07-27T14:32:00",
  "total_amount": 150.00,
  "taxes": 15.00,
  "items": [
    {
      "name": "Product Name",
      "quantity": 2,
      "unit_price": 67.50,
      "category": "Grocery",
      "subcategory": "Food Items"
    }
  ],
  "bill_category": "Grocery"
}
```

## Categories

### Main Categories
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

## Local Development

### Prerequisites
- Python 3.11+
- Google Cloud SDK
- Docker (optional)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd Agent-1
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run the application:
```bash
python main.py
```

The API will be available at `http://localhost:8080`

### Testing

Test with curl:
```bash
# Health check
curl http://localhost:8080/health

# Process receipt image
curl -X POST -F "file=@receipt.jpg" http://localhost:8080/process-receipt
```

## Google Cloud Deployment

### Prerequisites
- Google Cloud Project with billing enabled
- Google Cloud SDK installed and configured
- Required APIs enabled (done automatically by deployment script)

### Quick Deployment

1. Set your Google Cloud project:
```bash
gcloud config set project YOUR_PROJECT_ID
```

2. Run the deployment script:
```bash
./deploy.sh
```

The script will:
- Enable required Google Cloud APIs
- Build the Docker image using Cloud Build
- Deploy to Cloud Run
- Configure the service for public access
- Run health checks

### Manual Deployment

1. Enable required APIs:
```bash
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com
```

2. Build and deploy:
```bash
gcloud builds submit --config cloudbuild.yaml
```

3. Verify deployment:
```bash
gcloud run services list
```

### Configuration

The deployment includes:
- **Memory**: 2GB
- **CPU**: 2 vCPUs
- **Timeout**: 300 seconds
- **Max Instances**: 10
- **Public Access**: Enabled (no authentication required)
- **Region**: us-central1 (configurable)

### Monitoring

View logs:
```bash
gcloud logs read --service=receipt-processing-api
```

Monitor metrics in the [Google Cloud Console](https://console.cloud.google.com/run).

## Security Considerations

- The API is currently configured for public access (no authentication)
- For production use, consider implementing:
  - API key authentication
  - Rate limiting
  - Input validation and sanitization
  - File size and type restrictions
  - HTTPS enforcement

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8080 |
| `ENVIRONMENT` | Environment mode | development |
| `GOOGLE_CLOUD_PROJECT` | GCP Project ID | - |
| `GOOGLE_APPLICATION_CREDENTIALS` | Service account key path | - |
| `LOG_LEVEL` | Logging level | INFO |

## Troubleshooting

### Common Issues

1. **Import Error for google.adk.agents**:
   - Ensure the google-adk-agents package is properly installed
   - Check authentication with Google Cloud

2. **Image Processing Errors**:
   - Verify image format is supported
   - Check file size limits
   - Ensure image is not corrupted

3. **Deployment Failures**:
   - Check Google Cloud project permissions
   - Verify billing is enabled
   - Ensure required APIs are enabled

### Debug Mode

Run locally with debug logging:
```bash
LOG_LEVEL=DEBUG python main.py
```

### Health Check

The `/health` endpoint provides service status and can be used for monitoring:
```bash
curl https://your-service-url/health
```

## Cost Optimization

- Cloud Run charges only for actual usage
- Consider setting appropriate CPU and memory limits
- Use Cloud Run's automatic scaling
- Monitor usage in Google Cloud Console

## Support

For issues related to:
- **Google ADK Agents**: Check Google Cloud documentation
- **FastAPI**: Refer to FastAPI documentation
- **Cloud Run**: Google Cloud Run documentation
