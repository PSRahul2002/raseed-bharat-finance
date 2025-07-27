FROM python:3.10.14-slim-bullseye

# Update base image to latest patch and ensure security updates
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get dist-upgrade -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install system dependencies required for some Python packages and ensure all packages are up-to-date
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get dist-upgrade -y && \
    apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    build-essential \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variable to disable Gemini warnings
ENV PYTHONWARNINGS=ignore

# Command to run the application
CMD ["python", "server.py"]
