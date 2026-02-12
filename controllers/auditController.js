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
    // Pagination and filtering.
    const page = parseInt((_req.query.page || '1'), 10);
    const pageSize = parseInt((_req.query.pageSize || '50'), 10);
    const nameFilter = _req.query.name || null;
    const dateFrom = _req.query.dateFrom ? new Date(_req.query.dateFrom) : null;
    const dateTo = _req.query.dateTo ? new Date(_req.query.dateTo) : null;

    let blobs = [];
    for await (const blob of containerClient.listBlobsFlat({ includeMetadata: true })) {
      if (!blob.name.endsWith('.json')) continue;
      // Only include blobs with required metadata
      if (!blob.metadata) continue;
      // Filter by name if provided
      if (nameFilter && (!blob.metadata.name || !blob.metadata.name.includes(nameFilter))) continue;
      // Filter by date range if provided
      const blobDate = blob.metadata.date ? new Date(blob.metadata.date) : null;
      if (dateFrom && (!blobDate || blobDate < dateFrom)) continue;
      if (dateTo && (!blobDate || blobDate > dateTo)) continue;
      blobs.push({
        name: blob.name,
        metadata: blob.metadata,
      });
    }
    // Sort by date descending
    blobs.sort((a, b) => new Date(b.metadata.date) - new Date(a.metadata.date));
    // Pagination
    const total = blobs.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pagedBlobs = blobs.slice(start, end);
    // Download and parse only paged blobs
    const logs = await Promise.all(
      pagedBlobs.map(async (blob) => {
        const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
        const downloadBlockBlobResponse = await blockBlobClient.download(0);
        const downloaded = await streamToString(downloadBlockBlobResponse.readableStreamBody);
        return { ...JSON.parse(downloaded), _blobName: blob.name, _metadata: blob.metadata };
      })
    );
    res.json({
      success: true,
      logs,
      page,
      pageSize,
      total,
    });
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
