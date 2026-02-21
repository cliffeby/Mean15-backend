# Email Bounce Tracking Setup

## Current Status 🚧

**Note:** Azure Communication Services EmailServices resources do not currently support Event Grid System Topics for delivery status notifications. This feature appears to be unavailable or in private preview.

The webhook infrastructure has been implemented in this codebase (see [emailWebhookRoutes.js](routes/emailWebhookRoutes.js)) and will be ready to use once Microsoft adds Event Grid support for `Microsoft.Communication.EmailServices` resources.

## Alternative: Manual Status Checking

Until Event Grid support is available, you can poll message status using the Azure Communication Services SDK:

```javascript
// Check email delivery status (polling approach)
async function checkEmailStatus(messageId) {
  const status = await emailClient.getMessageStatus(messageId);
  return {
    messageId,
    status: status.status, // Queued, Sent, Delivered, Failed
    error: status.error
  };
}
```

## When Event Grid Becomes Available

Once Microsoft adds Event Grid support for EmailServices, follow these steps:

### 1. Create Event Grid System Topic

**Prerequisites:**
- Azure Communication Services EmailServices must support Event Grid (currently unavailable)
- Verify support by checking: `az eventgrid topic-type list | grep Email`

```bash
# Variables (UPDATED with correct values)
RESOURCE_GROUP="roch"
LOCATION="global"
ACS_RESOURCE_NAME="rochemail"
ACS_RESOURCE_TYPE="EmailServices"  # Note: Not yet supported by Event Grid
WEBHOOK_URL="https://rochwebappeasttwo-cffheedghmhpb7ad.eastus-01.azurewebsites.net/api/email/webhook/events"

# Create Event Grid System Topic for Azure Communication Services
az eventgrid system-topic create \
  --name "acs-email-events" \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --topic-type "Microsoft.Communication.CommunicationServices" \
  --source "/subscriptions/<YOUR_SUBSCRIPTION_ID>/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Communication/CommunicationServices/$ACS_RESOURCE_NAME"
```

### 2. Create Event Subscription

```bash
# Subscribe to email delivery events
az eventgrid system-topic event-subscription create \
  --name "email-delivery-webhook" \
  --resource-group $RESOURCE_GROUP \
  --system-topic-name "acs-email-events" \
  --endpoint $WEBHOOK_URL \
  --endpoint-type webhook \
  --included-event-types \
    "Microsoft.Communication.EmailDeliveryReportReceived" \
    "Microsoft.Communication.EmailEngagementTrackingReportReceived"
```

### 3. Update Backend App Configuration

Add the webhook route to `app.js`:

```javascript
const emailWebhookRoutes = require('./routes/emailWebhookRoutes');

// ... existing code ...

// Email webhook endpoint (before auth middleware)
app.use('/api/email/webhook', emailWebhookRoutes);
```

### 4. Enable Email Engagement Tracking (Optional)

Update `emailService.js` to enable tracking:

```javascript
const emailMessage = {
  senderAddress: this.senderAddress,
  content: {
    subject: subject,
    html: htmlContent,
    ...(plainTextContent && { plainText: plainTextContent })
  },
  recipients: {
    to: validRecipients.map(...)
  },
  userEngagementTrackingDisabled: false  // Enable open/click tracking
};
```

## Event Types

### EmailDeliveryReportReceived
Sent when email delivery succeeds or fails.

**Delivery Statuses:**
- `Delivered` - Email successfully delivered
- `Failed` - Permanent failure (invalid mailbox, domain doesn't exist)
- `Quarantined` - Spam filter or security policy blocked
- `Suppressed` - Recipient previously unsubscribed or bounced repeatedly

**Example Payload:**
```json
{
  "id": "unique-event-id",
  "eventType": "Microsoft.Communication.EmailDeliveryReportReceived",
  "subject": "Microsoft.Communication/CommunicationServices/EmailDelivery",
  "eventTime": "2026-02-17T10:30:00Z",
  "data": {
    "messageId": "outgoing-message-id",
    "recipient": "user@example.com",
    "sender": "noreply@yourdomain.com",
    "deliveryStatus": "Failed",
    "deliveryStatusDetails": {
      "statusMessage": "550 5.1.1 Mailbox does not exist",
      "errorCode": "550"
    }
  }
}
```

### EmailEngagementTrackingReportReceived
Sent when recipient opens email or clicks a link.

**Engagement Types:**
- `view` - Email opened
- `click` - Link clicked

## Bounce Management Strategy

### Hard Bounces (Permanent Failures)
- Invalid email address
- Domain doesn't exist
- Mailbox doesn't exist

**Action:** Mark email as invalid after first hard bounce

### Soft Bounces (Temporary Failures)
- Mailbox full
- Server temporarily unavailable
- Message too large

**Action:** Retry up to 3 times over 24 hours, then mark as problematic

### Implementation

Add to Member model:
```javascript
{
  email: String,
  emailStatus: {
    type: String,
    enum: ['valid', 'bounced', 'complained', 'suppressed'],
    default: 'valid'
  },
  bounceCount: { type: Number, default: 0 },
  lastBounceDate: Date,
  lastBounceReason: String
}
```

## Testing

### Test Bounce Handling
Azure Communication Services provides test email addresses:

```javascript
// These addresses trigger specific responses
const testAddresses = {
  success: 'success@simulator.azurecommunicationservices.net',
  bounce: 'bounce@simulator.azurecommunicationservices.net',
  suppressed: 'suppressed@simulator.azurecommunicationservices.net'
};
```

Send test emails to these addresses and verify your webhook receives events.

## Monitoring

View webhook delivery status:
```bash
az eventgrid system-topic event-subscription show \
  --name "email-delivery-webhook" \
  --resource-group $RESOURCE_GROUP \
  --system-topic-name "acs-email-events"
```

View Event Grid metrics in Azure Portal:
- Navigation: Event Grid System Topic → Metrics
- Metrics: Delivery Success Rate, Failed Events, Dead-lettered Events

## Security

The webhook endpoint should validate Event Grid requests:

```javascript
// Add signature validation (recommended for production)
const crypto = require('crypto');

function validateEventGridSignature(req) {
  const signature = req.headers['aeg-signature'];
  const token = req.headers['aeg-sas-token'];
  // Implement validation logic
}
```

## Audit Log Integration

Bounced emails are automatically written to Azure Blob Storage audit logs with:
- Recipient email
- Bounce reason
- Error code
- Timestamp
- Message ID

Query audit logs for bounce analysis in the Audit Report UI.

## Next Steps

1. Run the Event Grid setup commands above
2. Add webhook route to `app.js`
3. Deploy backend to Azure
4. Test with simulator addresses
5. (Optional) Implement Member.emailStatus tracking
6. (Optional) Add bounce report in frontend admin UI
