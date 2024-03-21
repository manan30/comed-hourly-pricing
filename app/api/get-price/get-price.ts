import puppeteer from "puppeteer-core";
import { paused } from "paused";
import chromium from "@sparticuz/chromium-min";

const UNABLE_TO_GET_PRICE = "Unable to get price";
const N_A = "N/A";

const lastAccess = {
  price: "",
  time: "",
};

let isFetching = false;

async function getBrowser() {
  return puppeteer.launch({
    args: [
      ...chromium.args,
      "--hide-scrollbars",
      "--disable-web-security",
      "--no-sandbox",
    ],
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(
      `https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar`
    ),
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });
}

export async function getPrice() {
  try {
    if (isFetching) {
      return false;
    }
    isFetching = true;
    console.log("Scraping price");
    const browser = await getBrowser();
    // const browser = await puppeteer.launch({
    //   headless: false,
    //   // headless: "shell",
    //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
    //   ignoreDefaultArgs: ["--disable-extensions"],
    //   devtools: true,
    // });
    const page = await browser.newPage();
    await page.goto("https://hourlypricing.comed.com/pricing-table-today/", {
      waitUntil: "domcontentloaded",
    });
    await paused(3000);
    const {
      currentPrice: price,
      hour,
      ...rest
    } = await page.evaluate(() => {
      const N_A = "N/A";
      const element = document.querySelector(".three-col > tbody");
      const children = Array.from(element?.children ?? []);

      const getCentralTimeOffset = () => {
        const stdTimezoneOffset = () => {
          var jan = new Date(0, 1);
          var jul = new Date(6, 1);
          return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
        };

        var today = new Date();

        const isDstObserved = (today: Date) => {
          return today.getTimezoneOffset() < stdTimezoneOffset();
        };

        if (isDstObserved(today)) {
          return -5;
        } else {
          return -6;
        }
      };

      const date = new Date();
      const localTime = date.getTime();
      const localOffset = date.getTimezoneOffset() * 60 * 1000;
      const utcTime = localTime + localOffset;
      const centralTimeOffset = getCentralTimeOffset();
      const chicago = utcTime + 60 * 60 * 1000 * centralTimeOffset;
      const chicagoDate = new Date(chicago);
      let currentHour = chicagoDate.getHours();
      currentHour = (currentHour + 24) % 24;

      let hour = children[currentHour]?.firstChild?.textContent;
      let currentPrice = children[currentHour]?.lastChild?.textContent ?? N_A;
      if (currentPrice.toUpperCase() === N_A) {
        currentPrice = children[currentHour - 1]?.lastChild?.textContent ?? N_A;
        hour = children[currentHour - 1]?.firstChild?.textContent;
      }
      return { currentPrice, currentHour, children, hour };
    });
    lastAccess.price = price;
    lastAccess.time = new Date().toLocaleString();
    console.log(lastAccess);
    await browser.close();
    return `${hour} - ${price}`;
  } catch (error) {
    console.error(error);
    return UNABLE_TO_GET_PRICE;
  } finally {
    isFetching = false;
  }
}

// async function start() {
//   telegram.updates.on("message", async (context) => {
//     if (context.text.toLowerCase() !== "/price") {
//       context.reply(
//         "Please only use the '/price' command to get the current price"
//       );
//       return;
//     }

//     let price = "";
//     if (
//       !emptyString(lastAccess.time) &&
//       !emptyString(lastAccess.price) &&
//       lastAccess.price !== UNABLE_TO_GET_PRICE &&
//       lastAccess.price !== N_A
//     ) {
//       const lastAccessTime = new Date(lastAccess.time).getTime();
//       const currentTime = new Date().getTime();
//       if (currentTime - lastAccessTime < 900000) {
//         price = lastAccess.price;
//       } else {
//         price = await getPrice();
//       }
//     } else {
//       price = await getPrice();
//     }
//     context.reply(`${price}`);
//   });
//   const updates = await telegram.updates.dropPendingUpdates();
//   console.log(`Dropped ${updates} pending updates`);
//   telegram.updates.startPolling();
// }

// start();

// const CRON_TIME = "15 * * * *";

// const task = cron.schedule(
//   CRON_TIME, // every 15 minutes past the hour,
//   async () => {},
//   { recoverMissedExecutions: true, timezone: "America/Chicago" }
// );

// task.start();
