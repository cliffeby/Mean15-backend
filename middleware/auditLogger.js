
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');

// Get connection string and container name from environment variables
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AUDIT_CONTAINER_NAME = process.env.AUDIT_CONTAINER_NAME;

let blobServiceClient;
let containerClient;
if (AZURE_STORAGE_CONNECTION_STRING) {
  blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  containerClient = blobServiceClient.getContainerClient(AUDIT_CONTAINER_NAME);
}

async function writeAuditLogToBlob(logEntry) {
  if (!containerClient) return;
  const blobName = `audit-${new Date().toISOString()}-${uuidv4()}.json`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.upload(JSON.stringify(logEntry), Buffer.byteLength(JSON.stringify(logEntry)));
}


function auditLogger(req, _res, next) {
 
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const logEntry = {
      time: new Date().toISOString(),
      method: req.method,
      route: req.originalUrl,
      name: req.body.name,
      author: req.body.author?.name || null,
    };
    writeAuditLogToBlob(logEntry).catch(err => {
      console.error('Azure Blob audit log error:', err);
    });
  }
  next();
}

module.exports = auditLogger;
