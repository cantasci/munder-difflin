/**
 * Startup-failure detection for floor workers.
 *
 * A Claude worker is spawned idle and only starts when its first inbox message is
 * typed into its terminal. Two things can stop that first turn, and neither used to
 * leave a trace: the CLI refuses the turn (no usage left for the model, an unknown
 * model, not logged in) and sits at its prompt with the error on screen, or nobody
 * types into it at all (the window that wakes agents is closed or the screen is
 * locked). The reaper then killed the worker as "idle" and the orchestrator kept
 * waiting for a worker that never existed. These helpers let the main process name
 * the cause instead. Pure — no Electron, no I/O.
 */

/** Keep this many characters of a PTY's most recent output. */
export const OUTPUT_TAIL_CHARS = 8192;

// CSI / OSC escape sequences and stray control characters a TUI paints with.
// eslint-disable-next-line no-control-regex
const ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[@-Z\\-_]|[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

export function stripAnsi(s: string): string {
  return s.replace(ANSI, '');
}

/** Append a chunk to a bounded tail buffer (raw output; strip when reading). */
export function appendTail(tail: string, chunk: string, max = OUTPUT_TAIL_CHARS): string {
  const next = tail + chunk;
  return next.length > max ? next.slice(next.length - max) : next;
}

/** Fatal first-turn messages the Claude CLI prints, and what they mean for the worker. */
const STARTUP_FAILURES: Array<{ re: RegExp; reason: string }> = [
  { re: /out of usage credits|usage limit reached|credit balance is too low/i, reason: 'no usage left for its model' },
  { re: /issue with the selected model|model .{0,60}(?:not found|does not exist|not available)|invalid model/i, reason: 'its model is not available' },
  { re: /invalid api key|please run \/login|not logged in|oauth token (?:has )?expired|api error: 401/i, reason: 'the CLI is not logged in' }
];

/** "<reason> — <the CLI's own line>" when the output shows a fatal first-turn error, else null. */
export function detectStartupFailure(output: string): string | null {
  const lines = stripAnsi(output).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    for (const f of STARTUP_FAILURES) {
      if (f.re.test(lines[i])) return `${f.reason} — "${lines[i].slice(0, 200)}"`;
    }
  }
  return null;
}

/** Why a worker that never took a turn is being let go (no CLI error on screen). */
export function neverStartedReason(idleMinutes: number, wakerAvailable: boolean): string {
  return wakerAvailable
    ? `never took its first turn in ${idleMinutes} min — its first message was typed but the CLI did not run it`
    : `never took its first turn in ${idleMinutes} min — nothing typed its first message into it (the app window was closed or the screen was locked)`;
}
