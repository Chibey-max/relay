// app/api/parse-intent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { parseIntent } from "../../../lib/groq";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing 'text'." }, { status: 400 });
  }
  const intent = await parseIntent(text);
  return NextResponse.json(intent);
}
