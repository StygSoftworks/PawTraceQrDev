import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Palette, Moon, Sun, Sparkles } from 'lucide-react';
import { ThemePreviewCard } from './ThemePreviewCard';
import { THEME_PRESETS } from '@/lib/themes';
import { useTheme } from '@/hooks/useTheme';

export function ThemeSelector() {
  const { themeId, darkMode, updateTheme, isLoading } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(themeId);
  const [previewDarkMode, setPreviewDarkMode] = useState(darkMode);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSelectedTheme(themeId);
    setPreviewDarkMode(darkMode);
  }, [themeId, darkMode]);

  const handleThemeSelect = (newThemeId: string) => {
    setSelectedTheme(newThemeId);
    setHasChanges(newThemeId !== themeId || previewDarkMode !== darkMode);
  };

  const handleDarkModeToggle = () => {
    setPreviewDarkMode(!previewDarkMode);
    setHasChanges(selectedTheme !== themeId || !previewDarkMode !== darkMode);
  };

  const handleApply = async () => {
    await updateTheme(selectedTheme, previewDarkMode);
    setHasChanges(false);
  };

  const handleReset = () => {
    setSelectedTheme(themeId);
    setPreviewDarkMode(darkMode);
    setHasChanges(false);
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

          {hasChanges && (
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
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Per-Pet Themes Coming Soon!</h4>
              <p className="text-sm text-muted-foreground">
                Future updates will allow you to customize themes for individual pet pages,
                including custom background images and unique color schemes for each of your pets.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
