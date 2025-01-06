import { ofetch } from "ofetch";

const handler: ExportedHandler = {
  async fetch() {
    return new Response("Unauthorized", {
      status: 401,
      statusText: "Unauthorized",
    });
  },
  async scheduled() {
    const response = await ofetch("https://chp.mananjoshi.me/api/get-price", {
      retry: 3,
      retryDelay: 1000,
    });
    console.log({ response });
  },
};

export default handler;
