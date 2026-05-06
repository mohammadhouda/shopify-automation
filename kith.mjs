import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
import dotenv from "dotenv";

dotenv.config();

puppeteer.use(StealthPlugin());
puppeteer.use(
  RecaptchaPlugin({
    provider: { id: "2captcha", token: process.env.CAPTCHA_API_KEY },
    visualFeedback: true,
  })
);

const REQUIRED_ENV = [
  "CAPTCHA_API_KEY",
  "CARD_NUMBER", "CARD_EXPIRY", "CARD_CVV",
  "SHIPPING_EMAIL", "SHIPPING_FIRST", "SHIPPING_LAST",
  "SHIPPING_ADDRESS", "SHIPPING_CITY", "SHIPPING_STATE",
  "SHIPPING_ZIP", "SHIPPING_PHONE",
];

function validateEnv() {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(", ")}`);
    process.exit(1);
  }
}

const {
  PROXY_HOST: proxyHost,
  PROXY_USER: proxyUser,
  PROXY_PASS: proxyPass,

  CARD_NUMBER: cardNumber,
  CARD_EXPIRY: cardExpiry,
  CARD_CVV: cardCVV,

  TARGET_URL: targetUrl = "https://kith.com/collections/mens-footwear-sneakers/products/sl47581100",
  SHOE_SIZE: shoeSize = "5.5 US",

  SHIPPING_EMAIL: shippingEmail,
  SHIPPING_FIRST: shippingFirst,
  SHIPPING_LAST: shippingLast,
  SHIPPING_ADDRESS: shippingAddress,
  SHIPPING_CITY: shippingCity,
  SHIPPING_STATE: shippingState,
  SHIPPING_ZIP: shippingZip,
  SHIPPING_PHONE: shippingPhone,
} = process.env;

function log(message, level = "log") {
  const time = new Date().toLocaleTimeString("en-GB");
  console[level](`${time}: ${message}`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function createTimer() {
  const start = Date.now();
  return () => ((Date.now() - start) / 1000).toFixed(2);
}

async function launchBrowser() {
  return puppeteer.launch({
    headless: false,
    args: proxyHost ? [`--proxy-server=${proxyHost}`] : [],
    defaultViewport: null,
  });
}

async function authenticateProxy(page) {
  if (proxyUser && proxyPass) {
    await page.authenticate({ username: proxyUser, password: proxyPass });
  }
}

async function dismissWelcomeMat(page) {
  try {
    await page.waitForSelector("welcome-mat.open button[js-close-welcome-mat]", {
      visible: true,
      timeout: 5000,
    });
    await page.click("welcome-mat.open button[js-close-welcome-mat]");
    await page.waitForSelector("welcome-mat.open", { hidden: true, timeout: 5000 });
    log("Welcome popup dismissed.");
  } catch {
    // Popup didn't appear — nothing to do
  }
}

async function selectSize(page, sizeLabel) {
  await page.waitForSelector(".product-swatch__input:enabled + label", {
    visible: true,
  });

  const found = await page.evaluate((label) => {
    const target = label.trim().toLowerCase();
    const match = Array.from(
      document.querySelectorAll(".product-swatch__input:enabled + label")
    ).find((l) => (l.innerText || l.textContent || "").trim().toLowerCase() === target);

    if (match) { match.click(); return true; }
    return false;
  }, sizeLabel);

  if (found) {
    log(`Size "${sizeLabel}" selected.`);
  } else {
    log(`Size "${sizeLabel}" not found or not available.`, "warn");
  }

  return found;
}

async function addToCart(page) {
  await page.waitForSelector("button[js-add-to-cart]", { visible: true });
  await page.click("button[js-add-to-cart]");
}

async function proceedToCheckout(page) {
  await page.waitForSelector("#CartDrawer-Checkout", { timeout: 10000 });
  await page.click("#CartDrawer-Checkout");
}

async function fillShippingInfo(page) {
  await page.waitForSelector('input[name="email"]');

  // Fill fields that appear immediately
  const initialFields = [
    ['input[name="email"]', shippingEmail],
    ['input[name="firstName"]', shippingFirst],
    ['input[name="lastName"]', shippingLast],
    ['input[name="address1"]', shippingAddress],
    ['input[name="city"]', shippingCity],
  ];

  for (const [selector, value] of initialFields) {
    await page.type(selector, value);
    await sleep(300);
  }

  // Select country first — this triggers Shopify to load the zone dropdown
  const countrySelector = 'select[name="countryCode"]';
  const hasCountry = await page.$(countrySelector);
  if (hasCountry) {
    await page.select(countrySelector, "US");
    await sleep(400);
  }

  // Zone dropdown is dynamically injected after country/city are filled
  await page.waitForSelector('select[name="zone"]', { visible: true, timeout: 15000 });
  await page.select('select[name="zone"]', shippingState);
  await sleep(300);

  await page.type('input[name="postalCode"]', shippingZip);
  await sleep(300);
  await page.type('input[name="phone"]', shippingPhone);
}

async function fillCardInfo(page) {
  log("Waiting for card iframes...");

  const fillFrame = async (iframeSelector, inputName, value, timeoutMs = 10000) => {
    await page.waitForSelector(iframeSelector, { timeout: timeoutMs });
    const frame = await (await page.$(iframeSelector)).contentFrame();
    await frame.waitForSelector(`input[name="${inputName}"]`, { timeout: 5000 });
    await frame.type(`input[name="${inputName}"]`, value);
  };

  await fillFrame('iframe[name^="card-fields-number"]', "number", cardNumber, 20000);
  log("Card number filled.");
  await fillFrame('iframe[name^="card-fields-expiry"]', "expiry", cardExpiry);
  log("Expiry filled.");
  await fillFrame('iframe[name^="card-fields-verification_value"]', "verification_value", cardCVV);
  log("CVV filled.");
}

async function run() {
  validateEnv();

  const browser = await launchBrowser();
  const page = await browser.newPage();
  await authenticateProxy(page);
  const getElapsed = createTimer();

  try {
    log("Navigating to product page...");
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    await dismissWelcomeMat(page);

    if (!(await selectSize(page, shoeSize))) return;

    log("Adding item to cart...");
    await addToCart(page);

    log("Proceeding to checkout...");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60000 }),
      proceedToCheckout(page),
    ]);

    log("Filling shipping info...");
    await fillShippingInfo(page);

    log("Filling card details...");
    await fillCardInfo(page);

    log("Solving hCaptcha...");
    const { error } = await page.solveRecaptchas();
    if (error) {
      log(`Captcha error: ${error}`, "error");
    } else {
      log("Captcha solved.");
    }

    log("Submitting payment...");
    await page.waitForSelector("#checkout-pay-button", { visible: true, timeout: 10000 });
    await page.click("#checkout-pay-button");

    await page.waitForFunction(
      () => document.querySelector("#checkout-pay-button")?.innerText.toLowerCase().includes("processing"),
      { timeout: 10000 }
    );

    log(`Completed in ${getElapsed()}s.`);
  } catch (err) {
    log(`Automation failed: ${err.message}`, "error");
  } finally {
    await browser.close();
  }
}

run();
