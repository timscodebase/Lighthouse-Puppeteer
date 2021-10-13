const chromeLauncher = require("chrome-launcher");
const puppeteer = require("puppeteer");
const lighthouse = require("lighthouse");
const config = require("lighthouse/lighthouse-core/config/lr-desktop-config.js");
const reportGenerator = require("./node_modules/lighthouse/report/generator/report-generator.js");
const request = require("request");
const util = require("util");
const fs = require("fs");

(async () => {
  const cookies = require("./cookies.json");
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

  // Launch chrome using chrome-launcher
  const chrome = await chromeLauncher.launch(launchOptions);
  launchOptions.port = chrome.port;

  // Connect to it using puppeteer.connect().
  const resp = await util.promisify(request)(
    `http://localhost:${launchOptions.port}/json/version`
  );
  const { webSocketDebuggerUrl } = JSON.parse(resp.body);
  const browser = await puppeteer.connect({
    browserWSEndpoint: webSocketDebuggerUrl,
  });

  //Puppeteer
  page = (await browser.pages())[0];
  await page.setCookie(...cookies);
  await page.setViewport({ width: 1200, height: 900 });
  await page.goto(URL, { waitUntil: "networkidle2" });

  console.log(page.url());

  // Run Lighthouse.
  const report = await lighthouse(page.url(), launchOptions, config).then(
    (results) => {
      return results;
    }
  );
  const html = reportGenerator.generateReport(report.lhr, "html");
  const json = reportGenerator.generateReport(report.lhr, "json");

  console.log(`Lighthouse score: ${report.lhr.score}`);

  await browser.disconnect();
  await chrome.kill();

  //Write report html to the file
  fs.writeFile(
    `Checkout_UI_Lighthouse_Report_${Date.now()}.html`,
    html,
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );

  //Write report json to the file
  fs.writeFile(
    `Checkout_UI_Lighthouse_Report_${Date.now()}.json`,
    json,
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
})();
