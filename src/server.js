require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const MondayClient = require('./mondayClient');
const config = require('./config');
const {
    parseFormulaValue,
    mapValueToStatus,
    shouldProcessEvent,
    validateWebhookPayload,
    extractEventData
} = require('./utils');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize Monday client
const mondayClient = new MondayClient(process.env.MONDAY_API_TOKEN);

/**
 * Verify webhook signature from Monday.com
 * @param {object} req - Express request object
 * @returns {boolean} - True if signature is valid
 */
function verifyWebhookSignature(req) {
    if (!process.env.MONDAY_SIGNING_SECRET) {
        console.warn('MONDAY_SIGNING_SECRET not set. Skipping signature verification.');
        return true;
    }

    const signature = req.headers['authorization'];
    if (!signature) {
        return false;
    }

    const body = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', process.env.MONDAY_SIGNING_SECRET);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');

    return signature === expectedSignature;
}

/**
 * Process webhook event asynchronously
 * @param {object} eventData - Extracted event data
 */
async function processWebhookEvent(eventData) {
    try {
        // Parse the formula value
        const numericValue = parseFormulaValue(eventData.value);

        if (numericValue === null) {
            console.log('Could not parse formula value:', eventData.value);
            return;
        }

        if (config.logging.logWebhooks) {
            console.log('Parsed formula value:', numericValue);
        }

        // Map value to status
        const status = mapValueToStatus(numericValue);

        if (!status) {
            console.log('No status mapping found for value:', numericValue);
            return;
        }

        if (config.logging.logWebhooks) {
            console.log('Mapped to status:', status);
        }

        // Find the status column to update
        // In a production app, you'd configure which status column to update
        // For now, we'll assume there's a convention or configuration
        const statusColumnId = process.env.STATUS_COLUMN_ID || 'status';

        // Update the status column
        await mondayClient.updateStatusColumn(
            eventData.boardId,
            eventData.itemId,
            statusColumnId,
            status.index
        );

        console.log(`Successfully updated item ${eventData.itemId} to status "${status.label}"`);
    } catch (error) {
        if (config.logging.logErrors) {
            console.error('Error processing webhook event:', error);
        }
    }
}

// Routes

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Webhook endpoint for Monday.com events
 */
app.post('/webhook', async (req, res) => {
    try {
        // Log incoming webhook
        if (config.logging.logWebhooks) {
            console.log('Received webhook:', JSON.stringify(req.body, null, 2));
        }

        // Verify signature
        if (!verifyWebhookSignature(req)) {
            console.error('Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Validate payload
        if (!validateWebhookPayload(req.body)) {
            console.error('Invalid webhook payload');
            return res.status(400).json({ error: 'Invalid payload' });
        }

        // Extract event data
        const eventData = extractEventData(req.body);

        if (!eventData) {
            console.error('Could not extract event data');
            return res.status(400).json({ error: 'Invalid event data' });
        }

        // Check if we should process this event
        if (!shouldProcessEvent(eventData)) {
            if (config.logging.logWebhooks) {
                console.log('Skipping event (not a formula column or is a status column)');
            }
            return res.status(200).json({ message: 'Event ignored' });
        }

        // Return 200 OK immediately to Monday.com
        res.status(200).json({ message: 'Webhook received' });

        // Process the event asynchronously
        setImmediate(() => processWebhookEvent(eventData));

    } catch (error) {
        if (config.logging.logErrors) {
            console.error('Error handling webhook:', error);
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Root endpoint - serve landing page
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Formula Status Trigger server running on port ${PORT}`);
    console.log(`Webhook endpoint: http://localhost:${PORT}/webhook`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
