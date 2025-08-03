import puppeteer from "puppeteer";

const run = async () => {
  const productUrl =
    "https://kith.com/collections/mens-footwear-sneakers/products/ai1203a607-105";

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  try {
    console.log("Navigating to Kith product page...");
    await page.goto(productUrl, { waitUntil: "networkidle2" });

    await page.waitForSelector("h1.product__title", { timeout: 10000 });

    const title = await page.$eval("h1.product__title", (el) =>
      el.textContent.trim()
    );
    console.log("Product Title:", title);

    await page.screenshot({ path: "./screenshots/kith-product.png" });
    console.log("Screenshot saved in screenshots folder.");
  } catch (error) {
    console.error("Error loading product:", error.message);
  } finally {
    await browser.close();
  }
};

run();
