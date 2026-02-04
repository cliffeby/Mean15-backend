
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');

// Get connection string and container name from environment variables

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING && process.env.AZURE_STORAGE_CONNECTION_STRING.trim();
const AUDIT_CONTAINER_NAME = process.env.AUDIT_CONTAINER_NAME && process.env.AUDIT_CONTAINER_NAME.trim();

let blobServiceClient;
let containerClient;

function isValidAzureConnectionString(conn) {
  if (!conn || typeof conn !== 'string') return false;
  // must contain DefaultEndpointsProtocol and AccountName and AccountKey
  const hasProtocol = /DefaultEndpointsProtocol=(https|http)/i.test(conn);
  const hasAccount = /AccountName=[^;]+/i.test(conn);
  const hasKey = /AccountKey=[^;]+/i.test(conn);
  return hasProtocol && hasAccount && hasKey;
}

if (!AZURE_STORAGE_CONNECTION_STRING) {
  console.warn('[Azure AuditLogger] AZURE_STORAGE_CONNECTION_STRING not set. Audit logs will NOT be written to Azure Blob Storage.');
} else if (!isValidAzureConnectionString(AZURE_STORAGE_CONNECTION_STRING)) {
  console.error('[Azure AuditLogger] Invalid AZURE_STORAGE_CONNECTION_STRING format. Audit logs will NOT be written to Azure Blob Storage.');
} else {
  try {
    blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    containerClient = blobServiceClient.getContainerClient(AUDIT_CONTAINER_NAME);
  } catch (err) {
    console.error('[Azure AuditLogger] Error creating BlobServiceClient:', err.message);
    containerClient = null;
  }
}


async function writeAuditLogToBlob(logEntry) {
  if (!containerClient) {
    // Optionally, log to console for local/dev visibility
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Azure AuditLogger] Audit log not written to Azure Blob. Log entry:', logEntry);
    }
    return;
  }
  const blobName = `audit-${new Date().toISOString()}-${uuidv4()}.json`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  // Add name to metadata if present
  const metadata = {
    date: new Date().toISOString(),
    name: logEntry.name ? String(logEntry.name) : '',
  };
  await blockBlobClient.upload(JSON.stringify(logEntry), Buffer.byteLength(JSON.stringify(logEntry)), {
    blobHTTPHeaders: { blobContentType: "application/json" },
    metadata,
  });
}


function auditLogger(req, _res, next) {

  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    const body = req.body || {};
    const logEntry = {
      time: new Date().toISOString(),
      method: req.method,
      route: req.originalUrl,
      name:body.name ??
        (body.lastName && body.firstName ? `${body.lastName},${body.firstName}` : req.query.name ?? null),
      author: req.author?.name || req.author?.email || body.author?.name || req.query.author || null,
    };
    writeAuditLogToBlob(logEntry).catch(err => {
      console.error('Azure Blob audit log error:', err);
    });
    } else if (["DELETE"].includes(req.method)) {
      const logEntry = {
        time: new Date().toISOString(),
        method: req.method,
        route: req.originalUrl,
        name: req.query.name || null,
        author: req.author?.name || req.author?.email || req.query.author || null,
      };
      writeAuditLogToBlob(logEntry).catch(err => {
        console.error('Azure Blob audit log error:', err);
      });
    }


  next();
}

module.exports = auditLogger;
