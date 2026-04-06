import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PawPrint, Eye, LayoutDashboard, Check } from "lucide-react";

type Props = {
  shortId: string;
};

export function OnboardSuccess({ shortId }: Props) {
  return (
    <Card className="shadow-xl animate-in fade-in-50 slide-in-from-bottom-4 duration-500 overflow-hidden">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-20 w-20 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center ring-4 ring-green-200/50 dark:ring-green-800/50 animate-in zoom-in-50 duration-700">
            <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Your Tag is Live!</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Your pet's profile is now connected to this tag. Anyone who scans it will see your pet's info and be able to contact you.
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild size="lg" className="gap-2 h-12 transition-all hover:scale-105">
            <Link to={`/p/${shortId}`}>
              <Eye className="h-4 w-4" />
              View Pet Profile
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 h-12 transition-all hover:scale-105">
            <Link to="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </div>

        <div className="rounded-xl bg-secondary/30 p-4 space-y-3">
          <p className="text-sm font-medium">Next steps you might want to do:</p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <PawPrint className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              Add your phone number and email so finders can reach you
            </li>
            <li className="flex items-start gap-2">
              <PawPrint className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              Add vaccination records and medical notes
            </li>
            <li className="flex items-start gap-2">
              <PawPrint className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              Customize your pet's profile page theme
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
