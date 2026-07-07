// app/api/parse-intent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { parseIntent } from "../../../lib/groq";
import { rateLimit, clientIp } from "../../../lib/rate-limit";

export async function POST(req: NextRequest) {
  const rl = rateLimit(`parse-intent:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests — slow down and try again." }, { status: 429 });
  }

  const { text } = await req.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing 'text'." }, { status: 400 });
  }
  const intent = await parseIntent(text);
  return NextResponse.json(intent);
}
