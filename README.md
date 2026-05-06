# Shopify Checkout Automation

Puppeteer-based checkout bot with two independent flows targeting Shopify storefronts. Features stealth mode, hCaptcha solving via 2Captcha, optional proxy routing, and an Electron desktop GUI.

---

## Automation Targets

| Target | Entry Point | Captcha | Proxy | Interface |
|---|---|---|---|---|
| [kith.com](https://kith.com) | `kith.mjs` | 2Captcha (hCaptcha) | Oxylabs (optional) | CLI |
| [shopnicekicks.com](https://shopnicekicks.com) | `automation.mjs` | None | None | Electron GUI |

---

## How It Works

### kith.mjs (CLI)

1. Validates all required environment variables on startup
2. Launches Puppeteer with stealth plugin and optional proxy
3. Navigates to the configured product page
4. Selects the configured shoe size from available swatches
5. Adds to cart and proceeds to checkout
6. Fills shipping and payment fields from env vars
7. Solves hCaptcha via the 2Captcha API
8. Submits payment and logs total elapsed time

### Electron GUI (shopnicekicks)

1. User fills in product URL, size, shipping, and card details via a desktop form
2. Clicks **Run Task**
3. Puppeteer drives the full checkout flow in a visible browser window
4. Status messages stream into the UI in real time

---

## Challenges & Solutions

| Challenge | Solution |
|---|---|
| Item not shipping to Lebanon | Oxylabs US proxy to spoof location |
| Shopify checkout loads slowly | Wait on `domcontentloaded` instead of `load` event |
| hCaptcha blocks automation | 2Captcha API for dynamic challenge solving |
| No captcha sitekey available | Interactive element injection instead of sitekey lookup |
| Card fields are inside iframes | `contentFrame()` with scoped input selectors |
| US ZIP/state required at checkout | Fully configurable via `.env` shipping fields |

---

## Setup

### 1. Clone

```bash
git clone https://github.com/your-username/shopify-automation.git
cd shopify-automation
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure `.env`

Create a `.env` file in the project root. All fields listed under **Required** must be present for `kith.mjs` to start.

```env
# --- 2Captcha (required) ---
CAPTCHA_API_KEY=your_2captcha_api_key

# --- Proxy (optional — omit all three to run without proxy) ---
PROXY_HOST=host:port
PROXY_USER=your_proxy_username
PROXY_PASS=your_proxy_password

# --- Target product (optional — defaults shown below) ---
TARGET_URL=https://kith.com/collections/mens-footwear-sneakers/products/sl47581100
SHOE_SIZE=5.5 US

# --- Shipping info (required) ---
SHIPPING_EMAIL=you@example.com
SHIPPING_FIRST=John
SHIPPING_LAST=Doe
SHIPPING_ADDRESS=123 Main St
SHIPPING_CITY=Seattle
SHIPPING_STATE=WA
SHIPPING_ZIP=98101
SHIPPING_PHONE=2065551234

# --- Payment card (required) ---
CARD_NUMBER=4242424242424242
CARD_EXPIRY=04/28
CARD_CVV=123
```

---

## Usage

### kith.com — CLI

```bash
npm run kith
# or
node kith.mjs
```

Terminal output:

```
16:08:18: Navigating to product page...
16:08:20: Size "10 US" selected.
16:08:21: Adding item to cart...
16:08:22: Proceeding to checkout...
16:08:24: Filling shipping info...
16:08:26: Filling card details...
16:08:27: Solving hCaptcha...
16:08:29: Captcha solved.
16:08:30: Submitting payment...
16:08:31: Completed in 13.42s.
```

If a required env var is missing the script exits immediately with a clear error:

```
Missing required env vars: CAPTCHA_API_KEY, CARD_CVV
```

### shopnicekicks.com — Electron GUI

```bash
npm start
```

Fill in the form and click **Run Task**. The browser opens automatically and status lines stream into the log panel in real time.

---

## Tech Stack

- [puppeteer-extra](https://github.com/berstend/puppeteer-extra) — Puppeteer with plugin support
- [puppeteer-extra-plugin-stealth](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth) — Anti-bot-detection evasion
- [puppeteer-extra-plugin-recaptcha](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-recaptcha) — hCaptcha solving via 2Captcha
- [2Captcha](https://2captcha.com/) — Captcha solving service
- [Oxylabs](https://oxylabs.io/) — US residential proxy
- [Electron](https://www.electronjs.org/) — Desktop GUI (shopnicekicks flow)
- [dotenv](https://github.com/motdotla/dotenv) — Environment variable loading

---

## Disclaimer

This project is built for educational and personal testing purposes only. Automating checkout flows on live e-commerce platforms may violate their Terms of Service. Use responsibly.
