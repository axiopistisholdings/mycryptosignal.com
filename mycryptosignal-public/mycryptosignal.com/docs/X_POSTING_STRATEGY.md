# X/Twitter Posting Strategy

## Overview
Multi-post strategy optimized for engagement, character limits, and audience reach. Posts 3 times daily to showcase high-confidence signals without overwhelming followers.

## Posting Schedule

### Post 1: Morning Highlights (08:30 UTC)
**Timing:** 30 minutes after signal generation  
**Purpose:** Showcase top signals immediately after AI analysis

**Content:**
- Top 3 BUY signals (confidence ≥75%)
- Top 1-2 RISK alerts (confidence ≥80%)
- Date/time stamp
- Brief explanations (truncated to fit 280 chars)

**Format:**
```
📊 AI Signals | 01-19 08:00 UTC

🟢 BUY (High Confidence):
$BTC 88% - Support bounce + volume surge
$ETH 84% - Breaking resistance cleanly
$SOL 79% - Whale accumulation pattern

🔴 RISK Alert:
$MATIC 91% - Critical support broken

#CryptoSignals
```

**Character Limit:** ~260-280 chars (fits standard limit)

---

### Post 2: Mid-Day Spotlight (14:00 UTC)
**Timing:** 6 hours after morning post  
**Purpose:** Highlight single highest-confidence signal with detail

**Content:**
- Single best signal from daily batch
- Full confidence score
- Extended explanation
- Action-oriented language

**Format:**
```
🔥 HIGH CONFIDENCE SIGNAL

$BTC - BUY 🟢
Confidence: 88%

Strong support bounce at $95K with volume spike +47% vs average. Oversold recovery with whale accumulation detected.

Generated: 08:00 UTC
#Bitcoin #CryptoTrading
```

**Character Limit:** ~270-280 chars

---

### Post 3: Evening Update (21:00 UTC)
**Timing:** 13 hours after signal generation  
**Purpose:** Build trust through transparency, show performance

**Content:**
- Progress on morning signals
- Quick win/loss status
- Community engagement question
- Conversational tone

**Format:**
```
Signal check-in 📈

$BTC BUY → ✅
$ETH BUY → ✅
$SOL BUY → ✅

3/3 tracking well

What coin should we analyze tomorrow? 👇
```

**Character Limit:** ~200-250 chars (leaves room for engagement)

---

## Weekly Supplement

### Sunday Summary Thread (Optional)
**Timing:** Sunday evening (flexible)  
**Purpose:** Show historical performance, build credibility

**Format:**
```
Tweet 1:
📈 This Week's Performance | Jan 13-19

Signals Posted: 18
Winners: 12 (67%)
Average Gain: +4.2%
Best Call: $SOL +18.5%

Thread 👇

Tweet 2:
Top performing signals:
🟢 $SOL: +18.5%
🟢 $BTC: +6.2%
🟢 $LINK: +5.8%

Our AI system learns from each cycle

Tweet 3:
Next week outlook:
Key resistance levels to watch...
[Market analysis]

Full 60-coin analysis via API
DM for access
```

---

## Filter Logic

### What Gets Posted (Priority Order)

1. **BUY signals with confidence ≥85%**
   - Highest priority
   - Strong conviction calls
   - Top of morning highlights

2. **RISK signals with confidence ≥85%**
   - Protect followers from losses
   - Always included in morning post
   - Critical for credibility

3. **BUY signals with confidence 75-84%**
   - Secondary priority
   - Fill remaining morning highlight slots
   - Mid-day spotlight candidates

4. **RISK signals with confidence 80-84%**
   - Include if space permits
   - Important warnings

5. **HOLD signals ≥80%** (Rarely posted)
   - Only if noteworthy market context
   - Example: "All stablecoins HOLD during volatility"

### What NEVER Gets Posted

❌ HOLD signals <75% confidence (too boring)  
❌ Any signal <70% confidence (not confident enough)  
❌ Signals without AI explanations  
❌ Low-volume altcoins (unless extreme confidence)  
❌ All 60 signals in one thread (overwhelming)

