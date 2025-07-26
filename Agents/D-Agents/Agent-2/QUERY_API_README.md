# Natural Language Query API

This API provides natural language querying capabilities for receipt data using Google's Gemini AI and MongoDB.

## Features

- 🗣️ **Natural Language Processing**: Ask questions in plain English about your receipts
- 🔍 **Smart MongoDB Queries**: Automatically generates optimized MongoDB filters
- 🤖 **AI-Powered Responses**: Uses Google Gemini to provide intelligent, contextual answers
- 🌐 **Multiple Interfaces**: Both REST API and WebSocket support
- 📊 **Real-time Processing**: Stream processing updates via WebSocket

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Copy the environment template and configure your settings:

```bash
cp .env.template .env
nano .env
```

Required environment variables:
- `GOOGLE_API_KEY`: Your Google AI API key
- `MONGODB_URI`: MongoDB connection string (default: `mongodb://127.0.0.1:27017/`)

### 3. Start MongoDB

Make sure MongoDB is running locally:

```bash
# macOS with Homebrew
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Usage

### REST API

#### Start the API Server

```bash
# Using the run script
./run_dev.sh

# Or manually
python main.py
```

The API will be available at `http://localhost:8081`

#### Query Endpoint

**POST** `/query-receipts`

Request body:
```json
{
    "user_id": "user123",
    "query": "How much did I spend on groceries this month?"
}
```

Response:
```json
{
    "success": true,
    "answer": "Based on your receipts, you spent $245.67 on groceries this month across 8 transactions.",
    "mongodb_filter": {"user_id": "user123", "category": "Grocery"},
    "receipts_count": 8,
    "timestamp": "2025-07-27T10:30:00"
}
```

#### Test the REST API

```bash
python test_query_client.py
```

### WebSocket API

#### Start the WebSocket Server

```bash
python websocket_server.py
```

The WebSocket server will be available at `ws://localhost:8082`

#### Connect and Query

Send JSON messages with the following format:
```json
{
    "user_id": "user123",
    "query": "Show me all food expenses above $50"
}
```

You'll receive real-time updates:
1. `welcome` - Connection confirmation
2. `status` - Processing updates
3. `filter_generated` - MongoDB filter created
4. `data_fetched` - Data retrieval complete
5. `result` - Final answer with results

#### Test the WebSocket API

```bash
python test_websocket_client.py
```

## Example Queries

The system can handle various types of natural language queries:

### Spending Analysis
- "How much did I spend on groceries this month?"
- "What's my total spending on food?"
- "Show me my highest expense this week"

### Category Filtering
- "List all travel expenses"
- "Show me entertainment receipts"
- "Find all utility bill payments"

### Date-based Queries
- "What did I buy yesterday?"
- "Show me last week's receipts"
- "Find expenses from January 2025"

### Amount-based Queries
- "Show me all expenses above $100"
- "Find small purchases under $20"
- "What are my largest food expenses?"

### Vendor-specific Queries
- "Show me all receipts from Target"
- "How much did I spend at restaurants?"
- "Find all Amazon purchases"

## Data Schema

The MongoDB collection `receipts` uses the following schema:

```javascript
{
  _id: ObjectId,
  user_id: string,
  vendor_name: string,
  category: string,
  sub_category: string,
  items: [string],
  total_price: number,
  date: string // YYYY-MM-DD format
}
```

### Supported Categories

- Grocery
- Food
- Travel
- OTT (Streaming services)
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

## API Documentation

### REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/` | Health check and service status |
| GET    | `/health` | Health check for monitoring |
| POST   | `/query-receipts` | Natural language query processing |

### WebSocket Events

| Event Type | Description |
|------------|-------------|
| `welcome` | Connection established |
| `status` | Processing status update |
| `filter_generated` | MongoDB filter created |
| `data_fetched` | Data retrieval complete |
| `result` | Final answer with results |
| `error` | Error occurred |

## Development

### Running Tests

```bash
# Test REST API
python test_query_client.py

# Test WebSocket API
python test_websocket_client.py

# Test both with interactive mode
python test_query_client.py  # Choose option 2
python test_websocket_client.py  # Choose option 2
```

### Debugging

Enable debug logging by setting the environment variable:
```bash
export LOG_LEVEL=DEBUG
```

### Performance Considerations

- **MongoDB Indexing**: Create indexes on frequently queried fields:
  ```javascript
  db.receipts.createIndex({"user_id": 1, "date": -1})
  db.receipts.createIndex({"user_id": 1, "category": 1})
  db.receipts.createIndex({"user_id": 1, "total_price": -1})
  ```

- **Rate Limiting**: Consider implementing rate limiting for production use
- **Caching**: Cache frequent queries to reduce AI API calls

## Error Handling

The API handles various error scenarios:

- **MongoDB Connection Issues**: Returns 500 with descriptive error
- **Google AI API Errors**: Falls back to basic filtering
- **Invalid Query Format**: Returns 400 with validation errors
- **Authentication Errors**: Returns 401 for missing credentials

## Security Considerations

- Store API keys securely in environment variables
- Use HTTPS in production
- Implement user authentication and authorization
- Validate and sanitize all inputs
- Use connection pooling for MongoDB

## Troubleshooting

### Common Issues

1. **Connection Refused**: Make sure MongoDB is running
2. **API Key Errors**: Check your Google AI API key is valid
3. **Import Errors**: Install all dependencies with `pip install -r requirements.txt`
4. **Port Conflicts**: Change ports in the configuration if needed

### Getting Help

- Check the logs for detailed error messages
- Use the health check endpoints to verify service status
- Test with the provided client scripts first

## Future Enhancements

- [ ] Add support for more complex queries
- [ ] Implement query result caching
- [ ] Add support for file uploads and receipt parsing
- [ ] Integrate with other AI models
- [ ] Add user authentication and multi-tenancy
- [ ] Implement query history and favorites
