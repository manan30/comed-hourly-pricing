import { Telegram } from "puregram";
import { getPrice } from "./get-price";
import { NextRequest, NextResponse } from "next/server";

const CHAT_ID = "-4084630293";
const telegram = Telegram.fromToken(process.env.TELEGRAM_BOT_TOKEN!);

export async function GET(req: NextRequest) {
  try {
    const price = await getPrice();
    await telegram.api.sendMessage({
      chat_id: CHAT_ID,
      text: price,
    });
    return NextResponse.json({ message: "Message sent" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to send message" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
