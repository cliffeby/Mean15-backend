# Connecting to Azure Cosmos DB (MongoDB API)

1. Get your Cosmos DB connection string from the Azure Portal (MongoDB API).
2. Set the environment variable `MONGO_URI` to your Cosmos DB connection string:
   - Windows PowerShell: `$env:MONGO_URI = "<your-cosmos-uri>"`
   - Or add to your `.env` file if used.
3. The backend will use this URI automatically for database connections.

## Migrating Data from Local MongoDB

1. Export your local MongoDB data:
   - `mongodump --uri="mongodb://localhost:27017/auto_loan_app" --out=./dump`
2. Import to Cosmos DB:
   - `mongorestore --uri="<your-cosmos-uri>" ./dump`
3. Validate migration by running the backend and checking data.
