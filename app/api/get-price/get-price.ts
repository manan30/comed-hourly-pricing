import puppeteer from "puppeteer";
import { paused } from "paused";

const UNABLE_TO_GET_PRICE = "Unable to get price";
const N_A = "N/A";

function emptyString(value: string) {
  return value && value.trim() === "";
}

const lastAccess = {
  price: "",
  time: "",
};

export async function getPrice() {
  try {
    console.log("Scraping price");
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      ignoreDefaultArgs: ["--disable-extensions"],
    });
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

      let currentHour = new Date().getUTCHours();
      currentHour = (currentHour - 6 + 24) % 24;

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
