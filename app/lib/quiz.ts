import { SYSTEMS, LOCK_SYSTEMS, byId, type SystemId } from "./lc105-data";

/**
 * Client-side quiz built purely from the catalog — no API needed. Questions
 * lean on the things fans should know: the 3-lock, build order, the V8.
 */
export type QuizQ = { q: string; options: string[]; answer: number; why: string };

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeQuiz(seed = 7): QuizQ[] {
  const qs: QuizQ[] = [];
  const names = SYSTEMS.map((s) => s.name);

  // Which lock is which.
  for (const l of LOCK_SYSTEMS) {
    const lock = l.lock ?? 0;
    const wrong = shuffle(names.filter((n) => n !== l.name), seed + lock).slice(0, 3);
    const opts = shuffle([l.name, ...wrong], seed * 3 + lock);
    qs.push({
      q: `Which system carries LOCK ${lock} of the 3-lock?`,
      options: opts,
      answer: opts.indexOf(l.name),
      why: `${l.name}: ${l.blurb}`,
    });
  }
  // Build order.
  const first = SYSTEMS.find((s) => s.order === 1)!;
  const last = [...SYSTEMS].sort((a, b) => b.order - a.order)[0];
  for (const [label, s] of [
    ["first", first],
    ["last", last],
  ] as const) {
    const wrong = shuffle(names.filter((n) => n !== s.name), seed + s.order).slice(0, 3);
    const opts = shuffle([s.name, ...wrong], seed * 5 + s.order);
    qs.push({ q: `What goes on ${label} when you build the LC105?`, options: opts, answer: opts.indexOf(s.name), why: s.blurb });
  }
  // Engine.
  {
    const opts = shuffle(["1UZ-FE 4.0 L V8", "1HZ 4.2 L diesel I6", "2UZ-FE 4.7 L V8", "1FZ-FE 4.5 L I6"], seed);
    qs.push({
      q: "Which engine is the LC105 3-lock built around in this tribute?",
      options: opts,
      answer: opts.indexOf("1UZ-FE 4.0 L V8"),
      why: byId.engine.blurb,
    });
  }
  // What the centre lock does.
  {
    const opts = shuffle(
      ["Welds front and rear axles together", "Locks the steering", "Disables ABS", "Raises the suspension"],
      seed + 11,
    );
    qs.push({
      q: "What does the centre (transfer-case) lock do?",
      options: opts,
      answer: opts.indexOf("Welds front and rear axles together"),
      why: byId.transfer.blurb,
    });
  }
  return qs;
}

export function systemForAnswer(name: string): SystemId | null {
  return SYSTEMS.find((s) => s.name === name)?.id ?? null;
}
