// backend/utils/emailService.js
const { EmailClient } = require('@azure/communication-email');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
    this.senderAddress = process.env.AZURE_COMMUNICATION_SENDER_EMAIL;
    
    if (!this.connectionString) {
      logger.warn('Azure Communication Services connection string not configured');
    }
    
    if (!this.senderAddress) {
      logger.warn('Azure Communication Services sender email not configured');
    }
    
    this.client = this.connectionString ? new EmailClient(this.connectionString) : null;
  }

  /**
   * Send email to single or multiple recipients
   * @param {Object} params - Email parameters
   * @param {string|string[]} params.to - Recipient email(s)
   * @param {string} params.subject - Email subject
   * @param {string} params.htmlContent - HTML email body
   * @param {string} params.plainTextContent - Plain text email body (optional)
   * @param {string} params.replyTo - Reply-to email address (optional)
   * @returns {Promise<Object>} Result with messageId and status
   */
  async sendEmail({ to, cc = null, subject, htmlContent, plainTextContent = null, replyTo = null }) {
    if (!this.client) {
      throw new Error('Azure Communication Services not configured. Please set AZURE_COMMUNICATION_CONNECTION_STRING.');
    }

    if (!this.senderAddress) {
      throw new Error('Sender email not configured. Please set AZURE_COMMUNICATION_SENDER_EMAIL.');
    }

    // Normalize recipients to array (allow strings or objects)
    const rawRecipients = Array.isArray(to) ? to : [to];

    // Validate recipients
    if (!rawRecipients || rawRecipients.length === 0) {
      throw new Error('No recipients provided');
    }

    // Normalize into objects { email, displayName }
    const normalized = rawRecipients.map(r => {
      if (typeof r === 'string') {
        return { email: r };
      }
      // support { email, displayName } or { address } or { firstName, lastName, email }
      return {
        email: r.email || r.address || r.to || null,
        displayName: r.displayName || r.name || (r.firstName || r.lastName ? `${r.firstName || ''} ${r.lastName || ''}`.trim() : null)
      };
    });

    // Filter out invalid emails and track which ones are invalid
    const validRecipients = [];
    const invalidEmails = [];
    
    normalized.forEach(rec => {
      if (rec.email && this.validateEmail(rec.email)) {
        validRecipients.push(rec);
      } else if (rec.email) {
        invalidEmails.push(rec.email);
      }
    });

    if (validRecipients.length === 0) {
      throw new Error('No valid email addresses provided');
    }

    const emailMessage = {
      senderAddress: this.senderAddress,
      content: {
        subject: subject,
        html: htmlContent,
        ...(plainTextContent && { plainText: plainTextContent })
      },
      recipients: {
        to: validRecipients.map(r => {
          const displayNameForHeader = r.displayName ? `${r.displayName} <${r.email}>` : r.email;
          return { address: r.email, ...(displayNameForHeader ? { displayName: displayNameForHeader } : {}) };
        })
      },
      ...(replyTo && { replyTo: [{ address: replyTo }] })
    };

    // If cc provided, normalize and add cc recipients
    if (cc) {
      const rawCc = Array.isArray(cc) ? cc : [cc];
      const normalizedCc = rawCc.map(r => {
        if (typeof r === 'string') return { email: r };
        return { email: r.email || r.address || null, displayName: r.displayName || r.name || null };
      }).filter(r => r.email && this.validateEmail(r.email));
      // Remove any CC addresses that are also in the To list (avoid duplicates)
      const toEmailsLower = new Set(validRecipients.map(v => v.email.toLowerCase()));
      const filteredCc = normalizedCc.filter(r => !toEmailsLower.has(r.email.toLowerCase()));
      if (filteredCc.length > 0) {
        emailMessage.recipients.cc = filteredCc.map(r => {
          const displayNameForHeader = r.displayName ? `${r.displayName} <${r.email}>` : r.email;
          return { address: r.email, ...(displayNameForHeader ? { displayName: displayNameForHeader } : {}) };
        });
      }
    }

    try {
      logger.info(`Sending email to ${validRecipients.length} recipient(s): ${subject}`);
      
      const poller = await this.client.beginSend(emailMessage);
      const result = await poller.pollUntilDone();
      
      logger.info(`Email sent successfully. Message ID: ${result.id}, Status: ${result.status}`);
      
      return {
        success: true,
        messageId: result.id,
        status: result.status,
        recipientCount: validRecipients.length,
        invalidEmails: invalidEmails.length,
        invalidEmailAddresses: invalidEmails
      };
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send email to multiple recipients individually (each gets their own email)
   * @param {Object} params - Email parameters
   * @param {Array<{email: string, firstName?: string, lastName?: string}>} params.recipients - Array of recipient objects
   * @param {string} params.subject - Email subject
   * @param {string} params.htmlContent - HTML email body (can include {{firstName}}, {{lastName}} placeholders)
   * @param {string} params.plainTextContent - Plain text email body (optional)
   * @returns {Promise<Object>} Results with success/failure counts
   */
  async sendBulkEmail({ recipients, subject, htmlContent, plainTextContent = null }) {
    if (!recipients || recipients.length === 0) {
      throw new Error('No recipients provided');
    }

    const results = {
      total: recipients.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const recipient of recipients) {
      try {
        if (!recipient.email || !this.validateEmail(recipient.email)) {
          results.failed++;
          results.errors.push({
            email: recipient.email || 'unknown',
            error: 'Invalid email address'
          });
          continue;
        }

        // Personalize content with recipient data
        let personalizedHtml = htmlContent;
        let personalizedText = plainTextContent;

        if (recipient.firstName) {
          personalizedHtml = personalizedHtml.replace(/{{firstName}}/g, recipient.firstName);
          if (personalizedText) {
            personalizedText = personalizedText.replace(/{{firstName}}/g, recipient.firstName);
          }
        }

        if (recipient.lastName) {
          personalizedHtml = personalizedHtml.replace(/{{lastName}}/g, recipient.lastName);
          if (personalizedText) {
            personalizedText = personalizedText.replace(/{{lastName}}/g, recipient.lastName);
          }
        }

        await this.sendEmail({
          to: { email: recipient.email, displayName: `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() },
          subject: subject,
          htmlContent: personalizedHtml,
          plainTextContent: personalizedText
        });

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          email: recipient.email,
          error: error.message
        });
        logger.error(`Failed to send email to ${recipient.email}:`, error);
      }
    }

    logger.info(`Bulk email completed: ${results.successful} successful, ${results.failed} failed`);
    return results;
  }

  /**
   * Validate email address format
   * @param {string} email - Email address to validate
   * @returns {boolean} True if valid
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Check if email service is configured
   * @returns {boolean} True if configured
   */
  isConfigured() {
    return !!(this.client && this.senderAddress);
  }

  /**
   * Get service status
   * @returns {Object} Configuration status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      hasConnectionString: !!this.connectionString,
      hasSenderAddress: !!this.senderAddress,
      senderAddress: this.senderAddress || 'Not configured'
    };
  }
}

// Export singleton instance
module.exports = new EmailService();
