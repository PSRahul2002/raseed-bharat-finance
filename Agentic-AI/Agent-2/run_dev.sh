#!/bin/bash

# Development server runner for Agent-2
# This script activates the virtual environment and runs the server

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo -e "${RED}❌ Virtual environment not found${NC}"
    echo -e "${YELLOW}Run setup first: ./setup.sh${NC}"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found, using environment variables${NC}"
fi

echo -e "${GREEN}🚀 Starting Receipt Storage and Wallet API${NC}"

# Activate virtual environment
source .venv/bin/activate

# Load environment variables if .env exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}📁 Loading environment variables from .env${NC}"
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check required environment variables
if [ -z "$GOOGLE_PROJECT_ID" ]; then
    echo -e "${RED}❌ GOOGLE_PROJECT_ID not set${NC}"
    echo "Please set it in .env file or export GOOGLE_PROJECT_ID=your-project-id"
    exit 1
fi

if [ -z "$GOOGLE_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  GOOGLE_API_KEY not set - API functionality will be limited${NC}"
fi

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Project ID: $GOOGLE_PROJECT_ID"
echo "  API Key: ${GOOGLE_API_KEY:+Set}${GOOGLE_API_KEY:-Not set}"
echo "  Port: ${PORT:-8081}"

# Run the server with hot reload for development
echo -e "${GREEN}🌐 Starting server at http://localhost:${PORT:-8081}${NC}"
echo -e "${GREEN}📖 API docs available at http://localhost:${PORT:-8081}/docs${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"

uvicorn main:app --host 0.0.0.0 --port ${PORT:-8081} --reload
