import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { applyTheme, DEFAULT_THEME } from '@/lib/themes';

export function usePetTheme(petId: string | undefined) {
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!petId) {
      setIsLoading(false);
      return;
    }

    const loadPetTheme = async () => {
      try {
        const { data, error } = await supabase
          .from('pet_themes')
          .select('theme_preset, custom_colors, background_image_url')
          .eq('pet_id', petId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setThemeId(data.theme_preset);
        } else {
          setThemeId(DEFAULT_THEME);
        }
      } catch (err) {
        console.error('Failed to load pet theme:', err);
        setThemeId(DEFAULT_THEME);
      } finally {
        setIsLoading(false);
      }
    };

    loadPetTheme();
  }, [petId]);

  const updatePetTheme = async (newThemeId: string) => {
    if (!petId) return;

    setThemeId(newThemeId);

    try {
      const { error } = await supabase
        .from('pet_themes')
        .upsert({
          pet_id: petId,
          theme_preset: newThemeId,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (err) {
      console.error('Failed to save pet theme:', err);
    }
  };

  const applyPetTheme = (darkMode: boolean = false) => {
    applyTheme(themeId, darkMode);
  };

  return {
    themeId,
    isLoading,
    updatePetTheme,
    applyPetTheme,
  };
}
