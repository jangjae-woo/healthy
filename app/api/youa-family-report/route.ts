import { NextRequest, NextResponse } from "next/server";
import { assembleYouaFamilyReport, type YouaFamilyReportInput } from "@/lib/youa-cache/family-report";

export const runtime = "nodejs";
export const maxDuration = 60;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required`);
  }
  return value.trim();
}

function parseInput(body: unknown): YouaFamilyReportInput {
  if (!isRecord(body)) throw new Error("request body must be an object");
  if (!isRecord(body.child)) throw new Error("child is required");
  if (!isRecord(body.mother)) throw new Error("mother is required");
  if (!isRecord(body.father)) throw new Error("father is required");

  const gender = requireString(body.child, "gender");
  if (gender !== "female" && gender !== "male") {
    throw new Error("child.gender must be female or male");
  }

  return {
    child: {
      name: typeof body.child.name === "string" ? body.child.name.trim() : "child",
      birthDate: requireString(body.child, "birthDate"),
      gender,
      hour: requireString(body.child, "hour"),
    },
    mother: {
      name: typeof body.mother.name === "string" ? body.mother.name.trim() : "mother",
      birthDate: requireString(body.mother, "birthDate"),
      hour: requireString(body.mother, "hour"),
    },
    father: {
      name: typeof body.father.name === "string" ? body.father.name.trim() : "father",
      birthDate: requireString(body.father, "birthDate"),
      hour: requireString(body.father, "hour"),
    },
  };
}

function sanitizeReportText(text: string) {
  return text.replace(/\bundefined\b/g, "모름");
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.YOUA_CACHE_SOURCE && request.nextUrl.hostname === "localhost") {
      const bodyText = await request.text();
      const upstream = await fetch("https://www.paljawon.com/api/youa-family-report", {
        method: "POST",
        headers: { "content-type": request.headers.get("content-type") || "application/json; charset=utf-8" },
        body: bodyText,
      });
      return new NextResponse(sanitizeReportText(await upstream.text()), {
        status: upstream.status,
        headers: { "content-type": upstream.headers.get("content-type") || "application/json; charset=utf-8" },
      });
    }

    const body = await request.json();
    const includeFacts = isRecord(body) && body.includeFacts === true;
    const input = parseInput(body);
    const result = await assembleYouaFamilyReport(input);
    if (typeof result.html === "string") {
      result.html = sanitizeReportText(result.html);
    }
    const { facts: _facts, ...publicResult } = result;
    return NextResponse.json(includeFacts ? result : publicResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes("cache miss") || message.includes("not found") ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
