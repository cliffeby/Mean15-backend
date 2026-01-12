const { BlobServiceClient } = require('@azure/storage-blob');
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING && process.env.AZURE_STORAGE_CONNECTION_STRING.trim();
const AUDIT_CONTAINER_NAME = process.env.AUDIT_CONTAINER_NAME && process.env.AUDIT_CONTAINER_NAME.trim();

function isValidAzureConnectionString(conn) {
  if (!conn || typeof conn !== 'string') return false;
  const hasProtocol = /DefaultEndpointsProtocol=(https|http)/i.test(conn) || /^https:\/\/.+blob\.core\.windows\.net/i.test(conn);
  const hasAccount = /AccountName=[^;]+/i.test(conn);
  const hasKey = /AccountKey=[^;]+/i.test(conn);
  return (hasProtocol && hasAccount && hasKey) || hasProtocol;
}

exports.getAuditLogs = async (_req, res, next) => {
  try {
    if (!AZURE_STORAGE_CONNECTION_STRING || !AUDIT_CONTAINER_NAME) {
      return res.status(500).json({ error: 'Azure storage configuration missing (AZURE_STORAGE_CONNECTION_STRING or AUDIT_CONTAINER_NAME).' });
    }
    if (!isValidAzureConnectionString(AZURE_STORAGE_CONNECTION_STRING)) {
      console.error('[auditController] Invalid AZURE_STORAGE_CONNECTION_STRING:', AZURE_STORAGE_CONNECTION_STRING);
      return res.status(500).json({ error: 'Invalid Azure storage connection string.' });
    }
    let blobServiceClient;
    try {
      blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    } catch (err) {
      console.error('[auditController] Error creating BlobServiceClient:', err.message);
      return res.status(500).json({ error: 'Failed to initialize Azure Blob client.' });
    }
    const containerClient = blobServiceClient.getContainerClient(AUDIT_CONTAINER_NAME);
    const logs = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      if (blob.name.endsWith('.json')) {
        const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
        const downloadBlockBlobResponse = await blockBlobClient.download(0);
        const downloaded = await streamToString(downloadBlockBlobResponse.readableStreamBody);
        logs.push(JSON.parse(downloaded));
      }
    }
    // Sort logs by time descending
    logs.sort((a, b) => new Date(b.time) - new Date(a.time));
    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
};

// Helper to convert stream to string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
      chunks.push(data.toString());
    });
    readableStream.on('end', () => {
      resolve(chunks.join(''));
    });
    readableStream.on('error', reject);
  });
}
