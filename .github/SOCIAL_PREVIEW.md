# Social Media Preview Configuration

This document explains how to set up social media previews for the MyCryptoSignal.com repository.

## OpenGraph & Twitter Card Assets

The following assets are already created and located in the frontend icons folder:

- **OG Image**: `mycryptosignal-public/mycryptosignal.com/frontend/assets/icons/og-image.png` (1200x630px)
- **Twitter Card**: `mycryptosignal-public/mycryptosignal.com/frontend/assets/icons/twitter-card.png` (1200x630px)
- **Logo**: `mycryptosignal-public/mycryptosignal.com/frontend/assets/icons/logo.svg`
- **Icon**: `mycryptosignal-public/mycryptosignal.com/frontend/assets/icons/icon.svg`

## GitHub Repository Social Preview

To set up the social preview image for your GitHub repository:

1. Go to your repository on GitHub
2. Click **Settings** (top right)
3. Scroll down to **Social preview** section
4. Click **Edit** and upload: `og-image.png`
5. Click **Save**

This will display your custom banner when sharing the repository on social media.

## Website Meta Tags

For the website itself, ensure these meta tags are in your HTML files:

```html
<!-- OpenGraph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://mycryptosignal.com/">
<meta property="og:title" content="MyCryptoSignal.com - AI-Powered Crypto Trading Signals">
<meta property="og:description" content="Real-time cryptocurrency trading signals powered by AI. Get actionable insights for Bitcoin, Ethereum, and major altcoins.">
<meta property="og:image" content="https://mycryptosignal.com/assets/icons/og-image.png">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="https://mycryptosignal.com/">
<meta property="twitter:title" content="MyCryptoSignal.com - AI-Powered Crypto Trading Signals">
<meta property="twitter:description" content="Real-time cryptocurrency trading signals powered by AI. Get actionable insights for Bitcoin, Ethereum, and major altcoins.">
<meta property="twitter:image" content="https://mycryptosignal.com/assets/icons/twitter-card.png">
```

## Asset Specifications

### Repository Social Preview
- **Size**: 1280x640px (2:1 ratio)
- **Format**: PNG or JPG
- **Max file size**: 1MB

### OpenGraph Image
- **Size**: 1200x630px
- **Format**: PNG or JPG
- **Recommended**: Include text overlay, logo, and branding

### Twitter Card
- **Size**: 1200x630px (summary_large_image)
- **Format**: PNG or JPG
- **Alternative**: 120x120px (summary card)

## Testing

Test your social media previews:
- **Facebook**: [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- **Twitter**: [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- **LinkedIn**: [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

## Current Assets

Your existing assets are professional and ready to use:
- ✅ OG image created
- ✅ Twitter card created
- ✅ Logo available (SVG)
- ✅ Icon available (SVG)
- ✅ Multiple favicon sizes

Simply upload `og-image.png` to GitHub repository settings for immediate social media preview support.
