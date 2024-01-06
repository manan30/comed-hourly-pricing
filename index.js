const puppeteer = require("puppeteer");
const cron = require("node-cron");
const { paused } = require("paused");
const { Telegram } = require("puregram");

const UNABLE_TO_GET_PRICE = "Unable to get price";
const N_A = "N/A";

function emptyString(value) {
  return value && value.trim() === "";
}

const telegram = Telegram.fromToken(process.env.TELEGRAM_BOT_TOKEN);

const lastAccess = {
  price: "",
  time: "",
};

async function getPrice() {
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
      const children = Array.from(element.children);

      let currentHour = new Date().getUTCHours();
      currentHour = (currentHour - 6 + 24) % 24;

      let hour = children[currentHour].firstChild.textContent;
      let currentPrice = children[currentHour].lastChild.textContent;
      if (currentPrice.toUpperCase() === N_A) {
        currentPrice = children[currentHour - 1].lastChild.textContent;
        hour = children[currentHour - 1].firstChild.textContent;
      }
      return { currentPrice, currentHour, children, hour };
    });
    // console.log({ price, rest });
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

const CRON_TIME = "* * * * *";

const task = cron.schedule(
  CRON_TIME, // every 15 minutes past the hour,
  async () => {
    const price = await getPrice();
    await telegram.api.sendMessage({ chat_id: "@comed_hpa_bot", text: price });
  },
  { recoverMissedExecutions: true, timezone: "America/Chicago" }
);

task.start();
