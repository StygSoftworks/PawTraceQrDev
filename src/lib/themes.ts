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
  category: 'default' | 'nature' | 'playful' | 'elegant' | 'ocean' | 'minimalist' | 'warm' | 'dark' | 'vibrant' | 'soft' | 'professional' | 'seasonal';
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  previewGradient: string;
}

export const THEME_PRESETS: Record<string, Theme> = {
  default: {
    id: 'default',
    name: 'Default',
    description: 'Original PawTraceQR teal and orange theme',
    category: 'default',
    colors: {
      light: {
        primary: '#21C7C5',
        secondary: '#e5e7eb',
        accent: '#FFB84C',
        background: '#FFFDF8',
        text: '#0F172A',
        cardBg: '#FFFFFF',
        cardBorder: '#e5e7eb',
        buttonPrimary: '#21C7C5',
        buttonSecondary: '#FFB84C',
      },
      dark: {
        primary: '#2DD4D2',
        secondary: '#374151',
        accent: '#FFC670',
        background: '#1F2937',
        text: '#FFFDF8',
        cardBg: '#374151',
        cardBorder: '#4B5563',
        buttonPrimary: '#2DD4D2',
        buttonSecondary: '#FFC670',
      },
    },
    previewGradient: 'from-teal-100 via-orange-100 to-amber-100',
  },
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
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm, cozy colors inspired by golden hour',
    category: 'warm',
    colors: {
      light: {
        primary: '#d97706',
        secondary: '#dc2626',
        accent: '#fbbf24',
        background: '#fef3c7',
        text: '#78350f',
        cardBg: '#ffffff',
        cardBorder: '#fde68a',
        buttonPrimary: '#d97706',
        buttonSecondary: '#dc2626',
      },
      dark: {
        primary: '#f59e0b',
        secondary: '#ef4444',
        accent: '#fcd34d',
        background: '#78350f',
        text: '#fef3c7',
        cardBg: '#92400e',
        cardBorder: '#b45309',
        buttonPrimary: '#f59e0b',
        buttonSecondary: '#ef4444',
      },
    },
    previewGradient: 'from-amber-100 via-orange-100 to-red-100',
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    description: 'Deep woodland greens with natural accents',
    category: 'nature',
    colors: {
      light: {
        primary: '#166534',
        secondary: '#14532d',
        accent: '#a16207',
        background: '#f0fdf4',
        text: '#052e16',
        cardBg: '#ffffff',
        cardBorder: '#bbf7d0',
        buttonPrimary: '#166534',
        buttonSecondary: '#14532d',
      },
      dark: {
        primary: '#22c55e',
        secondary: '#16a34a',
        accent: '#fbbf24',
        background: '#052e16',
        text: '#f0fdf4',
        cardBg: '#14532d',
        cardBorder: '#166534',
        buttonPrimary: '#22c55e',
        buttonSecondary: '#16a34a',
      },
    },
    previewGradient: 'from-green-100 via-emerald-100 to-lime-100',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep blues and purples for a nocturnal aesthetic',
    category: 'dark',
    colors: {
      light: {
        primary: '#3730a3',
        secondary: '#4338ca',
        accent: '#a78bfa',
        background: '#f5f3ff',
        text: '#1e1b4b',
        cardBg: '#ffffff',
        cardBorder: '#ddd6fe',
        buttonPrimary: '#3730a3',
        buttonSecondary: '#4338ca',
      },
      dark: {
        primary: '#6366f1',
        secondary: '#818cf8',
        accent: '#c4b5fd',
        background: '#1e1b4b',
        text: '#f5f3ff',
        cardBg: '#312e81',
        cardBorder: '#4c1d95',
        buttonPrimary: '#6366f1',
        buttonSecondary: '#818cf8',
      },
    },
    previewGradient: 'from-indigo-100 via-violet-100 to-purple-100',
  },
  neon: {
    id: 'neon',
    name: 'Neon',
    description: 'Vibrant cyberpunk-inspired electric colors',
    category: 'vibrant',
    colors: {
      light: {
        primary: '#d946ef',
        secondary: '#06b6d4',
        accent: '#84cc16',
        background: '#faf5ff',
        text: '#581c87',
        cardBg: '#ffffff',
        cardBorder: '#f3e8ff',
        buttonPrimary: '#d946ef',
        buttonSecondary: '#06b6d4',
      },
      dark: {
        primary: '#e879f9',
        secondary: '#22d3ee',
        accent: '#a3e635',
        background: '#18181b',
        text: '#faf5ff',
        cardBg: '#27272a',
        cardBorder: '#3f3f46',
        buttonPrimary: '#e879f9',
        buttonSecondary: '#22d3ee',
      },
    },
    previewGradient: 'from-fuchsia-100 via-cyan-100 to-lime-100',
  },
  pastel: {
    id: 'pastel',
    name: 'Pastel',
    description: 'Soft, gentle colors for a delicate touch',
    category: 'soft',
    colors: {
      light: {
        primary: '#9ca3af',
        secondary: '#fbbf24',
        accent: '#f472b6',
        background: '#fef3f9',
        text: '#374151',
        cardBg: '#ffffff',
        cardBorder: '#fce7f3',
        buttonPrimary: '#9ca3af',
        buttonSecondary: '#fbbf24',
      },
      dark: {
        primary: '#d1d5db',
        secondary: '#fcd34d',
        accent: '#f9a8d4',
        background: '#374151',
        text: '#fef3f9',
        cardBg: '#4b5563',
        cardBorder: '#6b7280',
        buttonPrimary: '#d1d5db',
        buttonSecondary: '#fcd34d',
      },
    },
    previewGradient: 'from-pink-50 via-yellow-50 to-purple-50',
  },
  monochrome: {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Timeless black and white with gray accents',
    category: 'minimalist',
    colors: {
      light: {
        primary: '#18181b',
        secondary: '#71717a',
        accent: '#a1a1aa',
        background: '#ffffff',
        text: '#09090b',
        cardBg: '#fafafa',
        cardBorder: '#e4e4e7',
        buttonPrimary: '#18181b',
        buttonSecondary: '#71717a',
      },
      dark: {
        primary: '#fafafa',
        secondary: '#d4d4d8',
        accent: '#a1a1aa',
        background: '#09090b',
        text: '#fafafa',
        cardBg: '#18181b',
        cardBorder: '#27272a',
        buttonPrimary: '#fafafa',
        buttonSecondary: '#d4d4d8',
      },
    },
    previewGradient: 'from-zinc-100 via-gray-100 to-neutral-100',
  },
  vintage: {
    id: 'vintage',
    name: 'Vintage',
    description: 'Retro, nostalgic colors with a classic feel',
    category: 'warm',
    colors: {
      light: {
        primary: '#92400e',
        secondary: '#7c2d12',
        accent: '#ca8a04',
        background: '#fef8e7',
        text: '#451a03',
        cardBg: '#ffffff',
        cardBorder: '#fef3c7',
        buttonPrimary: '#92400e',
        buttonSecondary: '#7c2d12',
      },
      dark: {
        primary: '#d97706',
        secondary: '#c2410c',
        accent: '#eab308',
        background: '#451a03',
        text: '#fef8e7',
        cardBg: '#78350f',
        cardBorder: '#92400e',
        buttonPrimary: '#d97706',
        buttonSecondary: '#c2410c',
      },
    },
    previewGradient: 'from-amber-100 via-orange-50 to-yellow-100',
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional, business-ready color scheme',
    category: 'professional',
    colors: {
      light: {
        primary: '#1e40af',
        secondary: '#334155',
        accent: '#0891b2',
        background: '#f8fafc',
        text: '#0f172a',
        cardBg: '#ffffff',
        cardBorder: '#cbd5e1',
        buttonPrimary: '#1e40af',
        buttonSecondary: '#334155',
      },
      dark: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#06b6d4',
        background: '#0f172a',
        text: '#f8fafc',
        cardBg: '#1e293b',
        cardBorder: '#334155',
        buttonPrimary: '#3b82f6',
        buttonSecondary: '#64748b',
      },
    },
    previewGradient: 'from-blue-100 via-slate-50 to-cyan-100',
  },
  cherry: {
    id: 'cherry',
    name: 'Cherry Blossom',
    description: 'Soft pinks and spring-inspired hues',
    category: 'seasonal',
    colors: {
      light: {
        primary: '#be185d',
        secondary: '#db2777',
        accent: '#fbbf24',
        background: '#fef6f9',
        text: '#500724',
        cardBg: '#ffffff',
        cardBorder: '#fce7f3',
        buttonPrimary: '#be185d',
        buttonSecondary: '#db2777',
      },
      dark: {
        primary: '#ec4899',
        secondary: '#f472b6',
        accent: '#fcd34d',
        background: '#500724',
        text: '#fef6f9',
        cardBg: '#831843',
        cardBorder: '#9f1239',
        buttonPrimary: '#ec4899',
        buttonSecondary: '#f472b6',
      },
    },
    previewGradient: 'from-pink-100 via-rose-100 to-amber-50',
  },
  desert: {
    id: 'desert',
    name: 'Desert',
    description: 'Warm sand and terracotta tones',
    category: 'warm',
    colors: {
      light: {
        primary: '#b45309',
        secondary: '#a16207',
        accent: '#dc2626',
        background: '#fef7ed',
        text: '#431407',
        cardBg: '#ffffff',
        cardBorder: '#fed7aa',
        buttonPrimary: '#b45309',
        buttonSecondary: '#a16207',
      },
      dark: {
        primary: '#f59e0b',
        secondary: '#eab308',
        accent: '#ef4444',
        background: '#431407',
        text: '#fef7ed',
        cardBg: '#78350f',
        cardBorder: '#92400e',
        buttonPrimary: '#f59e0b',
        buttonSecondary: '#eab308',
      },
    },
    previewGradient: 'from-orange-100 via-yellow-100 to-red-50',
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender',
    description: 'Soothing purples with calming undertones',
    category: 'soft',
    colors: {
      light: {
        primary: '#7c3aed',
        secondary: '#a78bfa',
        accent: '#f0abfc',
        background: '#faf5ff',
        text: '#4c1d95',
        cardBg: '#ffffff',
        cardBorder: '#ede9fe',
        buttonPrimary: '#7c3aed',
        buttonSecondary: '#a78bfa',
      },
      dark: {
        primary: '#a78bfa',
        secondary: '#c4b5fd',
        accent: '#f5d0fe',
        background: '#4c1d95',
        text: '#faf5ff',
        cardBg: '#5b21b6',
        cardBorder: '#6d28d9',
        buttonPrimary: '#a78bfa',
        buttonSecondary: '#c4b5fd',
      },
    },
    previewGradient: 'from-violet-100 via-purple-50 to-fuchsia-100',
  },
  ruby: {
    id: 'ruby',
    name: 'Ruby',
    description: 'Bold reds with luxurious jewel tones',
    category: 'vibrant',
    colors: {
      light: {
        primary: '#991b1b',
        secondary: '#b91c1c',
        accent: '#fbbf24',
        background: '#fef2f2',
        text: '#450a0a',
        cardBg: '#ffffff',
        cardBorder: '#fecaca',
        buttonPrimary: '#991b1b',
        buttonSecondary: '#b91c1c',
      },
      dark: {
        primary: '#ef4444',
        secondary: '#f87171',
        accent: '#fcd34d',
        background: '#450a0a',
        text: '#fef2f2',
        cardBg: '#7f1d1d',
        cardBorder: '#991b1b',
        buttonPrimary: '#ef4444',
        buttonSecondary: '#f87171',
      },
    },
    previewGradient: 'from-red-100 via-rose-100 to-amber-100',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald',
    description: 'Rich greens with gem-like brilliance',
    category: 'vibrant',
    colors: {
      light: {
        primary: '#047857',
        secondary: '#059669',
        accent: '#06b6d4',
        background: '#ecfdf5',
        text: '#064e3b',
        cardBg: '#ffffff',
        cardBorder: '#a7f3d0',
        buttonPrimary: '#047857',
        buttonSecondary: '#059669',
      },
      dark: {
        primary: '#10b981',
        secondary: '#34d399',
        accent: '#22d3ee',
        background: '#064e3b',
        text: '#ecfdf5',
        cardBg: '#065f46',
        cardBorder: '#047857',
        buttonPrimary: '#10b981',
        buttonSecondary: '#34d399',
      },
    },
    previewGradient: 'from-emerald-100 via-green-100 to-cyan-100',
  },
  arctic: {
    id: 'arctic',
    name: 'Arctic',
    description: 'Cool icy blues and frosty whites',
    category: 'ocean',
    colors: {
      light: {
        primary: '#0c4a6e',
        secondary: '#0e7490',
        accent: '#7dd3fc',
        background: '#f0f9ff',
        text: '#082f49',
        cardBg: '#ffffff',
        cardBorder: '#bae6fd',
        buttonPrimary: '#0c4a6e',
        buttonSecondary: '#0e7490',
      },
      dark: {
        primary: '#38bdf8',
        secondary: '#7dd3fc',
        accent: '#bae6fd',
        background: '#082f49',
        text: '#f0f9ff',
        cardBg: '#0c4a6e',
        cardBorder: '#075985',
        buttonPrimary: '#38bdf8',
        buttonSecondary: '#7dd3fc',
      },
    },
    previewGradient: 'from-sky-100 via-blue-50 to-cyan-100',
  },
};

