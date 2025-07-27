# Copy service account from Agent-2
cp ../Agent-2/service_account.json ./

# Set environment variables
export GOOGLE_PROJECT_ID="spend-analysis-466617"
export GOOGLE_SERVICE_ACCOUNT_PATH="./service_account.json"
