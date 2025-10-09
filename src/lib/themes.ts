export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  cardBg: string;
  cardBorder: string;
  buttonPrimary: string;
  buttonSecondary: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  category: 'nature' | 'playful' | 'elegant' | 'ocean' | 'minimalist';
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  previewGradient: string;
}

export const THEME_PRESETS: Record<string, Theme> = {
  nature: {
    id: 'nature',
    name: 'Nature',
    description: 'Earthy, organic colors inspired by the outdoors',
    category: 'nature',
    colors: {
      light: {
        primary: '#2d5016',
        secondary: '#4a90a4',
        accent: '#f4c430',
        background: '#faf8f3',
        text: '#1a2f0f',
        cardBg: '#ffffff',
        cardBorder: '#d4d8d0',
        buttonPrimary: '#2d5016',
        buttonSecondary: '#4a90a4',
      },
      dark: {
        primary: '#4a7c2e',
        secondary: '#6bb5cc',
        accent: '#f9d877',
        background: '#1a2f0f',
        text: '#faf8f3',
        cardBg: '#243316',
        cardBorder: '#3a5020',
        buttonPrimary: '#4a7c2e',
        buttonSecondary: '#6bb5cc',
      },
    },
    previewGradient: 'from-green-100 via-blue-50 to-yellow-100',
  },
  playful: {
    id: 'playful',
    name: 'Playful',
    description: 'Bright, energetic colors that evoke fun and joy',
    category: 'playful',
    colors: {
      light: {
        primary: '#ff6b35',
        secondary: '#00b4d8',
        accent: '#ff006e',
        background: '#fff3e6',
        text: '#1b263b',
        cardBg: '#ffffff',
        cardBorder: '#ffd6ba',
        buttonPrimary: '#ff6b35',
        buttonSecondary: '#00b4d8',
      },
      dark: {
        primary: '#ff8c5e',
        secondary: '#48cae4',
        accent: '#ff3399',
        background: '#1b263b',
        text: '#fff3e6',
        cardBg: '#2a3551',
        cardBorder: '#3d4a6b',
        buttonPrimary: '#ff8c5e',
        buttonSecondary: '#48cae4',
      },
    },
    previewGradient: 'from-orange-100 via-cyan-100 to-pink-100',
  },
  elegant: {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated, refined colors for a premium feel',
    category: 'elegant',
    colors: {
      light: {
        primary: '#5a189a',
        secondary: '#b76e79',
        accent: '#d4af37',
        background: '#f8f5f2',
        text: '#2b2d42',
        cardBg: '#ffffff',
        cardBorder: '#e5d9d1',
        buttonPrimary: '#5a189a',
        buttonSecondary: '#b76e79',
      },
      dark: {
        primary: '#7b2cbf',
        secondary: '#c98a97',
        accent: '#e6c55a',
        background: '#2b2d42',
        text: '#f8f5f2',
        cardBg: '#3d3f5c',
        cardBorder: '#50527a',
        buttonPrimary: '#7b2cbf',
        buttonSecondary: '#c98a97',
      },
    },
    previewGradient: 'from-purple-100 via-pink-100 to-amber-100',
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    description: 'Calming blues and aquatic colors',
    category: 'ocean',
    colors: {
      light: {
        primary: '#023e8a',
        secondary: '#06aed5',
        accent: '#ff6b9d',
        background: '#caf0f8',
        text: '#03045e',
        cardBg: '#ffffff',
        cardBorder: '#90e0ef',
        buttonPrimary: '#023e8a',
        buttonSecondary: '#06aed5',
      },
      dark: {
        primary: '#0077b6',
        secondary: '#48cae4',
        accent: '#ff8cb4',
        background: '#03045e',
        text: '#caf0f8',
        cardBg: '#0a1e3e',
        cardBorder: '#1a3a5e',
        buttonPrimary: '#0077b6',
        buttonSecondary: '#48cae4',
      },
    },
    previewGradient: 'from-blue-100 via-cyan-100 to-pink-100',
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean, simple design with subtle accents',
    category: 'minimalist',
    colors: {
      light: {
        primary: '#475569',
        secondary: '#94a3b8',
        accent: '#10b981',
        background: '#ffffff',
        text: '#0f172a',
        cardBg: '#f8fafc',
        cardBorder: '#e2e8f0',
        buttonPrimary: '#475569',
        buttonSecondary: '#94a3b8',
      },
      dark: {
        primary: '#64748b',
        secondary: '#cbd5e1',
        accent: '#34d399',
        background: '#0f172a',
        text: '#f8fafc',
        cardBg: '#1e293b',
        cardBorder: '#334155',
        buttonPrimary: '#64748b',
        buttonSecondary: '#cbd5e1',
      },
    },
    previewGradient: 'from-slate-100 via-gray-50 to-emerald-100',
  },
};

export const DEFAULT_THEME = 'minimalist';

function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${h} ${s}% ${lPercent}%`;
}

export function applyTheme(themeId: string, darkMode: boolean = false) {
  const theme = THEME_PRESETS[themeId] || THEME_PRESETS[DEFAULT_THEME];
  const colors = darkMode ? theme.colors.dark : theme.colors.light;

  const root = document.documentElement;

  root.style.setProperty('--primary', hexToHSL(colors.primary));
  root.style.setProperty('--secondary', hexToHSL(colors.secondary));
  root.style.setProperty('--accent', hexToHSL(colors.accent));
  root.style.setProperty('--background', hexToHSL(colors.background));
  root.style.setProperty('--foreground', hexToHSL(colors.text));
  root.style.setProperty('--card', hexToHSL(colors.cardBg));
  root.style.setProperty('--card-foreground', hexToHSL(colors.text));
  root.style.setProperty('--border', hexToHSL(colors.cardBorder));
  root.style.setProperty('--input', hexToHSL(colors.cardBorder));
  root.style.setProperty('--primary-foreground', hexToHSL(colors.background));
  root.style.setProperty('--accent-foreground', hexToHSL(colors.text));
}

export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const [rs, gs, bs] = [r, g, b].map(c => {
      const val = c / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function isAccessible(foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean {
  const ratio = getContrastRatio(foreground, background);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
}

export function saveThemePreference(themeId: string, darkMode: boolean) {
  localStorage.setItem('theme_preset', themeId);
  localStorage.setItem('dark_mode', String(darkMode));
}

export function loadThemePreference(): { themeId: string; darkMode: boolean } {
  const themeId = localStorage.getItem('theme_preset') || DEFAULT_THEME;
  const darkMode = localStorage.getItem('dark_mode') === 'true';
  return { themeId, darkMode };
}
