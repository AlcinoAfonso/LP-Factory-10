import { NextResponse } from "next/server";
// @ts-ignore -- pacote oficial declarado em dependencies; resolução ocorre no ambiente de runtime
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKFLOW_ID = "wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7";
const WORKFLOW_VERSION = "2";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

export async function POST() {
  try {
    const client = getClient();

    const session = await client.chatkit.sessions.create({
      workflow: {
        id: WORKFLOW_ID,
        version: WORKFLOW_VERSION,
      },
      user: {
        id: "supabase-inspect-dev-user",
        display_name: "Supabase Inspect Dev User",
      },
    });

    return NextResponse.json(
      {
        client_secret: session.client_secret,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown ChatKit session error.";

    return NextResponse.json(
      {
        error: "chatkit_session_error",
        message,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
