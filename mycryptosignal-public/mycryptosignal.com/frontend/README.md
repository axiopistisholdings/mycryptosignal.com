# MyCryptoSignal Frontend

Static HTML/CSS/JavaScript frontend for https://mycryptosignal.com

## Overview

Professional B2B signal dashboard with dark crypto-themed aesthetic, serving beta partners and future traders. Built with vanilla JavaScript - no frameworks or build tools required.

## Structure

```
frontend/
├── index.html                 # Landing page with hero, features, CTA
├── dashboard.html             # Live signal dashboard with filtering
├── coin.html                  # Detailed coin analysis with charts
├── api-docs.html              # Complete API documentation
├── beta-program.html          # Beta partner program application
├── assets/
│   ├── css/
│   │   ├── style.css          # Global styles and theme
│   │   ├── dashboard.css      # Dashboard-specific styles
│   │   ├── coin.css           # Coin page styles
│   │   └── docs.css           # Documentation page styles
│   └── js/
│       ├── api.js             # API client with caching
│       ├── dashboard.js       # Dashboard functionality
│       └── coin.js            # Coin page functionality
```

## Pages

### 1. Landing Page (`index.html`)
- **Purpose:** Marketing homepage for new visitors
- **Features:**
  - Hero section with value proposition
  - 4-stat overview cards (60 coins, 30min updates, daily signals, 100% uptime)
  - 6 feature highlights with icons
  - Beta partner CTA section
  - Tech stack showcase
  - "How It Works" 4-step process
- **CTA:** "Join Beta Program" + "View Dashboard"

### 2. Signal Dashboard (`dashboard.html`)
- **Purpose:** Real-time signal visualization
- **Features:**
  - API key authentication modal
  - 4 stat cards (Total/BUY/HOLD/RISK counts)
  - Search by coin name/symbol
  - Filter by action type (ALL/BUY/HOLD/RISK)
  - Sort by confidence or name
  - Signal cards with color-coded borders
  - Confidence progress bars
  - AI explanations
  - Rate limit display
  - Auto-refresh every 30 minutes
- **Data:** Fetches from `/api/signals`

### 3. Coin Details (`coin.html`)
- **Purpose:** Deep dive into specific cryptocurrency
- **Features:**
  - Coin header with name, symbol, chain
  - Current signal with large badge display
  - Market data grid (price, market cap, volume, 24h/7d/30d changes)
  - Chart.js confidence trend chart (7/30/90 days)
  - Historical signal table
- **Data:** Fetches from `/api/market`, `/api/onchain`, `/api/signals`, `/api/signals/history`

### 4. API Documentation (`api-docs.html`)
- **Purpose:** Complete developer reference
- **Features:**
  - Sticky sidebar navigation
  - Overview with base URL
  - Authentication guide
  - Rate limit tables
  - 6 endpoint references with examples
  - Code examples (JavaScript, Python, cURL)
  - Error handling guide
  - Best practices section
  - Copy-to-clipboard code buttons
- **Interactive:** Smooth scroll, active section highlighting

### 5. Beta Program (`beta-program.html`)
- **Purpose:** Partner recruitment and application
- **Features:**
  - Program overview with 4 benefit cards
  - Testing focus areas
  - Requirements and restrictions
  - Feedback process description
  - Post-beta pricing table (50% discount)
  - Application form (9 fields)
  - FAQ section
  - Contact information
- **Form:** Captures company info, use case, timeline, volume

## Design System

### Colors
```css
--bg-dark-primary: #0a0e27       /* Page background */
--bg-dark-secondary: #1a1f3a      /* Card backgrounds */
--accent-primary: #00ff88         /* Neon green (primary CTA, highlights) */
--signal-buy: #00ff88             /* BUY signal color */
--signal-hold: #ffaa00            /* HOLD signal color */
--signal-risk: #ff4444            /* RISK signal color */
--text-primary: #ffffff           /* Headings, primary text */
--text-secondary: #aaaaaa         /* Body text, labels */
```

### Typography
- **Font Stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...`
- **Monospace:** `'Courier New', Courier, monospace` (for code, data)
- **H1:** 3rem (48px) - Landing hero
- **H2:** 2.5rem (40px) - Section titles
- **H3:** 2rem (32px) - Card headings
- **Body:** 1rem (16px) - Standard text
- **Small:** 0.875rem (14px) - Metadata, labels

### Components
- **Buttons:** `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-lg`
- **Cards:** `.stat-card`, `.feature-card`, `.signal-card`, `.endpoint-card`
- **Badges:** `.signal-badge`, `.badge`, `.auth-badge`
- **Boxes:** `.info-box`, `.warning-box`
- **Code:** `.code-block` with header and copy button

### Responsive Breakpoints
- **Desktop:** 1200px max container width
- **Tablet:** 768px (grid switches to 1 column)
- **Mobile:** Full-width with padding

## API Client (`api.js`)

### Features
- **Authentication:** Stores API key in sessionStorage
- **Caching:** LocalStorage with configurable TTLs
  - Coins: 24 hours
  - Market/On-chain: 30 minutes
  - Signals: 23 hours
- **Rate Limiting:** Tracks and exposes rate limit headers
- **Error Handling:** Throws descriptive errors (401, 429, 5xx)

### Methods
```javascript
api.setAPIKey(key)              // Set API key
api.hasAPIKey()                 // Check if key exists
api.getCoins()                  // List tracked coins
api.getMarket()                 // Latest market data
api.getOnChain()                // Latest on-chain metrics
api.getSignals()                // Current signals
api.getSignalHistory(coinId, days)  // Historical signals
api.getCoinData(coinId)         // Complete coin data
api.getRateLimitInfo()          // Current rate limit status
api.clearCache()                // Clear all cached data
```

## Deployment

### Static Hosting Options

#### 1. **Cloudflare Pages** (Recommended)
```bash
# From project root
cd frontend
# Push to GitHub, connect to Cloudflare Pages
# Build command: (none)
# Build output directory: /
```

#### 2. **GitHub Pages**
```bash
# Enable GitHub Pages in repo settings
# Source: main branch, /frontend folder
# Custom domain: mycryptosignal.com
```

#### 3. **Netlify**
```bash
# Drag and drop frontend/ folder
# Or connect GitHub repo
# Build command: (none)
# Publish directory: frontend
```

### DNS Configuration
Point `mycryptosignal.com` to your hosting provider:
```
A     @    <hosting-provider-IP>
CNAME www  <hosting-provider-domain>
```

### CORS Verification
Backend is already configured for `https://mycryptosignal.com`. Test with:
```bash
curl -H "Origin: https://mycryptosignal.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://mycryptosignal.axiopistis-systems.workers.dev/api/signals
```

