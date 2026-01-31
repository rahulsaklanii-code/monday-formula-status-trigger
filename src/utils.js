const config = require('./config');

/**
 * Parse numeric value from formula result
 * @param {*} value - The formula column value
 * @returns {number|null} - Parsed numeric value or null if invalid
 */
function parseFormulaValue(value) {
    if (value === null || value === undefined) {
        return null;
    }

    // Handle string values
    if (typeof value === 'string') {
        // Remove common formatting (commas, currency symbols, etc.)
        const cleaned = value.replace(/[,$%]/g, '').trim();
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
    }

    // Handle numeric values
    if (typeof value === 'number') {
        return isNaN(value) ? null : value;
    }

    return null;
}

/**
 * Map numeric value to status label based on configured thresholds
 * @param {number} value - The numeric value to map
 * @returns {object|null} - Status object with label and index, or null if no match
 */
function mapValueToStatus(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return null;
    }

    // Find matching status based on conditions
    for (const status of config.statusMapping) {
        if (status.condition(value)) {
            return {
                label: status.label,
                index: status.index,
                color: status.color
            };
        }
    }

    return null;
}

/**
 * Check if a webhook event should be processed
 * @param {object} event - The webhook event payload
 * @returns {boolean} - True if should process, false otherwise
 */
function shouldProcessEvent(event) {
    // Prevent infinite loops - don't process status column changes
    if (event.columnType && config.ignoreColumnTypes.includes(event.columnType)) {
        return false;
    }

    // Only process formula column changes
    if (event.columnType && !config.formulaColumnTypes.includes(event.columnType)) {
        return false;
    }

    return true;
}

/**
 * Validate webhook payload structure
 * @param {object} payload - The webhook payload
 * @returns {boolean} - True if valid, false otherwise
 */
function validateWebhookPayload(payload) {
    if (!payload || typeof payload !== 'object') {
        return false;
    }

    // Check for required fields
    const requiredFields = ['event'];
    for (const field of requiredFields) {
        if (!payload[field]) {
            return false;
        }
    }

    return true;
}

/**
 * Extract event data from webhook payload
 * @param {object} payload - The webhook payload
 * @returns {object|null} - Extracted event data or null if invalid
 */
function extractEventData(payload) {
    try {
        const event = payload.event;

        return {
            boardId: event.boardId || payload.boardId,
            itemId: event.pulseId || event.itemId,
            columnId: event.columnId,
            columnType: event.columnType,
            value: event.value,
            previousValue: event.previousValue,
            userId: event.userId
        };
    } catch (error) {
        console.error('Error extracting event data:', error);
        return null;
    }
}

/**
 * Sleep for specified milliseconds (for rate limiting)
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after delay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current retry attempt (0-indexed)
 * @returns {number} - Delay in milliseconds
 */
function calculateBackoffDelay(attempt) {
    const delay = config.rateLimit.initialDelayMs * Math.pow(config.rateLimit.backoffMultiplier, attempt);
    return Math.min(delay, config.rateLimit.maxDelayMs);
}

module.exports = {
    parseFormulaValue,
    mapValueToStatus,
    shouldProcessEvent,
    validateWebhookPayload,
    extractEventData,
    sleep,
    calculateBackoffDelay
};
