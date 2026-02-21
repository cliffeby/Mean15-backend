// backend/routes/emailWebhookRoutes.js
const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { writeAuditLog } = require('../middleware/auditLogger');
const Member = require('../models/Member');

/**
 * Webhook endpoint for Azure Communication Services Email Events
 * Handles delivery status notifications from Event Grid
 * 
 * Event types:
 * - Microsoft.Communication.EmailDeliveryReportReceived (delivery success/failure)
 * - Microsoft.Communication.EmailEngagementTrackingReportReceived (opens/clicks)
 */
router.post('/events', async (req, res) => {
  try {
    const events = req.body;
    
    // Event Grid sends validation requests
    if (Array.isArray(events) && events.length > 0) {
      const firstEvent = events[0];
      
      // Handle Event Grid validation handshake
      if (firstEvent.eventType === 'Microsoft.EventGrid.SubscriptionValidationEvent') {
        logger.info('Received Event Grid validation request');
        return res.json({ validationResponse: firstEvent.data.validationCode });
      }
    }
    
    // Process email delivery events
    for (const event of events) {
      await processEmailEvent(event);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error processing email webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

async function processEmailEvent(event) {
  const eventType = event.eventType;
  const data = event.data;
  
  logger.info(`Processing email event: ${eventType}`, {
    messageId: data.messageId,
    recipient: data.recipient,
    deliveryStatus: data.deliveryStatus
  });
  
  switch (eventType) {
    case 'Microsoft.Communication.EmailDeliveryReportReceived':
      await handleDeliveryReport(data);
      break;
    case 'Microsoft.Communication.EmailEngagementTrackingReportReceived':
      await handleEngagementReport(data);
      break;
    default:
      logger.warn(`Unknown email event type: ${eventType}`);
  }
}

async function handleDeliveryReport(data) {
  const { messageId, recipient, deliveryStatus, deliveryStatusDetails } = data;
  
  // Delivery statuses: Delivered, Failed, Quarantined, Suppressed
  if (deliveryStatus === 'Failed' || deliveryStatus === 'Suppressed' || deliveryStatus === 'Quarantined') {
    logger.error(`Email delivery failed for ${recipient}`, {
      messageId,
      status: deliveryStatus,
      details: deliveryStatusDetails
    });
    
    // Write to audit log for tracking
    await writeAuditLog({
      action: 'EMAIL_BOUNCE',
      resource: 'email',
      details: {
        recipient,
        messageId,
        deliveryStatus,
        deliveryStatusDetails: deliveryStatusDetails?.statusMessage || 'Unknown error',
        errorCode: deliveryStatusDetails?.errorCode || null,
        timestamp: new Date().toISOString()
      },
      author: { id: 'system', email: 'system', name: 'Email Service' }
    });

    // Determine bounce type from error code
    // ACS error codes: 5xx = hard bounce (permanent), 4xx = soft bounce (transient)
    const errorCode = deliveryStatusDetails?.errorCode || '';
    const statusMessage = (deliveryStatusDetails?.statusMessage || '').toLowerCase();
    let bounceStatus = 'soft_bounce';

    if (deliveryStatus === 'Suppressed') {
      bounceStatus = 'suppressed';
    } else if (
      String(errorCode).startsWith('5') ||
      statusMessage.includes('invalid') ||
      statusMessage.includes('does not exist') ||
      statusMessage.includes('user unknown') ||
      statusMessage.includes('no such user') ||
      statusMessage.includes('permanent')
    ) {
      bounceStatus = 'hard_bounce';
    }

    // Find the member by email and update their bounce status
    const member = await Member.findOne({ Email: new RegExp(`^${recipient}$`, 'i') });
    if (member) {
      const newBounceCount = (member.emailBounceCount || 0) + 1;
      // After 3 soft bounces, escalate to hard
      const finalStatus = bounceStatus === 'soft_bounce' && newBounceCount >= 3
        ? 'hard_bounce'
        : bounceStatus;

      await Member.findByIdAndUpdate(member._id, {
        emailBounceStatus: finalStatus,
        emailBounceCount: newBounceCount,
        emailLastBounceAt: new Date(),
        emailLastBounceReason: deliveryStatusDetails?.statusMessage || deliveryStatus
      });

      logger.info(`Marked member ${member._id} email as ${finalStatus} (${newBounceCount} bounces)`);
    } else {
      logger.warn(`No member found with email ${recipient} for bounce tracking`);
    }

  } else if (deliveryStatus === 'Delivered') {
    logger.info(`Email delivered successfully to ${recipient}`, { messageId });

    // Reset bounce count on successful delivery
    await Member.findOneAndUpdate(
      { Email: new RegExp(`^${recipient}$`, 'i'), emailBounceStatus: { $ne: 'hard_bounce' } },
      { emailBounceStatus: 'ok', emailBounceCount: 0 }
    );
  }
}

async function handleEngagementReport(data) {
  const { messageId, recipient, engagementType, userAgent } = data;
  
  logger.info(`Email engagement: ${engagementType} by ${recipient}`, {
    messageId,
    userAgent
  });
  
  // engagementType: view (opened) or click
  // Can track open rates and click rates for analytics
}

module.exports = router;
