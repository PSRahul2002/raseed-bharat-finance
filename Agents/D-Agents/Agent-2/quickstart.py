#!/usr/bin/env python3
"""
Quick start script for Agent-2 API
This script will help you set up and test the Receipt Storage and Wallet API
"""

import os
import sys
import subprocess
import json

def check_environment():
    """Check if environment variables are set"""
    required_vars = ["GOOGLE_PROJECT_ID", "GOOGLE_API_KEY"]
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    return missing_vars

def setup_env_file():
    """Create or update .env file"""
    if not os.path.exists(".env"):
        print("📝 Creating .env file from template...")
        subprocess.run(["cp", ".env.template", ".env"])
        print("✅ .env file created")
        print("⚠️  Please edit .env file with your actual configuration values")
        return False
    return True

def test_imports():
    """Test if all required packages are installed"""
    try:
        import fastapi
        import uvicorn
        import google.generativeai
        import google.cloud.firestore
        import google.cloud.aiplatform
        print("✅ All required packages are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing package: {e}")
        return False

def show_next_steps():
    """Show next steps to the user"""
    print("\n" + "="*60)
    print("🎉 Agent-2 Setup Complete!")
    print("="*60)
    print("\n📋 Next Steps:")
    print("1. Edit the .env file with your configuration:")
    print("   nano .env")
    print("\n2. Set your Google Cloud Project ID:")
    print("   export GOOGLE_PROJECT_ID=your-project-id")
    print("\n3. Set your Google AI API Key:")
    print("   export GOOGLE_API_KEY=your-api-key")
    print("\n4. Run the development server:")
    print("   ./run_dev.sh")
    print("\n5. Or run manually:")
    print("   source .venv/bin/activate")
    print("   python main.py")
    print("\n🌐 The API will be available at: http://localhost:8081")
    print("📖 API Documentation: http://localhost:8081/docs")
    print("\n🧪 Test the API:")
    print("   python test_client.py")

def main():
    print("🚀 Setting up Receipt Storage and Wallet API (Agent-2)")
    print("="*60)
    
    # Check if we're in a virtual environment
    if not os.getenv('VIRTUAL_ENV'):
        print("⚠️  Virtual environment not detected")
        print("Please activate the virtual environment: source .venv/bin/activate")
        return
    
    print("✅ Virtual environment active")
    
    # Test imports
    if not test_imports():
        print("❌ Please install requirements: pip install -r requirements.txt")
        return
    
    # Setup .env file
    env_exists = setup_env_file()
    
    # Check environment variables
    missing_vars = check_environment()
    if missing_vars:
        print(f"\n⚠️  Missing environment variables: {', '.join(missing_vars)}")
        print("Please set them in .env file or export them")
    
    # Show next steps
    show_next_steps()

if __name__ == "__main__":
    main()