export const DEFAULT_THEME = 'default';

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

function darkenColor(hex: string, percent: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;

  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);

  r = Math.max(0, Math.floor(r * (1 - percent / 100)));
  g = Math.max(0, Math.floor(g * (1 - percent / 100)));
  b = Math.max(0, Math.floor(b * (1 - percent / 100)));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function lightenColor(hex: string, percent: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;

  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);

  r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
  g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
  b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function applyTheme(themeId: string, darkMode: boolean = false) {
  const theme = THEME_PRESETS[themeId] || THEME_PRESETS[DEFAULT_THEME];
  const colors = darkMode ? theme.colors.dark : theme.colors.light;

  const root = document.documentElement;

  root.style.setProperty('--primary', hexToHSL(colors.primary));
  root.style.setProperty('--primary-light', hexToHSL(lightenColor(colors.primary, 20)));
  root.style.setProperty('--primary-dark', hexToHSL(darkenColor(colors.primary, 15)));
  root.style.setProperty('--primary-header', hexToHSL(darkenColor(colors.primary, 25)));
  root.style.setProperty('--primary-foreground', hexToHSL(colors.background));

  root.style.setProperty('--secondary', hexToHSL(colors.secondary));
  root.style.setProperty('--secondary-foreground', hexToHSL(colors.text));

  root.style.setProperty('--accent', hexToHSL(colors.accent));
  root.style.setProperty('--accent-light', hexToHSL(lightenColor(colors.accent, 20)));
  root.style.setProperty('--accent-header', hexToHSL(darkenColor(colors.accent, 25)));
  root.style.setProperty('--accent-foreground', hexToHSL(colors.text));

  root.style.setProperty('--background', hexToHSL(colors.background));
  root.style.setProperty('--foreground', hexToHSL(colors.text));

  root.style.setProperty('--card', hexToHSL(colors.cardBg));
  root.style.setProperty('--card-foreground', hexToHSL(colors.text));

  root.style.setProperty('--border', hexToHSL(colors.cardBorder));
  root.style.setProperty('--input', hexToHSL(colors.cardBorder));
  root.style.setProperty('--ring', hexToHSL(colors.primary));

  root.style.setProperty('--muted', hexToHSL(colors.secondary));
  root.style.setProperty('--muted-foreground', hexToHSL(darkenColor(colors.text, 30)));
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
