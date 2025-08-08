# Shopify Checkout Automation with Puppeteer

This project automates the full checkout process on Shopify websites using _Node.js, **Puppeteer**, **2Captcha** (for hCaptcha solving), and **Oxylabs US proxy**. It simulates a user journey from product selection to final purchase with support for address autofill, proxy routing, and captcha solving.

---

## Features

- Full automation: product selection, add to cart, checkout, address fill, shipping selection, and payment form fill.
- Solves hCaptcha automatically using 2Captcha API (for Kith).
- Supports US proxy (Oxylabs) to bypass country restrictions (for Kith).
- Task speed logging and status updates.
- Works even with Shopify’s bot protections.
- UI support using Electron (for ShopNiceKicks).

---

## How It Works

plaintext

1. Launch Puppeteer with US Proxy (Oxylabs)
2. Visit product page
3. Add product to cart
4. Navigate to checkout
5. Fill shipping information
6. Solve hCaptcha (via 2Captcha)
7. Fill payment form
8. Submit and log total time

---

## Automation Targets

This project contains _two separate automation flows_:

| Target Site       | Captcha Solving | Proxy Needed  | UI Support      |
| ----------------- | --------------- | ------------- | --------------- |
| kith.com          | ✅ 2Captcha     | ✅ Oxylabs    | ❌              |
| shopnicekicks.com | ❌ Not needed   | ❌ Not needed | ✅ Electron GUI |

---

# Overcoming E-commerce Automation Challenges

Here are some common challenges encountered during e-commerce automation and the solutions used to overcome them.

| Challenge                             | Solution                                                                                                                                       |
| :------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| Item not shipping to Lebanon          | Used Oxylabs US proxy to spoof a US location, enabling access to US-only shipping options.                                                     |
| Shopify checkout page loads slowly    | Delayed automation until the **DOMContentLoaded** event instead of the load event, which significantly improved performance and reliability.   |
| hCaptcha blocks automation            | Integrated the _2Captcha API_ to solve hCaptcha challenges dynamically.                                                                        |
| No sitekey for captcha                | Used an _interactive element injection method_ instead of relying on a sitekey, allowing the script to handle captchas without a specific key. |
| Card input fields inside a Shadow DOM | Accessed the fields using **page.evaluateHandle()** in conjunction with native querySelector techniques to bypass the Shadow DOM.              |
| Address form required US ZIP/State    | Used dummy US addresses for compatibility with the checkout form, ensuring a smooth and uninterrupted process.                                 |

## Setup Instructions

### 1. Clone the Project

Open your terminal and run the following commands to clone the repository and navigate into the project directory:

```bash
git clone [https://github.com/your-username/shopify-checkout-automation.git](https://github.com/your-username/shopify-checkout-automation.git)
cd shopify-checkout-automation
```

### 2. instal Dependencies

Install the necessary Node.js packages by running:

```bash
npm install
```

### 3. Create .env file

Create a file named .env in the root of the project and add your configuration details. This file will store sensitive information like API keys and personal data.

```bash

# Proxy settings for location spoofing

PROXY_HOST=your api_host
PROXY_USER=your api_user
PROXY_PASS=your api_pass

# 2Captcha API key

CAPTCHA_API_KEY=your_2captcha_api_key

# Payment card details

CARD_NAME=John Doe
CARD_NUMBER=4242424242424242
EXPIRY=12/30
CVV=123
```

## Usage

### To start the automation script, simply run:

```bash
node kith.mjs
```

### To start the automation script on shopnicekicks, simply run:

```bash
npm start
```

### Your terminal will display real-time progress of the checkout process, similar to the following:

```bash
16:08:18: Adding item to cart...
16:08:21: Going to checkout page...
16:08:22: Submitting address...
16:08:24: Submitting shipping rate...
16:08:25: Calculating taxes…
16:08:27: Filling card details...
16:08:27: Submitting payment...
16:08:29: Total price: 34.11...
16:08:30: Task Speed: 10.96 seconds...
```

## Technologies Used

plaintext

1. Puppeteer
2. 2Captcha
3. Oxylabs Proxy
4. Node.js
5. Electron (for shopnicekicks)

## Disclaimer

This automation is built for educational and testing purposes only. Misusing automation scripts on live eCommerce platforms may violate their terms of service.
