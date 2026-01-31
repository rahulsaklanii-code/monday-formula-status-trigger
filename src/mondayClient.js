const fetch = require('node-fetch');
const config = require('./config');
const { sleep, calculateBackoffDelay } = require('./utils');

class MondayClient {
    constructor(apiToken) {
        this.apiToken = apiToken;
        this.apiUrl = 'https://api.monday.com/v2';
    }

    /**
     * Execute a GraphQL query against Monday.com API
     * @param {string} query - GraphQL query string
     * @param {object} variables - Query variables
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<object>} - API response data
     */
    async executeQuery(query, variables = {}, retryCount = 0) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.apiToken,
                    'API-Version': '2024-01'
                },
                body: JSON.stringify({
                    query,
                    variables
                })
            });

            const data = await response.json();

            // Handle rate limiting
            if (response.status === 429) {
                if (retryCount < config.rateLimit.maxRetries) {
                    const delay = calculateBackoffDelay(retryCount);
                    if (config.logging.logApiCalls) {
                        console.log(`Rate limited. Retrying in ${delay}ms (attempt ${retryCount + 1}/${config.rateLimit.maxRetries})`);
                    }
                    await sleep(delay);
                    return this.executeQuery(query, variables, retryCount + 1);
                } else {
                    throw new Error('Rate limit exceeded. Max retries reached.');
                }
            }

            // Handle API errors
            if (data.errors) {
                throw new Error(`Monday API error: ${JSON.stringify(data.errors)}`);
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (config.logging.logApiCalls) {
                console.log('API call successful:', { query: query.substring(0, 50) + '...', variables });
            }

            return data.data;
        } catch (error) {
            if (config.logging.logErrors) {
                console.error('Error executing Monday API query:', error);
            }
            throw error;
        }
    }

    /**
     * Update a status column value for an item
     * @param {string} boardId - Board ID
     * @param {string} itemId - Item ID
     * @param {string} statusColumnId - Status column ID
     * @param {number} statusIndex - Status label index
     * @returns {Promise<object>} - Updated item data
     */
    async updateStatusColumn(boardId, itemId, statusColumnId, statusIndex) {
        const mutation = `
      mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
        change_column_value(
          board_id: $boardId,
          item_id: $itemId,
          column_id: $columnId,
          value: $value
        ) {
          id
          name
        }
      }
    `;

        const variables = {
            boardId: boardId.toString(),
            itemId: itemId.toString(),
            columnId: statusColumnId,
            value: JSON.stringify({ index: statusIndex })
        };

        if (config.logging.logApiCalls) {
            console.log('Updating status column:', variables);
        }

        return await this.executeQuery(mutation, variables);
    }

    /**
     * Get item details including column values
     * @param {string} itemId - Item ID
     * @returns {Promise<object>} - Item data
     */
    async getItem(itemId) {
        const query = `
      query ($itemId: ID!) {
        items(ids: [$itemId]) {
          id
          name
          board {
            id
          }
          column_values {
            id
            type
            text
            value
          }
        }
      }
    `;

        const variables = {
            itemId: itemId.toString()
        };

        const data = await this.executeQuery(query, variables);
        return data.items && data.items.length > 0 ? data.items[0] : null;
    }

    /**
     * Get board columns
     * @param {string} boardId - Board ID
     * @returns {Promise<array>} - Array of column objects
     */
    async getBoardColumns(boardId) {
        const query = `
      query ($boardId: ID!) {
        boards(ids: [$boardId]) {
          columns {
            id
            title
            type
          }
        }
      }
    `;

        const variables = {
            boardId: boardId.toString()
        };

        const data = await this.executeQuery(query, variables);
        return data.boards && data.boards.length > 0 ? data.boards[0].columns : [];
    }
}

module.exports = MondayClient;
