import { useCallback, useEffect, useState } from 'react';

export type VitrineTheme = 'dark' | 'light';
const KEY = 'tower_vitrine_theme';

function read(): VitrineTheme {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch { /* stockage indisponible */ }
  return 'dark'; // sombre par défaut
}

/** État du thème de la vitrine (sombre / clair), persisté en localStorage. */
export function useVitrineTheme() {
  const [theme, setTheme] = useState<VitrineTheme>(read);

  useEffect(() => {
    try { localStorage.setItem(KEY, theme); } catch { /* noop */ }
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return { theme, toggle, setTheme };
}
