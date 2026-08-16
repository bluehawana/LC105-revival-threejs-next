import { NextResponse } from "next/server";
import { SYSTEMS, LOCK_SYSTEMS, byId, type SystemId } from "../../lib/lc105-data";

export const runtime = "nodejs";

/**
 * POST /api/ask — the "Ask Qwen" assembly guide.
 *
 * Talks to any OpenAI-compatible chat endpoint. Two ready-made targets:
 *   • Alibaba DashScope cloud   QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
 *                               QWEN_MODEL=qwen3.8-max   DASHSCOPE_API_KEY=sk-...
 *   • Local oMLX / Ollama etc.  QWEN_BASE_URL=http://127.0.0.1:8000/v1
 *                               QWEN_MODEL=mlx-community--Qwen3.8-27B-4bit
 *                               DASHSCOPE_API_KEY=<omlx api key or "ollama">
 *
 * With no key at all, we still answer — from the parts catalog — so the guide
 * never breaks ("offline" mode).
 */

const BASE_URL = (process.env.QWEN_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "");
const MODEL = process.env.QWEN_MODEL || "qwen3.8-max";
const KEY = process.env.DASHSCOPE_API_KEY || "";

type Msg = { role: "system" | "user" | "assistant"; content: string };

function catalogText() {
  return SYSTEMS.map(
    (s) =>
      `#${s.order} ${s.name} [${s.id}] (${s.category})${s.lock ? ` — LOCK ${s.lock} of 3` : ""}\n  ${s.blurb}\n  Spec: ${s.spec}`,
  ).join("\n");
}

function systemPrompt(focus: SystemId | null) {
  return [
    "You are the LC105 Revival assembly guide: a friendly, precise expert on the Toyota Land Cruiser 100 series (LC105, ~1998–2007), speaking to fans who are rebuilding a stylized 3D model of it in the browser.",
    "Answer from the parts catalog below first. Keep answers short (2–5 sentences), concrete, and warm. Use the build order when asked 'what next'. Mention the 3-lock (front / centre / rear differential locks) whenever it is relevant — it is the soul of this truck.",
    "If asked something outside the catalog, answer from general Land Cruiser knowledge but say so briefly. Never invent part numbers or prices.",
    focus ? `The user currently has this system selected: ${byId[focus].name} [${focus}].` : "",
    "",
    "PARTS CATALOG (build order):",
    catalogText(),
  ]
    .filter(Boolean)
    .join("\n");
}

/** Deterministic, catalog-based answer used when no key is configured or the call fails. */
function offlineAnswer(q: string, focus: SystemId | null): string {
  const t = q.toLowerCase();
  const found = SYSTEMS.find((s) => t.includes(s.name.toLowerCase()) || t.includes(s.id)) ?? (focus ? byId[focus] : null);
  if (/lock|3-lock|three lock|diff/.test(t)) {
    return `The 3-lock is the heart of the LC105: ${LOCK_SYSTEMS.map((l) => `lock ${l.lock} = ${l.name}`).join(", ")}. Front and rear are differential locks; the centre lock lives in the transfer case and welds front and rear axles together, and with low range that is what gets it out of anything.`;
  }
  if (/next|order|first|start|step/.test(t)) {
    const seq = [...SYSTEMS].sort((a, b) => a.order - b.order);
    return `Build order: ${seq.map((s) => `${s.order}. ${s.name}`).join(" → ")}. Chassis first — everything hangs off the ladder frame — and wheels last, to stand it up.`;
  }
  if (/engine|v8|1uz/.test(t)) {
    const e = byId.engine;
    return `${e.name}: ${e.blurb} ${e.spec}.`;
  }
  if (found) return `${found.name} (step ${found.order}${found.lock ? `, lock ${found.lock} of 3` : ""}): ${found.blurb} ${found.spec}.`;
  return `I'm in offline mode (no Qwen key set), so I answer from the parts catalog. Ask me about any of the ${SYSTEMS.length} systems, the build order, or the 3-lock — or select a part in the 3D view and ask "what is this?".`;
}

export async function POST(req: Request) {
  let body: { question?: string; focus?: SystemId | null; history?: Msg[] } = {};
  try {
    body = await req.json();
  } catch {
    /* fallthrough */
  }
  const question = (body.question ?? "").toString().slice(0, 2000).trim();
  const focus = body.focus && byId[body.focus] ? body.focus : null;
  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
  if (!question) return NextResponse.json({ error: "Empty question" }, { status: 400 });

  if (!KEY) {
    return NextResponse.json({ mode: "offline", model: null, answer: offlineAnswer(question, focus) });
  }

  const messages: Msg[] = [
    { role: "system", content: systemPrompt(focus) },
    ...history.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"),
    { role: "user", content: question },
  ];

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60_000);
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.6, max_tokens: 600, stream: false }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("[ask] upstream", res.status, txt.slice(0, 300));
      return NextResponse.json({ mode: "offline", model: MODEL, answer: offlineAnswer(question, focus), warning: `Qwen returned ${res.status}` });
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string; reasoning_content?: string } }[] };
    let answer = data.choices?.[0]?.message?.content?.trim() ?? "";
    // Strip any leaked <think> blocks from thinking models.
    answer = answer.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    if (!answer) answer = offlineAnswer(question, focus);
    return NextResponse.json({ mode: "live", model: MODEL, answer });
  } catch (e) {
    console.error("[ask] error", e);
    return NextResponse.json({ mode: "offline", model: MODEL, answer: offlineAnswer(question, focus), warning: "Qwen unreachable" });
  }
}
