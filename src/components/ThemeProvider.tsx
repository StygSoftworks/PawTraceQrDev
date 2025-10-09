import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { applyTheme, loadThemePreference, saveThemePreference, DEFAULT_THEME } from '@/lib/themes';
import { ThemeContext } from '@/hooks/useTheme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initTheme = async () => {
      const localPrefs = loadThemePreference();
      setThemeId(localPrefs.themeId);
      setDarkMode(localPrefs.darkMode);
      applyTheme(localPrefs.themeId, localPrefs.darkMode);

      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_themes')
            .select('theme_preset, dark_mode_enabled, custom_colors')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) throw error;

          if (data) {
            setThemeId(data.theme_preset);
            setDarkMode(data.dark_mode_enabled);
            applyTheme(data.theme_preset, data.dark_mode_enabled);
            saveThemePreference(data.theme_preset, data.dark_mode_enabled);
          }
        } catch (err) {
          console.error('Failed to load theme from database:', err);
        }
      }

      setIsLoading(false);
    };

    initTheme();
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;

    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const updateTheme = async (newThemeId: string, newDarkMode?: boolean) => {
    const useDarkMode = newDarkMode ?? darkMode;

    setThemeId(newThemeId);
    setDarkMode(useDarkMode);
    applyTheme(newThemeId, useDarkMode);
    saveThemePreference(newThemeId, useDarkMode);

    if (user) {
      try {
        const { error } = await supabase
          .from('user_themes')
          .upsert({
            user_id: user.id,
            theme_preset: newThemeId,
            dark_mode_enabled: useDarkMode,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      } catch (err) {
        console.error('Failed to save theme to database:', err);
      }
    }
  };

  const toggleDarkMode = async () => {
    const newDarkMode = !darkMode;
    await updateTheme(themeId, newDarkMode);
  };

  const value = {
    themeId,
    darkMode,
    isLoading,
    updateTheme,
    toggleDarkMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