## Development

### Local Testing
```bash
# Option 1: Python SimpleHTTPServer
cd frontend
python3 -m http.server 8000
# Visit: http://localhost:8000

# Option 2: Node.js http-server
npx http-server frontend -p 8000

# Option 3: VS Code Live Server extension
# Right-click index.html > "Open with Live Server"
```

### API Key for Testing
Get a test API key from the backend:
```bash
cd ../
CLOUDFLARE_API_TOKEN=xxx node scripts/create-api-key.js \
  --company "Test Company" \
  --tier beta
```

### Browser Console Testing
```javascript
// Set API key
api.setAPIKey('mcs_your_test_key_here');

// Test endpoints
await api.health();
await api.getCoins();
await api.getSignals();

// Check rate limits
api.getRateLimitInfo();
```

## Performance Optimizations

### Implemented
- ✅ LocalStorage caching with TTL
- ✅ Debounced search input
- ✅ Batch API requests (`Promise.all`)
- ✅ Auto-refresh only when tab is active
- ✅ Lazy loading for coin history

### Future Enhancements
- [ ] Service Worker for offline support
- [ ] Image lazy loading
- [ ] Virtual scrolling for large lists
- [ ] WebSocket for real-time updates
- [ ] Prefetch high-confidence signals

## Browser Support

### Tested & Supported
- ✅ Chrome 90+ (Chromium-based)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Required APIs
- `fetch()` - Network requests
- `localStorage` - Caching
- `sessionStorage` - API key storage
- `IntersectionObserver` - Active section highlighting
- `Chart.js` - Visualizations (CDN loaded)

### Polyfills Not Needed
All modern browsers support the APIs used. For older browser support, consider:
- `fetch` polyfill
- `Promise` polyfill
- `localStorage` fallback

## Security Considerations

### API Key Storage
- ✅ Stored in `sessionStorage` (cleared on tab close)
- ✅ Never committed to Git
- ✅ Not exposed in URLs or console logs
- ⚠️ Visible in Network tab (expected for client-side)

### Production Best Practices
1. **For Beta Partners:** Users input their own keys
2. **For Public Demo:** Server-side proxy with sample data
3. **For Paid Users:** OAuth flow + refresh tokens (future)

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://cdn.jsdelivr.net; 
               style-src 'self' 'unsafe-inline'; 
               connect-src https://mycryptosignal.axiopistis-systems.workers.dev;">
```

## Accessibility

### Implemented
- ✅ Semantic HTML5 elements
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation support
- ✅ High contrast text (WCAG AA)
- ✅ Focus indicators on form inputs

### Future Improvements
- [ ] Screen reader testing
- [ ] Skip to content link
- [ ] ARIA live regions for updates
- [ ] Reduced motion preference

## Monitoring

### Key Metrics to Track
1. **Page Load Time:** Target <2s
2. **API Response Time:** Target <500ms
3. **Error Rate:** Track 401/429 errors
4. **API Key Usage:** Monitor rate limit hits
5. **User Flow:** Landing → Dashboard conversion

### Recommended Tools
- Google Analytics 4 (GA4)
- Cloudflare Web Analytics (privacy-friendly)
- Sentry for error tracking
- LogRocket for session replay

## Changelog

### v1.0.0 (January 20, 2026)
- ✅ Initial release
- ✅ Landing page with marketing content
- ✅ Signal dashboard with filtering/sorting
- ✅ Coin details with Chart.js visualizations
- ✅ Complete API documentation
- ✅ Beta program application form
- ✅ Mobile-responsive design
- ✅ Dark theme with neon accents
- ✅ LocalStorage caching
- ✅ Rate limit tracking

## Support

### For Beta Partners
- Email: partners@mycryptosignal.com
- Response time: 24-48 hours
- Monthly calls scheduled individually

### For General Support
- Email: support@mycryptosignal.com
- GitHub Issues: https://github.com/axiopistisholdings/mycryptosignal/issues
- Documentation: [API_DOCUMENTATION.md](../docs/API_DOCUMENTATION.md)

## License

Proprietary - All Rights Reserved

&copy; 2026 MyCryptoSignal. Unauthorized copying or distribution prohibited.
