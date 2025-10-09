import { createContext, useContext } from 'react';

interface ThemeContextValue {
  themeId: string;
  darkMode: boolean;
  isLoading: boolean;
  updateTheme: (newThemeId: string, newDarkMode?: boolean) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { ThemeContext };
