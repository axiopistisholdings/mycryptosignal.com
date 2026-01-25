# MyCryptoSignal

**AI-Powered Cryptocurrency Trading Signals Platform**

MyCryptoSignal is a professional-grade cryptocurrency trading signals platform that leverages AI to analyze market data and generate actionable trading insights. Built on Cloudflare Workers for global edge deployment with minimal latency.

## 🌟 Features

- **Real-time Signal Generation**: AI-enhanced trading signals updated hourly
- **Multi-Source Data Aggregation**: Integrates CoinGecko, Alchemy, and Infura APIs
- **RESTful API**: Complete API for programmatic access to signals and market data
- **API Key Management**: Secure authentication with usage tracking and rate limiting
- **Automated Social Media**: X (Twitter) integration for signal broadcasting
- **Modern Frontend**: Responsive web interface with retro cyberpunk aesthetic
- **Edge Computing**: Deployed on Cloudflare Workers for global performance
- **Persistent Storage**: Cloudflare D1 (SQLite) + KV for data and caching

## 🏗️ Architecture

### Backend (Cloudflare Worker)
- **Runtime**: Cloudflare Workers (V8 isolates)
- **Database**: Cloudflare D1 (SQLite)
- **Cache**: Cloudflare KV
- **Language**: JavaScript/Node.js

### Frontend
- **Framework**: Vanilla HTML/CSS/JavaScript
- **Styling**: Custom CSS with VT323 monospace font
- **Theme**: Dark mode with cyan (#0EA5E9) and emerald (#50C878) accents
- **Icons**: Custom SVG favicon set + Apple touch icons

### Data Sources
- **CoinGecko API**: Market data, prices, volume, market cap
- **Alchemy API**: Ethereum blockchain data
- **Infura API**: Additional blockchain insights

### Integrations
- **X (Twitter)**: Automated signal posting via Twitter API v2
- **Resend**: Transactional email notifications

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Cloudflare account (free tier works)
- API keys from:
  - CoinGecko
  - Alchemy
  - Infura
  - Twitter Developer Platform
  - Resend

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/axiopistisholdings/mycryptosignal.git
   cd mycryptosignal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Wrangler**
   ```bash
   cp wrangler.toml.example wrangler.toml
   # Edit wrangler.toml with your Cloudflare account details
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

5. **Create Cloudflare D1 database**
   ```bash
   npx wrangler d1 create mycryptosignal-db
   # Copy the database_id to wrangler.toml
   ```

6. **Run migrations**
   ```bash
   npx wrangler d1 migrations apply mycryptosignal-db --local
   npx wrangler d1 migrations apply mycryptosignal-db --remote
   ```

7. **Create KV namespace**
   ```bash
   npx wrangler kv:namespace create CRYPTO_SIGNALS
   # Copy the namespace_id to wrangler.toml
   ```

8. **Set secrets**
   ```bash
   npx wrangler secret put COINGECKO_API_KEY
   npx wrangler secret put ALCHEMY_API_KEY
   npx wrangler secret put INFURA_API_KEY
   npx wrangler secret put TWITTER_API_KEY
   npx wrangler secret put TWITTER_API_SECRET
   npx wrangler secret put TWITTER_ACCESS_TOKEN
   npx wrangler secret put TWITTER_ACCESS_TOKEN_SECRET
   npx wrangler secret put RESEND_API_KEY
   ```

### Development

```bash
# Run local development server
npm run dev

# Test locally
curl http://localhost:8787/api/health
```

### Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy

# Your API will be available at:
# https://mycryptosignal.YOUR-SUBDOMAIN.workers.dev
```

## 📁 Project Structure

```
mycryptosignal/
├── frontend/              # Static website files
│   ├── index.html        # Landing page
│   ├── api-docs.html     # API documentation
│   ├── get-access.html   # API key request form
│   └── assets/
│       ├── css/          # Stylesheets
│       ├── js/           # Frontend JavaScript
│       └── icons/        # Favicons and brand assets
├── src/
│   ├── index.js          # Worker entry point
│   ├── api/
│   │   ├── router.js     # API route handler
│   │   └── x-publisher.js # Twitter integration
│   ├── data/
│   │   ├── coins.js      # Supported cryptocurrencies
│   │   └── collector.js  # Data aggregation
│   ├── services/
│   │   ├── alchemy.js    # Alchemy API client
│   │   ├── coingecko.js  # CoinGecko API client
│   │   ├── infura.js     # Infura API client
│   │   └── email.js      # Resend email client
│   └── signals/
│       ├── generator.js  # Signal generation logic
│       └── ai-enhancer.js # AI enhancement layer
├── scripts/              # Utility scripts
│   ├── seed-coins.js     # Database seeding
│   ├── create-api-key.js # API key generation
│   └── health-check.js   # System health checks
├── migrations/           # D1 database migrations
├── docs/                 # Additional documentation
├── schema.sql           # Database schema
├── wrangler.toml.example # Cloudflare configuration template
├── .env.example         # Environment variables template
└── package.json         # Node.js dependencies
```

## 🔑 API Documentation

Full API documentation is available at:
- **Web**: https://mycryptosignal.com/api-docs
- **Markdown**: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

### Quick API Examples

**Get latest signals**
```bash
curl -H "X-API-Key: your_api_key" \
  https://mycryptosignal.YOUR-SUBDOMAIN.workers.dev/api/signals
```

**Get specific coin data**
```bash
curl -H "X-API-Key: your_api_key" \
  https://mycryptosignal.YOUR-SUBDOMAIN.workers.dev/api/coins/bitcoin
```

## 🎨 Design System

### Colors
- **Primary Cyan**: `#0EA5E9` - Buttons, links, accents
- **Secondary Emerald**: `#50C878` - Hover states, success messages
- **Dark Background**: `#0a0a0a` - Main background
- **Text**: `#e5e5e5` - Primary text color

### Typography
- **Primary Font**: VT323 (monospace, retro style)
- **Fallback**: Courier New, monospace

### Assets
- Favicon sizes: 16x16, 32x32, 48x48, favicon.ico
- Apple touch icons: 76x76, 120x120, 152x152, 180x180
- Social cards: 1200x630 (OG image, Twitter card)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Website**: https://mycryptosignal.com
- **API Docs**: https://mycryptosignal.com/api-docs
- **GitHub**: https://github.com/axiopistisholdings/mycryptosignal

## ⚠️ Disclaimer

This platform provides trading signals for informational purposes only. Cryptocurrency trading carries significant risk. Always do your own research and never invest more than you can afford to lose.

## 📧 Contact

For questions, support, or API access inquiries:
- **Email**: support@mycryptosignal.com
- **Website**: https://mycryptosignal.com/contact

---

**Built with ❤️ by Axiopistis Systems**
