# Azure Communication Services Email Setup Guide

## Prerequisites

1. **Azure Communication Services Email Resource**
   - You mentioned you already have Azure Communication Services running
   - Make sure you have an Email Communication Service configured

2. **Get Your Configuration Values**
   
   From Azure Portal:
   
   a. **Connection String:**
      - Go to your Azure Communication Service resource
      - Navigate to "Keys" in the left menu
      - Copy the "Connection string" (Primary or Secondary)
   
   b. **Sender Email Address:**
      - Go to your Email Communication Service resource
      - Navigate to "Provision domains" → Select your domain
      - Note your verified sender address (e.g., `DoNotReply@yourdomain.com`)

## Backend Configuration

Add these environment variables to your backend `.env` file:

```bash
# Azure Communication Services Email
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://your-resource.communication.azure.com/;accesskey=your-access-key
AZURE_COMMUNICATION_SENDER_EMAIL=DoNotReply@yourdomain.com
```

### Example `.env` file structure:
```bash
# MongoDB/Database
MONGO_URI=mongodb://localhost:27017/your-database

# Microsoft Entra ID (Authentication)
ENTRA_TENANT_ID=your-tenant-id
ENTRA_CLIENT_ID=your-client-id

# Azure Communication Services Email
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://your-resource.communication.azure.com/;accesskey=your-access-key
AZURE_COMMUNICATION_SENDER_EMAIL=DoNotReply@yourdomain.com

# Node Environment
NODE_ENV=development
PORT=5001
```

## API Endpoints Created

### 1. Check Email Service Status
```http
GET /api/email/status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "configured": true,
  "hasConnectionString": true,
  "hasSenderAddress": true,
  "senderAddress": "DoNotReply@yourdomain.com"
}
```

### 2. Send Test Email
```http
POST /api/email/test
Authorization: Bearer {token}
Content-Type: application/json

{
  "testEmail": "your-email@example.com"
}
```

### 3. Send Email to Specific Members
```http
POST /api/email/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "memberIds": ["member-id-1", "member-id-2"],
  "subject": "Welcome to our Golf League",
  "htmlContent": "<h1>Hello {{firstName}} {{lastName}}</h1><p>Welcome!</p>",
  "plainTextContent": "Hello {{firstName}} {{lastName}}, Welcome!",
  "personalize": true
}
```

### 4. Send Email to ALL Members
```http
POST /api/email/send-all
Authorization: Bearer {token}
Content-Type: application/json

{
  "subject": "League Announcement",
  "htmlContent": "<h1>Important Announcement</h1><p>Dear Members...</p>",
  "plainTextContent": "Important Announcement: Dear Members...",
  "personalize": false,
  "includeHidden": false
}
```

## Features

### ✅ Personalization
Use `{{firstName}}` and `{{lastName}}` in your email content to personalize emails:
```html
<p>Dear {{firstName}} {{lastName}},</p>
<p>Your rochIndex has been updated...</p>
```

### ✅ Bulk Sending
- **Individual mode**: Each member gets a personalized email (slower but personalized)
- **Batch mode**: All members in one email (faster for announcements)

### ✅ Validation
- Automatically filters out members without email addresses
- Validates email format before sending
- Returns detailed results (success/failure counts)

### ✅ Security
- All email endpoints require **admin role**
- Audit logging for all email operations
- JWT authentication required

## Testing

1. **Start your backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Test the configuration:**
   Use the frontend "Send Email" feature, or test via API:
   ```bash
   # Check status
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5001/api/email/status
   
   # Send test email
   curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"testEmail":"your-email@example.com"}' \
        http://localhost:5001/api/email/test
   ```

## Troubleshooting

### "Email service is not configured"
- Check that both environment variables are set in `.env`
- Restart your backend server after adding variables
- Verify the connection string format is correct

### "Failed to send email"
- Verify your Azure Communication Service is active
- Check that your sender domain is verified in Azure
- Ensure your connection string has the correct access key
- Check backend logs for detailed error messages

### "No valid email addresses"
- Verify members have Email field populated in database
- Check for typos in email addresses
- Hidden members are excluded by default (unless includeHidden: true)

## Azure Communication Services Setup (If Needed)

If you need to set up Azure Communication Services from scratch:

1. **Create Email Communication Service:**
   - Azure Portal → Create Resource → "Email Communication Services"
   - Choose your subscription and resource group
   - Create the resource

2. **Configure Domain:**
   - In your Email Communication Service, go to "Provision domains"
   - Add an Azure Managed Domain (free) or your custom domain
   - Wait for verification (managed domains are instant)

3. **Connect to Communication Service:**
   - Create or use existing Communication Service resource
   - Go to "Email" → "Connect Email"
   - Select your Email Communication Service

4. **Get Connection String:**
   - Communication Service → Keys → Copy connection string

## Rate Limits

Azure Communication Services has rate limits:
- **Email Service:** 30 emails per minute (free tier)
- Consider delays between bulk emails if you have many members
- The service automatically handles polling for email status

## Next Steps

After configuration:
1. Add the environment variables to your `.env` file
2. Restart the backend server
3. Use the frontend email dialog to compose and send emails
4. Monitor the backend logs for email delivery status
