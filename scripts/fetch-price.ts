import { ofetch } from "ofetch";

async function fetchPrice() {
  const response = await ofetch("https://chp.mananjoshi.me/api/get-price", {
    retry: 3,
    retryDelay: 1000,
  });
  console.log({ response });
}

fetchPrice();
