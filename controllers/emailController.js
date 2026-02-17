// backend/controllers/emailController.js
const emailService = require('../utils/emailService');
const Member = require('../models/Member');
const logger = require('../utils/logger');

/**
 * Get email service status
 */
exports.getEmailStatus = async (_req, res, next) => {
  try {
    const status = emailService.getStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    next(err);
  }
};

/**
 * Send email to specific members
 * Body: {
 *   memberIds: string[], // Array of member IDs to email
 *   subject: string,
 *   htmlContent: string,
 *   plainTextContent?: string,
 *   personalize: boolean // If true, uses {{firstName}} {{lastName}} placeholders
 * }
 */
exports.sendToMembers = async (req, res, next) => {
  try {
    const { memberIds, subject, htmlContent, plainTextContent, personalize = true } = req.body;

    // Validation
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'memberIds array is required' 
      });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject is required' 
      });
    }

    if (!htmlContent || !htmlContent.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email content is required' 
      });
    }

    // Check if email service is configured
    if (!emailService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Email service is not configured. Please contact administrator.'
      });
    }

    // Fetch members
    const members = await Member.find({ 
      _id: { $in: memberIds },
      Email: { $exists: true, $ne: null, $ne: '' }
    }).select('Email firstName lastName').lean();

    if (members.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No members found with valid email addresses'
      });
    }

    // Prepare recipients
    const recipients = members.map(member => ({
      email: member.Email,
      firstName: member.firstName,
      lastName: member.lastName
    }));

    logger.info(`Sending email to ${recipients.length} members. Subject: "${subject}". Requested by: ${req.author?.email || 'unknown'}`);

    // Send emails
    let result;
    if (personalize && (htmlContent.includes('{{firstName}}') || htmlContent.includes('{{lastName}}'))) {
      // Send individually with personalization
      result = await emailService.sendBulkEmail({
        recipients,
        subject,
        htmlContent,
        plainTextContent
      });
    } else {
      // Send all at once (no personalization)
      // Pass recipient objects with displayName so To: includes name <email>
      const emailTargets = recipients.map(r => ({ email: r.email, displayName: `${r.firstName || ''} ${r.lastName || ''}`.trim() }));
      // include cc from request if present
      result = await emailService.sendEmail({
        to: emailTargets,
        cc: req.body.cc || null,
        subject,
        htmlContent,
        plainTextContent
      });
    }

    // Write detailed audit log for this email operation, including failures if any
    try {
      const auditLogger = require('../middleware/auditLogger');
      const logEntry = {
        time: new Date().toISOString(),
        route: req.originalUrl,
        action: 'email.send',
        subject,
        requestedBy: req.author?.email || req.author?.name || 'unknown',
        recipientCount: result.recipientCount || recipients.length || 0,
        failedCount: result.failed || result.invalidEmails || 0,
        errors: result.errors || null
      };
      // fire-and-forget
      auditLogger.writeAuditLog(logEntry).catch(err => console.error('Audit write error:', err));
    } catch (e) {
      console.error('Audit logger not available:', e);
    }

    res.json({
      success: true,
      message: 'Email sent successfully',
      ...result
    });

  } catch (err) {
    logger.error('Error sending email to members:', err);
    next(err);
  }
};

/**
 * Send email to all members (optionally filtered by having email)
 * Body: {
 *   subject: string,
 *   htmlContent: string,
 *   plainTextContent?: string,
 *   personalize: boolean,
 *   includeHidden: boolean // Include hidden members
 * }
 */
exports.sendToAllMembers = async (req, res, next) => {
  try {
    const { subject, htmlContent, plainTextContent, personalize = true, includeHidden = false } = req.body;

    // Validation
    if (!subject || !subject.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject is required' 
      });
    }

    if (!htmlContent || !htmlContent.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email content is required' 
      });
    }

    // Check if email service is configured
    if (!emailService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Email service is not configured. Please contact administrator.'
      });
    }

    // Build query filter
    const filter = {
      Email: { $exists: true, $ne: null, $ne: '' }
    };
    
    if (!includeHidden) {
      filter.hidden = { $ne: true };
    }

    // Fetch all members with email
    const members = await Member.find(filter)
      .select('Email firstName lastName')
      .lean();

    if (members.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No members found with valid email addresses'
      });
    }

    // Prepare recipients
    const recipients = members.map(member => ({
      email: member.Email,
      firstName: member.firstName,
      lastName: member.lastName
    }));

    logger.info(`Sending email to ALL members (${recipients.length} recipients). Subject: "${subject}". Requested by: ${req.author?.email || 'unknown'}`);

    // Send emails
    let result;
    if (personalize && (htmlContent.includes('{{firstName}}') || htmlContent.includes('{{lastName}}'))) {
      // Send individually with personalization
      result = await emailService.sendBulkEmail({
        recipients,
        subject,
        htmlContent,
        plainTextContent
      });
    } else {
      // Send all at once (no personalization)
      const emailTargets = recipients.map(r => ({ email: r.email, displayName: `${r.firstName || ''} ${r.lastName || ''}`.trim() }));
      result = await emailService.sendEmail({
        to: emailTargets,
        cc: req.body.cc || null,
        subject,
        htmlContent,
        plainTextContent
      });
    }

    res.json({
      success: true,
      message: 'Email sent to all members successfully',
      ...result
    });

  } catch (err) {
    logger.error('Error sending email to all members:', err);
    next(err);
  }
};

/**
 * Test email - send a test email to the requesting user
 * Body: {
 *   testEmail: string // Email address to send test to
 * }
 */
exports.sendTestEmail = async (req, res, next) => {
  try {
    const { testEmail } = req.body;
    
    const recipientEmail = testEmail || req.author?.email;
    
    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Test email address is required'
      });
    }

    if (!emailService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Email service is not configured. Please contact administrator.'
      });
    }

    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Test Email from Member Management System',
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2c3e50;">Test Email</h2>
            <p>This is a test email from your Member Management System.</p>
            <p>If you received this, your Azure Communication Services integration is working correctly!</p>
            <hr style="margin: 20px 0;">
            <p style="color: #7f8c8d; font-size: 12px;">
              Sent at: ${new Date().toISOString()}<br>
              Requested by: ${req.author?.email || 'unknown'}
            </p>
          </body>
        </html>
      `,
      plainTextContent: 'This is a test email from your Member Management System. If you received this, your Azure Communication Services integration is working correctly!'
    });

    res.json({
      success: true,
      message: `Test email sent to ${recipientEmail}`,
      ...result
    });

  } catch (err) {
    logger.error('Error sending test email:', err);
    next(err);
  }
};
