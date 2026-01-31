# Formula Status Trigger

> Automatically convert Monday.com formula column results to status labels to enable powerful automations

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Overview

Monday.com's automations can't trigger on formula columns. **Formula Status Trigger** solves this by automatically converting your formula results into status labels that **can** trigger automations.

### How It Works

1. **Formula changes** → Webhook fires
2. **Extract numeric value** → Parse formula result
3. **Map to status** → Apply configured thresholds
4. **Update status column** → Via Monday.com API
5. **Trigger automations** → Based on status changes

## ✨ Features

- ⚡ **Real-time Updates** - Instantly converts formula results as values change
- 🎯 **Customizable Mapping** - Configure your own thresholds and status labels
- 🔒 **Secure** - Webhook signature validation and environment-based credentials
- 🔄 **Loop Prevention** - Smart detection prevents infinite loops
- 📊 **Production Ready** - Error handling, logging, and rate limiting included
- 🚀 **Easy Deployment** - One-click deploy to Vercel

## 📋 Prerequisites

- Node.js 18+ installed
- Monday.com account with API access
- Vercel account (for deployment)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/formula-status-trigger.git
cd formula-status-trigger
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
MONDAY_API_TOKEN=your_monday_api_token_here
MONDAY_SIGNING_SECRET=your_signing_secret_here
STATUS_COLUMN_ID=status
PORT=3000
```

#### Getting Your Monday.com API Token

1. Log in to Monday.com
2. Click your profile picture (bottom left)
3. Go to **Developers** → **My Access Tokens**
4. Click **Generate** and copy your token

#### Getting Your Signing Secret

1. Go to Monday.com **Apps Marketplace**
2. Create a new app or select an existing one
3. Navigate to **Features** → **Webhooks**
4. Copy the **Signing Secret**

### 4. Run Locally

```bash
npm start
```

The server will start on `http://localhost:3000`

For development with auto-reload:

```bash
npm run dev
```

## 🌐 Deployment to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Then deploy to production
vercel --prod
```

### Option 2: GitHub Integration

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables in Vercel

Add these in your Vercel project settings:

- `MONDAY_API_TOKEN`
- `MONDAY_SIGNING_SECRET`
- `STATUS_COLUMN_ID`

## 🔧 Monday.com Setup

### 1. Create a Monday.com App

1. Go to **Apps Marketplace** → **Build**
2. Create a new app
3. Navigate to **Features** → **Webhooks**

### 2. Configure Webhook

- **Webhook URL**: `https://your-domain.vercel.app/webhook`
- **Event**: Column Value Changed
- **Columns**: Select your formula column(s)

### 3. Install the App

Install your app on the boards you want to monitor.

## ⚙️ Configuration

### Status Mapping

Edit `src/config.js` to customize thresholds:

```javascript
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
]
```

### Rate Limiting

Adjust rate limit settings in `src/config.js`:

```javascript
rateLimit: {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2
}
```

## 📊 Usage Example

### Scenario: Project Health Tracking

**Formula Column**: `{Budget Spent} / {Total Budget} * 100`

**Status Mapping**:
- < 50% → "On Track" (green)
- 50-80% → "At Risk" (yellow)
- > 80% → "Over Budget" (red)

**Automation**: When status changes to "Over Budget", notify project manager

## 🐛 Troubleshooting

### Webhook Not Triggering

- Verify webhook URL is publicly accessible
- Check `MONDAY_SIGNING_SECRET` matches your app settings
- Ensure webhook is configured for "Column Value Changed" events
- Check server logs for errors

### Status Not Updating

- Verify `STATUS_COLUMN_ID` matches your board's status column
- Check that the status column exists on the board
- Review API logs for error messages
- Ensure your API token has write permissions

### Enable Debug Logging

Set these in `src/config.js`:

```javascript
logging: {
  logWebhooks: true,
  logApiCalls: true,
  logErrors: true
}
```

## 📚 API Endpoints

- `GET /` - Landing page
- `POST /webhook` - Monday.com webhook endpoint
- `GET /health` - Health check endpoint
- `GET /privacy.html` - Privacy policy
- `GET /terms.html` - Terms of service
- `GET /support.html` - Support page

## 🔐 Security

- Webhook signature validation using HMAC SHA-256
- Environment-based credential storage
- No data persistence (stateless)
- HTTPS recommended for production

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💬 Support

- 📧 Email: support@formulatrigger.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/formula-status-trigger/issues)
- 📖 Docs: [Wiki](https://github.com/yourusername/formula-status-trigger/wiki)

## 🙏 Acknowledgments

- Built with [Express](https://expressjs.com/)
- Powered by [Monday.com API](https://developer.monday.com/)
- Deployed on [Vercel](https://vercel.com/)

---

Made with ❤️ for the Monday.com community
