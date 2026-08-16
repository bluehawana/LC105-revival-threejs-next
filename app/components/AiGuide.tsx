"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X, HelpCircle, Check, CircleX, WifiOff, Wifi } from "lucide-react";
import { byId, type SystemId } from "../lib/lc105-data";
import { makeQuiz, type QuizQ } from "../lib/quiz";

type Msg = { role: "user" | "assistant"; content: string; mode?: "live" | "offline" };

type Props = {
  open: boolean;
  onClose: () => void;
  focus: SystemId | null;
};

const SUGGESTIONS = ["What is the 3-lock?", "What should I fit next?", "Tell me about the V8", "Why solid axles?"];

/** Qwen chat + quiz drawer. Works with no key (offline catalog answers). */
export default function AiGuide({ open, onClose, focus }: Props) {
  const [tab, setTab] = useState<"chat" | "quiz">("chat");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi — I'm your LC105 assembly guide. Ask about any system, the build order, or the famous 3-lock. Select a part in the 3D view and ask “what is this?”.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"live" | "offline" | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, tab, open]);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setInput("");
    setBusy(true);
    const next: Msg[] = [...msgs, { role: "user", content: question }];
    setMsgs(next);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          focus,
          history: next.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = (await res.json()) as { answer?: string; mode?: "live" | "offline"; error?: string };
      setMode(data.mode ?? "offline");
      setMsgs((m) => [...m, { role: "assistant", content: data.answer ?? data.error ?? "…", mode: data.mode }]);
    } catch {
      setMode("offline");
      setMsgs((m) => [...m, { role: "assistant", content: "I couldn't reach the guide. Try again in a moment.", mode: "offline" }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside
      className={[
        "fixed inset-y-0 right-0 z-30 flex w-full max-w-[420px] flex-col border-l border-[var(--line)] bg-[var(--panel)] shadow-2xl transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full",
      ].join(" ")}
      aria-hidden={!open}
    >
      <header className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
        <Bot size={18} className="text-[var(--sand)]" />
        <div className="flex-1">
          <div className="text-[13px] font-semibold">Ask Qwen</div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--fg-3)]">
            {mode === "live" ? (
              <>
                <Wifi size={10} className="text-[var(--green)]" /> live · qwen 3.8
              </>
            ) : mode === "offline" ? (
              <>
                <WifiOff size={10} /> offline · catalog mode
              </>
            ) : (
              <>assembly guide</>
            )}
          </div>
        </div>
        <div className="flex rounded-md border border-[var(--line)] p-0.5 text-[11px]">
          <TabBtn active={tab === "chat"} onClick={() => setTab("chat")}>
            <Sparkles size={12} /> Chat
          </TabBtn>
          <TabBtn active={tab === "quiz"} onClick={() => setTab("quiz")}>
            <HelpCircle size={12} /> Quiz
          </TabBtn>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1 text-[var(--fg-3)] hover:bg-[var(--panel-2)] hover:text-[var(--fg)]" aria-label="Close guide">
          <X size={16} />
        </button>
      </header>

      {tab === "chat" ? (
        <>
          <div className="scroll-thin flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {focus && (
              <div className="rounded-md border border-[var(--line)] bg-[var(--bg-2)] px-2.5 py-1.5 text-[11px] text-[var(--fg-2)]">
                Talking about: <b className="text-[var(--fg)]">{byId[focus].name}</b>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={["flex", m.role === "user" ? "justify-end" : "justify-start"].join(" ")}>
                <div
                  className={[
                    "max-w-[88%] whitespace-pre-wrap rounded-xl px-3 py-2 text-[13px] leading-relaxed",
                    m.role === "user" ? "bg-[var(--sand)] text-black" : "bg-[var(--panel-2)] text-[var(--fg)]",
                  ].join(" ")}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy && <div className="text-[12px] text-[var(--fg-3)]">Thinking…</div>}
            <div ref={endRef} />
          </div>
          <div className="border-t border-[var(--line)] px-4 py-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[11px] text-[var(--fg-2)] hover:border-[var(--sand)] hover:text-[var(--fg)]"
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={focus ? `Ask about the ${byId[focus].name}…` : "Ask the guide…"}
                className="flex-1 rounded-md border border-[var(--line)] bg-[var(--bg-2)] px-3 py-2 text-[13px] outline-none placeholder:text-[var(--fg-3)] focus:border-[var(--sand)]"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="grid h-9 w-9 place-items-center rounded-md bg-[var(--sand)] text-black disabled:opacity-40"
                aria-label="Send"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </>
      ) : (
        <Quiz />
      )}
    </aside>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1 rounded px-2 py-1",
        active ? "bg-[var(--panel-2)] text-[var(--fg)]" : "text-[var(--fg-3)] hover:text-[var(--fg)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Quiz() {
  const [seed, setSeed] = useState(7);
  const [qs, setQs] = useState<QuizQ[]>(() => makeQuiz(7));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = i >= qs.length;

  function restart() {
    const s = seed + 13;
    setSeed(s);
    setQs(makeQuiz(s));
    setI(0);
    setPicked(null);
    setScore(0);
  }

  if (done) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="text-[28px] font-semibold">
          {score} / {qs.length}
        </div>
        <p className="text-[13px] text-[var(--fg-2)]">
          {score === qs.length ? "Perfect — you know your 3-lock." : score >= qs.length - 2 ? "Solid. Almost a Cruiser mechanic." : "Not bad — go poke the parts and try again."}
        </p>
        <button type="button" onClick={restart} className="rounded-md bg-[var(--sand)] px-3 py-1.5 text-[12px] font-medium text-black">
          Try again
        </button>
      </div>
    );
  }
  const q = qs[i];
  return (
    <div className="scroll-thin flex-1 overflow-y-auto px-4 py-4">
      <div className="mono mb-2 text-[10px] uppercase tracking-wider text-[var(--fg-3)]">
        Question {i + 1} / {qs.length} · score {score}
      </div>
      <h3 className="mb-3 text-[15px] font-semibold leading-snug">{q.q}</h3>
      <div className="flex flex-col gap-1.5">
        {q.options.map((o, k) => {
          const isRight = k === q.answer;
          const isPicked = picked === k;
          const state = picked === null ? "idle" : isRight ? "right" : isPicked ? "wrong" : "muted";
          return (
            <button
              key={o}
              type="button"
              disabled={picked !== null}
              onClick={() => {
                setPicked(k);
                if (isRight) setScore((s) => s + 1);
              }}
              className={[
                "flex items-center justify-between rounded-md border px-3 py-2 text-left text-[13px] transition-colors",
                state === "idle" && "border-[var(--line)] hover:border-[var(--sand)]",
                state === "right" && "border-[var(--green)] bg-[var(--green)]/15",
                state === "wrong" && "border-[var(--lock)] bg-[var(--lock)]/15",
                state === "muted" && "border-[var(--line)] opacity-50",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {o}
              {state === "right" && <Check size={14} className="text-[var(--green)]" />}
              {state === "wrong" && <CircleX size={14} className="text-[var(--lock)]" />}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-3 rounded-md bg-[var(--bg-2)] p-3 text-[12px] leading-relaxed text-[var(--fg-2)]">
          {q.why}
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={() => {
                setPicked(null);
                setI((x) => x + 1);
              }}
              className="rounded-md bg-[var(--sand)] px-3 py-1 text-[12px] font-medium text-black"
            >
              {i + 1 < qs.length ? "Next" : "See score"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
