#!/bin/bash

# Setup script for Receipt Storage and Wallet API (Agent-2)
# This script sets up the virtual environment and installs dependencies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Setting up Receipt Storage and Wallet API (Agent-2)${NC}"
echo "=" * 60

# Check if Python 3.11+ is available
python_cmd=""
if command -v python3.11 &> /dev/null; then
    python_cmd="python3.11"
elif command -v python3.12 &> /dev/null; then
    python_cmd="python3.12"
elif command -v python3 &> /dev/null; then
    python_version=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1-2)
    if [[ $(echo "$python_version >= 3.11" | bc -l) -eq 1 ]]; then
        python_cmd="python3"
    fi
fi

if [ -z "$python_cmd" ]; then
    echo -e "${RED}❌ Error: Python 3.11+ is required but not found${NC}"
    echo "Please install Python 3.11 or higher"
    exit 1
fi

echo -e "${BLUE}🐍 Using Python: $($python_cmd --version)${NC}"

# Create virtual environment
echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
if [ ! -d ".venv" ]; then
    $python_cmd -m venv .venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
else
    echo -e "${YELLOW}⚠️  Virtual environment already exists${NC}"
fi

# Activate virtual environment
echo -e "${YELLOW}🔄 Activating virtual environment...${NC}"
source .venv/bin/activate

# Upgrade pip
echo -e "${YELLOW}⬆️  Upgrading pip...${NC}"
pip install --upgrade pip

# Install dependencies
echo -e "${YELLOW}📚 Installing dependencies...${NC}"
pip install -r requirements.txt

echo -e "${GREEN}✅ Dependencies installed successfully${NC}"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Creating .env file from template...${NC}"
    cp .env.template .env
    echo -e "${YELLOW}⚠️  Please edit .env file with your actual configuration values${NC}"
else
    echo -e "${BLUE}ℹ️  .env file already exists${NC}"
fi

# Display next steps
echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Edit the .env file with your Google Cloud configuration:"
echo "   nano .env"
echo ""
echo "2. Activate the virtual environment:"
echo "   source .venv/bin/activate"
echo ""
echo "3. Run the application:"
echo "   python main.py"
echo ""
echo "4. Or run with uvicorn directly:"
echo "   uvicorn main:app --host 0.0.0.0 --port 8081 --reload"
echo ""
echo -e "${BLUE}🌐 The API will be available at: http://localhost:8081${NC}"
echo -e "${BLUE}📖 API Documentation: http://localhost:8081/docs${NC}"
echo ""
echo -e "${YELLOW}🧪 Test the setup:${NC}"
echo "   python test_client.py"
