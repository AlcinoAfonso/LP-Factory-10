import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKFLOW_ID = "wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7";
const WORKFLOW_VERSION = "2";

function getApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return apiKey;
}

export async function POST() {
  try {
    const apiKey = getApiKey();

    const response = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "OpenAI-Beta": "chatkit_beta=v1",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        workflow: {
          id: WORKFLOW_ID,
          version: WORKFLOW_VERSION,
        },
        user: "supabase-inspect-dev-user",
      }),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "chatkit_session_error",
          message:
            typeof data?.error?.message === "string"
              ? data.error.message
              : "Failed to create ChatKit session.",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      {
        client_secret: data.client_secret,
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
