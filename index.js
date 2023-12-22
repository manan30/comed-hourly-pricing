const puppeteer = require("puppeteer");
const { paused } = require("paused");
const { Telegram } = require("puregram");

const telegram = Telegram.fromToken(process.env.TELEGRAM_BOT_TOKEN);

const lastAccess = {
  price: "",
  time: "",
};

async function getPrice() {
  try {
    console.log("Scraping price");
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      ignoreDefaultArgs: ["--disable-extensions"],
    });
    const page = await browser.newPage();
    await page.goto("https://hourlypricing.comed.com/pricing-table-today/", {
      waitUntil: "domcontentloaded",
    });
    await paused(3000);
    const price = await page.evaluate(() => {
      const element = document.querySelector(".three-col > tbody");
      const children = Array.from(element.children);

      const currentHour = new Date().getHours();
      let currentPrice = children[currentHour].lastChild.textContent;
      if (currentPrice.toUpperCase === "N/A") {
        currentPrice = children[currentHour - 1].lastChild.textContent;
      }
      return currentPrice;
    });
    lastAccess.price = price;
    lastAccess.time = new Date().toLocaleString();
    console.log(lastAccess);
    await browser.close();
    return price;
  } catch (error) {
    console.error(error);
    return "Unable to get price";
  }
}

async function start() {
  telegram.updates.on("message", async (context) => {
    if (context.text.toLowerCase() !== "price") {
      context.reply(
        "Please only text the word 'price' to get the current price"
      );
      return;
    }

    let price = "";
    if (lastAccess.time && lastAccess.price) {
      const lastAccessTime = new Date(lastAccess.time).getTime();
      const currentTime = new Date().getTime();
      if (currentTime - lastAccessTime < 900000) {
        price = lastAccess.price;
      } else {
        price = await getPrice();
      }
    } else {
      price = await getPrice();
    }
    context.reply(`${price}`);
  });
  const updates = await telegram.updates.dropPendingUpdates();
  console.log(`Dropped ${updates} pending updates`);
  telegram.updates.startPolling();
}

start();
