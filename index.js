const fs = require("fs");
const puppeteer = require("puppeteer");
const lighthouse = require("lighthouse");
const config = require("lighthouse/lighthouse-core/config/lr-desktop-config.js");
const reportGenerator = require("./node_modules/lighthouse/report/generator/report-generator.js");

const cookies = require("./cookies.js");

const URL =
  "https://local.secure-www.stage.gaptechol.com/checkout/place-order/";

const launchOptions = {
  chromeFlags: [
    // "--headless",
    // "--disable-mobile-emulation",
    //"--no-sandbox",
    "--allow-running-insecure-content",
    "--ignore-certificate-errors",
  ],
  logLevel: "verbose",
  output: "json",
  disableDeviceEmulation: true,
  defaultViewport: {
    width: 1200,
    height: 900,
  },
};

(async () => {
  let browser = null;
  let page = null;

  try {
    browser = await navigateToCheckoutUI();
    page = (await browser.pages())[0];
    console.log(browser.wsEndpoint());
    console.log("Running lighthouse...");
    const report = await lighthouse(
      page.url(),
      {
        port: new URL(browser.wsEndpoint()).port,
        output: "json",
        logLevel: "info",
        disableDeviceEmulation: true,
        chromeFlags: ["--disable-mobile-emulation"],
      },
      config
    );
    const json = reportGenerator.generateReport(report.lhr, "json");
    const html = reportGenerator.generateReport(report.lhr, "html");
    console.log(`Lighthouse scores: ${report.lhr.score}`);

    console.log("Writing results...");
    fs.writeFileSync("report.json", json);
    fs.writeFileSync("report.html", html);
    console.log("Done!");
  } catch (error) {
    console.error("Error!", error);
  } finally {
    //await page.close();
    // await browser.close();
  }
})();

async function navigateToCheckoutUI() {
  const browser = await puppeteer.launch(launchOptions);

  console.log("Navigating to Checkout UI...");
  const page = (await browser.pages())[0];
  await page.setCookie(...cookies);
  await page.goto(URL, { waitUntil: "networkidle0" });
  return browser;
}
