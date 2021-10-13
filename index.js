const fs = require("fs");
const lighthouse = require("lighthouse");
const chromeLauncher = require("chrome-launcher");

(async () => {
  const url =
    "https://local.secure-www.stage.gaptechol.com/checkout/place-order/";
  const chrome = await chromeLauncher.launch({
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
  });
  const options = {
    logLevel: "verbose",
    output: "html",
    //onlyCategories: ["performance"],
    port: chrome.port,
  };

  const runnerResult = await lighthouse(url, options);

  // `.report` is the HTML report as a string
  const reportHtml = runnerResult.report;
  fs.writeFileSync(
    `Checkout_UI_Lighthouse_Report_${Date.now()}.html`,
    reportHtml
  );

  // `.lhr` is the Lighthouse Result as a JS object
  console.log("Report is done for", runnerResult.lhr.finalUrl);
  console.log(
    "Performance score was",
    runnerResult.lhr.categories.performance.score * 100
  );

  await chrome.kill();
})();
