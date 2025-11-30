import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Palette, Moon, Sun, Sparkles, Info } from 'lucide-react';
import { ThemePreviewCard } from './ThemePreviewCard';
import { THEME_PRESETS } from '@/lib/themes';
import { useTheme } from '@/hooks/useTheme';

const FIRST_TIME_KEY = 'pawtrace_theme_first_time_seen';

export function ThemeSelector() {
  const { themeId, darkMode, updateTheme, isLoading, previewTheme, clearPreview } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(themeId);
  const [previewDarkMode, setPreviewDarkMode] = useState(darkMode);
  const [hasChanges, setHasChanges] = useState(false);
  const [showFirstTimeMessage, setShowFirstTimeMessage] = useState(false);

  useEffect(() => {
    setSelectedTheme(themeId);
    setPreviewDarkMode(darkMode);
  }, [themeId, darkMode]);

  const handleThemeSelect = (newThemeId: string) => {
    setSelectedTheme(newThemeId);
    setHasChanges(newThemeId !== themeId || previewDarkMode !== darkMode);
    previewTheme(newThemeId, previewDarkMode);

    const hasSeenMessage = localStorage.getItem(FIRST_TIME_KEY);
    if (!hasSeenMessage && (newThemeId !== themeId || previewDarkMode !== darkMode)) {
      setShowFirstTimeMessage(true);
      localStorage.setItem(FIRST_TIME_KEY, 'true');
    }
  };

  const handleDarkModeToggle = () => {
    const newDarkMode = !previewDarkMode;
    setPreviewDarkMode(newDarkMode);
    setHasChanges(selectedTheme !== themeId || newDarkMode !== darkMode);
    previewTheme(selectedTheme, newDarkMode);

    const hasSeenMessage = localStorage.getItem(FIRST_TIME_KEY);
    if (!hasSeenMessage && (selectedTheme !== themeId || newDarkMode !== darkMode)) {
      setShowFirstTimeMessage(true);
      localStorage.setItem(FIRST_TIME_KEY, 'true');
    }
  };

  const handleApply = async () => {
    await updateTheme(selectedTheme, previewDarkMode);
    setHasChanges(false);
    setShowFirstTimeMessage(false);
  };

  const handleReset = () => {
    setSelectedTheme(themeId);
    setPreviewDarkMode(darkMode);
    setHasChanges(false);
    setShowFirstTimeMessage(false);
    clearPreview();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize your application theme and color preferences
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              {previewDarkMode ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
              <div>
                <Label htmlFor="dark-mode" className="text-base font-medium cursor-pointer">
                  Dark Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  {previewDarkMode ? 'Using dark theme' : 'Using light theme'}
                </p>
              </div>
            </div>
            <Switch
              id="dark-mode"
              checked={previewDarkMode}
              onCheckedChange={handleDarkModeToggle}
            />
          </div>

          {showFirstTimeMessage && hasChanges && (
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                You're previewing this theme. Scroll down and click "Apply Theme" to save your changes.
              </AlertDescription>
            </Alert>
          )}

          {hasChanges && !showFirstTimeMessage && (
            <Alert className="border-primary/50 bg-primary/5">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertDescription>
                You have unsaved changes. Click "Apply Theme" to save your preferences.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-4">Choose Your Theme</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(THEME_PRESETS).map((theme) => (
                <ThemePreviewCard
                  key={theme.id}
                  theme={theme}
                  isSelected={selectedTheme === theme.id}
                  darkMode={previewDarkMode}
                  onClick={() => handleThemeSelect(theme.id)}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              onClick={handleApply}
              disabled={!hasChanges}
              className="flex-1"
            >
              Apply Theme
            </Button>
            <Button
              onClick={handleReset}
              disabled={!hasChanges}
              variant="outline"
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Customize Individual Pet Pages</h4>
              <p className="text-sm text-muted-foreground">
                You can customize the theme for each pet's page from your Dashboard.
                When editing a pet profile, select a unique theme that best represents your pet's personality.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
