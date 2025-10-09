import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import type { Theme } from "@/lib/themes";

interface ThemePreviewCardProps {
  theme: Theme;
  isSelected: boolean;
  darkMode: boolean;
  onClick: () => void;
}

export function ThemePreviewCard({ theme, isSelected, darkMode, onClick }: ThemePreviewCardProps) {
  const colors = darkMode ? theme.colors.dark : theme.colors.light;

  return (
    <Card
      className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary shadow-xl' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {isSelected && (
          <div className="absolute top-2 right-2 h-6 w-6 bg-primary rounded-full flex items-center justify-center">
            <Check className="h-4 w-4 text-primary-foreground" />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{theme.name}</h3>
            <Badge variant="outline" className="text-xs">
              {theme.category}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {theme.description}
          </p>

          <div
            className={`h-20 rounded-lg bg-gradient-to-br ${theme.previewGradient} border`}
            style={{ borderColor: colors.cardBorder }}
          />

          <div className="grid grid-cols-5 gap-2">
            <div
              className="h-8 rounded border"
              style={{ backgroundColor: colors.primary }}
              title="Primary"
            />
            <div
              className="h-8 rounded border"
              style={{ backgroundColor: colors.secondary }}
              title="Secondary"
            />
            <div
              className="h-8 rounded border"
              style={{ backgroundColor: colors.accent }}
              title="Accent"
            />
            <div
              className="h-8 rounded border"
              style={{ backgroundColor: colors.cardBg }}
              title="Card Background"
            />
            <div
              className="h-8 rounded border"
              style={{ backgroundColor: colors.buttonPrimary }}
              title="Button"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
