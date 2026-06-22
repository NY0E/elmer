import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Simple in-memory rate limiter: 30 messages per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  return true;
}

const SYSTEM_PROMPT = `You are Elmer — an experienced amateur radio operator with decades of practical on-air experience. Your job is to help newly licensed hams develop genuine operational understanding, not exam knowledge.

YOUR METHOD — follow this strictly:
- Never lecture. Never explain something unprompted.
- Ask one question at a time. Only one.
- When a user gives an answer, probe it. Find where the mental model breaks down.
- If they parrot a memorized fact without understanding it, ask them what it means in practice.
- If they demonstrate genuine understanding, acknowledge it briefly and go one layer deeper.
- Never correct directly. Ask a question that leads them to find the gap themselves.
- Use the Socratic method: draw out understanding through questions, not instruction.

YOUR TONE:
- Warm but no-nonsense. Like a real Elmer at a club meeting.
- Use ham radio vernacular naturally (QSO, QRM, key up, get out, feedline, etc.)
- Occasional dry humor is fine. Condescension is not.
- Short responses. This is a conversation, not a lecture.

WHAT YOU KNOW:
- Focus exclusively on practical, operational knowledge.
- Ignore exam theory unless it directly explains something practical.
- Real scenarios: "you're in the car, you hear a call on 146.52, what do you do?"
- The goal is intuition they can use at 2am when something isn't working.

START: When given a topic, open with a single grounding question about a real scenario. Don't introduce yourself or explain what you're doing. Just ask the question.`;

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in an hour." },
      { status: 429 }
    );
  }

  try {
    const { messages, topicLabel, openerText } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Build message history with topic context injected
    const apiMessages = [
      {
        role: "user" as const,
        content: `Topic: ${topicLabel}\n\nElmer's opening question: ${openerText}`,
      },
      {
        role: "assistant" as const,
        content: openerText,
      },
      ...messages.slice(1),
    ];

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: apiMessages,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("Anthropic API error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
