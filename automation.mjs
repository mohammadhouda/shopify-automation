import puppeteer from "puppeteer";
import fs from "fs";

export async function runAutomation(
  { productUrl, shoeSize, checkoutInfo, cardInfo },
  event
) {
  const setStatus = (msg) => {
    const t = new Date().toTimeString().split(" ")[0];
    const statusMsg = `${t}: ${msg}`;
    console.log(statusMsg);
    if (event) {
      event.sender.send("status-update", statusMsg);
    }
  };

  async function selectShoeSize(page, size) {
    await page.waitForSelector('input[type="radio"][name="option-0"]', {
      timeout: 60000,
    });
    const sizes = await page.$$eval(
      'input[type="radio"][name="option-0"]',
      (inputs) => inputs.map((input) => ({ value: input.value, id: input.id }))
    );
    const selected = sizes.find((s) => s.value === size);
    if (!selected) throw new Error(`Shoe size ${size} not found`);
    await page.click(`label[for="${selected.id}"]`);
  }

  async function addToCart(page) {
    const btn = await page.waitForSelector("button.ProductForm__AddToCart", {
      visible: true,
      timeout: 10000,
    });
    await page.evaluate((btn) => btn.click(), btn);
    await new Promise((res) => setTimeout(res, 2000));
  }

  async function goToCheckout(page) {
    await page.goto("https://shopnicekicks.com/cart", {
      waitUntil: "networkidle2",
    });
    await page.waitForSelector('button[name="checkout"]', {
      visible: true,
      timeout: 10000,
    });
    await page.click('button[name="checkout"]');
    await page.waitForNavigation({ waitUntil: "networkidle2" });
  }

  async function fillShipping(page, info) {
    await page.type('input[name="email"]', info.email);
    await page.type('input[name="firstName"]', info.firstName);
    await page.type('input[name="lastName"]', info.lastName);
    await page.type('input[name="address1"]', info.address1);
    await page.type('input[name="city"]', info.city);
    await page.select('select[name="countryCode"]', "US");
    await page.waitForSelector('select[name="zone"]', { timeout: 10000 });
    await page.select('select[name="zone"]', info.state);
    await page.type('input[name="postalCode"]', info.zip);
    await page.type('input[name="phone"]', info.phone);
  }

  async function fillCardField(page, iframeSrcContains, inputName, value) {
    const iframeHandle = await page.waitForSelector(
      `iframe[src*="${iframeSrcContains}"]`,
      { timeout: 10000 }
    );
    const frame = await iframeHandle.contentFrame();
    if (!frame) throw new Error(`Could not access iframe ${iframeSrcContains}`);
    const input = await frame.waitForSelector(`input[name="${inputName}"]`, {
      timeout: 20000,
    });
    await input.type(value);
  }

  async function fillPayment(page, cardInfo) {
    await fillCardField(page, "number-ltr", "number", cardInfo.number);
    await fillCardField(page, "expiry-ltr", "expiry", cardInfo.expiry);
    await fillCardField(
      page,
      "verification_value-ltr",
      "verification_value",
      cardInfo.cvc
    );
  }

  async function agreeTerms(page) {
    await page.evaluate(() => {
      const el = [...document.querySelectorAll("label, a, span")].find((e) =>
        e.textContent.includes("I agree")
      );
      if (el) el.click();
    });
    await new Promise((res) => setTimeout(res, 1000));
  }

  async function submitPayment(page) {
    const payButtonSelector = "#checkout-pay-button";
    await page.waitForSelector(payButtonSelector, {
      visible: true,
      timeout: 20000,
    });
    await page.click(payButtonSelector);
    await page.waitForSelector('progress[aria-label="Processing…"]', {
      timeout: 60000,
    });
  }

  const start = Date.now();
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });
  const page = await browser.newPage();

  try {
    setStatus(`Navigating to: ${productUrl}`);
    await page.goto(productUrl, { waitUntil: "networkidle2", timeout: 0 });

    await page.waitForSelector("h1.ProductMeta__Title", { timeout: 10000 });

    const isSoldOut = await page
      .$eval("body", (body) => {
        const btn = body.querySelector("button[name='add'][disabled]");
        if (btn?.innerText.toLowerCase().includes("sold out")) return true;
        return !!body.querySelector(
          ".product-form-info-container span.sold_out"
        );
      })
      .catch(() => false);

    if (isSoldOut) throw new Error("Product is sold out");

    setStatus("Selecting shoe size...");
    await selectShoeSize(page, shoeSize);

    setStatus("Adding to cart...");
    await addToCart(page);

    setStatus("Going to checkout...");
    await goToCheckout(page);

    setStatus("Filling shipping info...");
    await fillShipping(page, checkoutInfo);

    setStatus("Filling card details...");
    await fillPayment(page, cardInfo);

    setStatus("Agreeing to terms...");
    await agreeTerms(page);

    setStatus("Submitting payment...");
    await submitPayment(page);

    setStatus("Payment processing...");

    const priceText = await page.$eval(
      "strong._19gi7yt0",
      (el) => el.textContent
    );
    setStatus(`Total price: ${priceText}`);
  } catch (err) {
    console.error("Error:", err.message);
    fs.writeFileSync("debug.html", await page.content());
  } finally {
    setStatus(
      `Task Speed: ${((Date.now() - start) / 1000).toFixed(2)} seconds...`
    );
    setStatus("Script finished.");
  }
}
