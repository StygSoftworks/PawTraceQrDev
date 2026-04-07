import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CircleCheck as CheckCircle, Circle as XCircle, Tag, LayoutDashboard } from "lucide-react";

export function BillingSuccess() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-16 max-w-lg">
      <Card className="shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center ring-4 ring-green-200/50 dark:ring-green-800/50">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Purchase Complete</h1>
              <p className="text-muted-foreground">
                Your tag has been added to your account and is ready to assign to a pet.
              </p>
            </div>
          </div>
        </div>
        <CardContent className="p-6 space-y-3">
          <Button asChild className="w-full gap-2 h-11">
            <Link to="/billing">
              <Tag className="h-4 w-4" />
              View My Tags
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full gap-2 h-11">
            <Link to="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function BillingCancel() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-16 max-w-lg">
      <Card className="shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-950/30 dark:to-slate-900/30 p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center ring-4 ring-slate-200/50 dark:ring-slate-700/50">
              <XCircle className="h-8 w-8 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Payment Canceled</h1>
              <p className="text-muted-foreground">
                No worries -- you can try again whenever you're ready.
              </p>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <Button asChild variant="outline" className="w-full gap-2 h-11">
            <Link to="/pricing">
              Try Again
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
