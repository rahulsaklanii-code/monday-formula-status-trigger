// Configuration for status mapping rules
module.exports = {
  // Status mapping thresholds and labels
  statusMapping: [
    {
      label: 'Done',
      index: 1,
      color: 'green',
      condition: (value) => value > 100
    },
    {
      label: 'Working on it',
      index: 2,
      color: 'yellow',
      condition: (value) => value >= 50 && value <= 100
    },
    {
      label: 'Stuck',
      index: 3,
      color: 'red',
      condition: (value) => value < 50
    }
  ],

  // Column types to monitor
  formulaColumnTypes: ['formula'],

  // Column types to ignore (prevent infinite loops)
  ignoreColumnTypes: ['status'],

  // Rate limit settings
  rateLimit: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2
  },

  // Logging settings
  logging: {
    logWebhooks: true,
    logApiCalls: true,
    logErrors: true
  }
};
