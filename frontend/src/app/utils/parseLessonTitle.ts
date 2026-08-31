/**
 * Décompose un titre de chapitre du type « Chapitre 2 — Les LOD » en { number, title }.
 * Retourne { number: null } si aucun préfixe numéroté n'est détecté.
 */
export interface ParsedLessonTitle {
  number: number | null;
  title: string;
  raw: string;
}

export function parseLessonTitle(raw: string): ParsedLessonTitle {
  const value = (raw ?? '').trim();
  const match = value.match(
    /^(?:chapitre|module|le[cç]on|partie|s[ée]ance)?\s*(\d+)\s*(?:[-–—:.)]|\bsur\b)?\s*(.*)$/i
  );
  if (match && match[1]) {
    const title = match[2]?.trim();
    return { number: Number(match[1]), title: title || value, raw: value };
  }
  return { number: null, title: value, raw: value };
}
