import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Use stealth plugin to avoid detection by anti-bot systems
puppeteer.use(StealthPlugin());

// Use recaptcha plugin with 2Captcha key from env for captcha solving
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: "2captcha",
      token: process.env.CAPTCHA_API_KEY,
    },
    visualFeedback: true,
  })
);

// Utility function for logging with timestamps and log levels
function logStatus(message, level = "log") {
  const now = new Date();
  const time = now.toLocaleTimeString("en-GB");
  const prefix = `${time}`;
  if (level === "log") {
    console.log(`${prefix}: ${message}`);
  } else if (level === "warn") {
    console.warn(`${prefix}: ${message}`);
  } else if (level === "error") {
    console.error(`${prefix}: ${message}`);
  }
}

// Returns a function to get elapsed time in seconds since creation
function createTimer() {
  const start = Date.now();
  return () => ((Date.now() - start) / 1000).toFixed(2);
}

// Extract proxy and card info from environment variables
const {
  PROXY_HOST: proxyHost,
  PROXY_USER: proxyUser,
  PROXY_PASS: proxyPass,

  CARD_NUMBER: cardNumber,
  CARD_EXPIRY: cardExpiry,
  CARD_CVV: cardCVV,
} = process.env;

// Product page URL to automate
const targetUrl =
  "https://kith.com/collections/mens-footwear-sneakers/products/ai1201a019-006";

// Launches a new browser instance, optionally with a proxy
async function launchBrowser() {
  return puppeteer.launch({
    headless: false,
    args: proxyHost ? [`--proxy-server=${proxyHost}`] : [],
    defaultViewport: null,
  });
}

// Authenticates proxy if credentials are provided
async function authenticateProxy(page) {
  if (proxyUser && proxyPass) {
    await page.authenticate({ username: proxyUser, password: proxyPass });
  }
}

// Selects a shoe size by label (e.g., "6 US")
async function selectSize(page, sizeLabel = "6 US") {
  await page.waitForSelector(".product-swatch__input:enabled + label", {
    visible: true,
  });

  // Find and click the label matching the desired size
  const result = await page.evaluate((label) => {
    const labels = Array.from(
      document.querySelectorAll(".product-swatch__input:enabled + label")
    );

    const cleanedLabel = label.trim().toLowerCase();

    for (const l of labels) {
      const text = l.innerText || l.textContent || "";
      if (text.trim().toLowerCase() === cleanedLabel) {
        l.click();
        return true;
      }
    }
    return false;
  }, sizeLabel);

  if (!result) {
    logStatus(`Size "${sizeLabel}" not found or not clickable.`, "warn");
  } else {
    logStatus(`Size "${sizeLabel}" selected.`);
  }

  return result;
}

// Clicks the "Add to Cart" button
async function addToCart(page) {
  await page.click("button[js-add-to-cart]");
}

// Proceeds to checkout from the cart drawer
async function proceedToCheckout(page) {
  await page.waitForSelector("#CartDrawer-Checkout", { timeout: 10000 });
  await page.click("#CartDrawer-Checkout");
}

// Fills out shipping information on the checkout page
async function fillShippingInfo(page) {
  await page.waitForSelector('input[name="email"]');
  await page.type('input[name="email"]', "Meuser@gmail.com");
  await new Promise((r) => setTimeout(r, 500));
  await page.type('input[name="firstName"]', "Muhammad");
  await new Promise((r) => setTimeout(r, 500));
  await page.type('input[name="lastName"]', "Huda");
  await new Promise((r) => setTimeout(r, 500));
  await page.type('input[name="address1"]', "724 Alder St");
  await new Promise((r) => setTimeout(r, 500));
  await page.type('input[name="city"]', "Edmonds");
  await new Promise((r) => setTimeout(r, 500));
  await page.select('select[name="zone"]', "WA");
  await new Promise((r) => setTimeout(r, 500));
  await page.type('input[name="postalCode"]', "98020");
  await new Promise((r) => setTimeout(r, 500));
  await page.type('input[name="phone"]', "6513650822");
}

// Fills out credit card information inside iframes
async function fillCardInfo(page) {
  logStatus("Waiting for card info iframes to load...");

  // Card number iframe and input
  const cardNumberIframeSelector = 'iframe[name^="card-fields-number"]';
  await page.waitForSelector(cardNumberIframeSelector, { timeout: 20000 });
  const cardNumberFrame = await (
    await page.$(cardNumberIframeSelector)
  ).contentFrame();
  await cardNumberFrame.waitForSelector('input[name="number"]', {
    timeout: 5000,
  });
  await cardNumberFrame.type(
    'input[name="number"]',
    cardNumber || "4242 4242 4242 8529"
  );
  logStatus("Card number filled");

  // Expiry date iframe and input
  const expiryIframeSelector = 'iframe[name^="card-fields-expiry"]';
  await page.waitForSelector(expiryIframeSelector, { timeout: 10000 });
  const expiryFrame = await (await page.$(expiryIframeSelector)).contentFrame();
  await expiryFrame.waitForSelector('input[name="expiry"]', { timeout: 5000 });
  await expiryFrame.type('input[name="expiry"]', cardExpiry || "04 / 28");
  logStatus("Expiry date filled");

  // CVV iframe and input
  const cvvIframeSelector = 'iframe[name^="card-fields-verification_value"]';
  await page.waitForSelector(cvvIframeSelector, { timeout: 10000 });
  const cvvFrame = await (await page.$(cvvIframeSelector)).contentFrame();
  await cvvFrame.waitForSelector('input[name="verification_value"]', {
    timeout: 5000,
  });
  await cvvFrame.type('input[name="verification_value"]', cardCVV || "907");
  logStatus("CVV filled");
}

// Main automation flow
async function run() {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await authenticateProxy(page);

  const getElapsed = createTimer();

  try {
    // Go to product page
    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Select size and continue if available
    if (await selectSize(page)) {
      logStatus("Adding item to cart...");
      await addToCart(page);

      logStatus("Going to checkout page...");
      await Promise.all([
        page.waitForNavigation({
          waitUntil: "domcontentloaded",
          timeout: 60000,
        }),
        proceedToCheckout(page),
      ]);

      logStatus("Submitting address...");
      await fillShippingInfo(page);

      logStatus("Filling card details...");
      await fillCardInfo(page);

      // Solve captcha if present
      logStatus("Solving hCaptcha...");
      const { error, solutions } = await page.solveRecaptchas();

      if (error) {
        logStatus(`Error solving captcha: ${error}`, "error");
      } else {
        logStatus(`Captcha solved`);
      }

      // Submit payment
      logStatus("Submitting payment info...");
      await page.waitForSelector("#checkout-pay-button", {
        visible: true,
        timeout: 10000,
      });
      await page.click("#checkout-pay-button");

      // Wait for processing state
      await page.waitForFunction(
        () =>
          document
            .querySelector("#checkout-pay-button")
            ?.innerText.toLowerCase()
            .includes("processing"),
        { timeout: 10000 }
      );

      // Log total time taken
      const totalTime = getElapsed();
      logStatus(`Task Speed: ${totalTime} seconds...`);
      logStatus("Script finished.");
    } else {
      logStatus("Size 6 US not found or not available.", "warn");
    }
  } catch (error) {
    logStatus(`Error during automation: ${error}`, "error");
  } finally {
    await browser.close();
  }
}

// Start the automation
run();
