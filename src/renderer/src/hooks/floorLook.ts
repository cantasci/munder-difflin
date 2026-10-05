/**
 * How a MAIN-spawned agent looks on the floor. A spawn request may name its own
 * character and accent (e.g. /deliver seats: Pam the BA in mint); otherwise the
 * character comes from the agent's name and the accent from its id, as before.
 * Pure — the cast is passed in so this stays free of the pixi scene.
 */

export const SPAWN_ACCENTS = ['coral', 'mint', 'sky', 'lemon', 'lilac', 'peach'] as const;
export type SpawnAccent = (typeof SPAWN_ACCENTS)[number];

// Accent names other tools use for the same look, mapped onto the floor's palette.
const ACCENT_ALIASES: Record<string, SpawnAccent> = { amber: 'lemon', rose: 'coral', violet: 'lilac', slate: 'peach' };

export interface CastEntry { name: string; displayName: string }

export function floorLookFor(
  rec: { id: string; name?: string; character?: unknown; accent?: unknown },
  cast: readonly CastEntry[],
  defaultCharacter: string
): { character: string; accent: SpawnAccent } {
  const wanted = typeof rec.character === 'string' ? rec.character.toLowerCase() : '';
  const key = (rec.name || rec.id).toLowerCase();
  const character =
    cast.find((m) => m.name === wanted)?.name ??
    cast.find((m) => m.name === key || m.displayName.toLowerCase() === key)?.name ??
    defaultCharacter;
  const a = typeof rec.accent === 'string' ? rec.accent.toLowerCase() : '';
  let accent: SpawnAccent | undefined = (SPAWN_ACCENTS as readonly string[]).includes(a) ? (a as SpawnAccent) : ACCENT_ALIASES[a];
  if (!accent) {
    let h = 0;
    for (const ch of rec.id) h = (h + ch.charCodeAt(0)) % SPAWN_ACCENTS.length;
    accent = SPAWN_ACCENTS[h];
  }
  return { character, accent };
}