---

## Technical Implementation

### Scheduler (index.js)
```javascript
08:00 UTC → Generate signals (Layer A + B)
08:30 UTC → Post morning highlights
14:00 UTC → Post mid-day spotlight  
21:00 UTC → Post evening update
```

### X Publisher (x-publisher.js)
```javascript
postMorningHighlights(signals)
  → Filter confidence ≥75%
  → Sort by confidence
  → Format top 3-5 signals
  → Truncate to 280 chars

postMidDaySpotlight(signals)
  → Find highest confidence signal
  → Full explanation
  → Detailed format

postEveningUpdate(signalDate)
  → Query morning signals
  → Compare with current prices
  → Show performance
```

---

## API Limits & Safety

### X API Free Tier
- **Daily limit:** 50 tweets/day
- **Monthly limit:** 1,500 tweets/month
- **Our usage:** ~3 posts/day = 90 tweets/month (6% of limit)

### Rate Limiting
- No more than 1 post every 5 hours
- Maximum 4 posts per day (if weekly summary included)
- Built-in error handling for 429 errors

---

## Engagement Strategy

### Hashtags
- **Always:** #CryptoSignals or #CryptoTrading (pick one per post)
- **Coin-specific:** Use $ not # (e.g., $BTC, $ETH)
- **Max 2-3 per post** (avoid hashtag spam)

### Timing Optimization
- **08:30 UTC:** Catches Asia afternoon + Europe morning
- **14:00 UTC:** Europe afternoon + US East Coast morning
- **21:00 UTC:** US prime time + Asia late night

### Community Building
- Ask questions in evening posts ("Which coin next?")
- Acknowledge both wins and losses (transparency)
- Respond to high-quality replies
- Monthly performance summaries

---

## Success Metrics

### Track These
1. **Follower growth rate**
2. **Engagement per post** (likes, retweets, replies)
3. **Signal accuracy** (for transparency posts)
4. **Click-through to API signup** (if added)

### Goals (First 90 Days)
- **Consistency:** Never miss a scheduled post
- **Accuracy:** Track and report all signal outcomes
- **Growth:** Organic follower increase
- **Conversion:** X followers → API waitlist signups

---

## Example Daily Flow

```
00:00 UTC - Data collection (automated)
00:30 UTC - Data collection (automated)
...
08:00 UTC - Signal generation (automated)
08:30 UTC - POST 1: Morning highlights
...
14:00 UTC - POST 2: Mid-day spotlight
...
21:00 UTC - POST 3: Evening update
...
```

**Total Daily Output:**
- 3 posts
- 5-7 signals showcased
- ~800 characters total
- 48 data collections in background

---

## Content Guidelines

### Do's ✅
- Focus on high-confidence signals only
- Provide brief, clear explanations
- Use emojis for visual scanning (🟢🔴🟡)
- Include timestamp for accountability
- Acknowledge both wins and losses
- Keep tone professional yet accessible

### Don'ts ❌
- Never guarantee profits
- Avoid financial advice language
- Don't spam all 60 signals
- Don't post without explanations
- Don't ignore losses or failed signals
- Don't use excessive hashtags

---

## Future Enhancements

### Phase 2 (After X Credentials Set)
- [ ] Add performance tracking images (weekly)
- [ ] Create signal comparison charts
- [ ] Thread format for monthly summaries
- [ ] A/B test posting times
- [ ] Analyze which signal types get most engagement

### Phase 3 (After Growth)
- [ ] Premium signal preview (full 60 via API)
- [ ] Live performance dashboard link
- [ ] Partner highlights/testimonials
- [ ] Educational content (how signals work)

---

**Status:** ✅ Code complete, awaiting X API credentials  
**Next Step:** Add X API keys to Cloudflare Secrets  
**Documentation:** See [setup-twitter.md](../scripts/setup-twitter.md)
