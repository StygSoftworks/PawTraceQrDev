// src/routes/Home.tsx
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PawPrint, QrCode, Shield, Zap, Heart, CircleCheck as CheckCircle2, ArrowRight, Smartphone, LayoutGrid, Image as ImageIcon, Lock, MapPin, Bell, History, DollarSign } from "lucide-react";
import {StatsCounters} from "@/components/StatsCounters";
import { TrustBadges } from "@/components/TrustBadges";


export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-slate-950 dark:via-orange-950/20 dark:to-slate-900">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-coral/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-teal/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-lavender/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="gap-2 px-4 py-2">
              <Zap className="h-3.5 w-3.5" />
              Smart, shareable pet IDs
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              QR tags and a simple page that{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                get pets home
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Create a pet profile, we make a QR code and a public page
              showing basic contact info and if your pet is missing. Easy to scan, easy to share.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button asChild size="lg" className="gap-2 text-lg px-8 transition-all hover:scale-105">
                <Link to="/register">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 text-lg px-8 transition-all hover:scale-105">
                <Link to="/signin">
                  <PawPrint className="h-5 w-5" />
                  Sign In
                </Link>
              </Button>
            </div>

            <TrustBadges variant="hero" className="pt-6" />
          </div>
        </div>
      </section>

      {/* Stats Counters */}
      <StatsCounters />

      {/* How It Works (what’s live today) */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-3">
            <Badge variant="outline" className="gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Live today
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How PawTraceQR Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Set up takes minutes. Everything below is available right now.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                iconBg: "bg-primary/10",
                icon: <LayoutGrid className="h-8 w-8 text-primary" />,
                title: "Create a pet profile",
                desc: "Add name, species (dog/cat/other), pattern/breed, notes, vaccinations, and a photo."
              },
              {
                iconBg: "bg-primary/10",
                icon: <QrCode className="h-8 w-8 text-primary" />,
                title: "We generate a QR + short link",
                desc: "Each pet gets a compact shareable URL and a scannable QR you can print or engrave."
              },
              {
                iconBg: "bg-primary/10",
                icon: <Heart className="h-8 w-8 text-primary" />,
                title: "Public pet page",
                desc: "Scanners see your pet’s basics and whether they’re marked missing."
              }
            ].map((s, i) => (
              <Card key={i} className="relative overflow-hidden transition-all duration-200 hover:shadow-lg border-primary/10">
                <CardHeader>
                  <div className={`h-14 w-14 ${s.iconBg} rounded-xl flex items-center justify-center ring-4 ring-primary/5 mb-4`}>
                    {s.icon}
                  </div>
                  <CardTitle className="text-xl">{s.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {s.desc}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Current Features */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:bg-slate-950">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-3">
            <Badge variant="outline" className="gap-2">
              <Shield className="h-3.5 w-3.5" />
              Built-in essentials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">What you can do right now</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Practical tools that already work in production.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: <QrCode className="h-6 w-6" />,
                title: "Short QR links",
                desc: "Compact, scannable links for each pet with a dedicated public page."
              },
              {
                icon: <ImageIcon className="h-6 w-6" />,
                title: "Smart photo optimization",
                desc: "Uploads are optimized in the browser before storing to keep things fast."
              },
              {
                icon: <LayoutGrid className="h-6 w-6" />,
                title: "Simple dashboard",
                desc: "Add, edit, or delete pets; upload a photo; and manage details with ease."
              },
              {
                icon: <Heart className="h-6 w-6" />,
                title: "Missing mode toggle",
                desc: "Mark a pet as missing; your public page reflects the status and since-when."
              },
              {
                icon: <Lock className="h-6 w-6" />,
                title: "Secure by default",
                desc: "Authentication and row-level security with Supabase keep your data safe."
              },
              {
                icon: <Smartphone className="h-6 w-6" />,
                title: "Mobile-friendly",
                desc: "Everything is designed to work great on any phone a finder uses."
              } ,            {
                icon: <History className="h-6 w-6" />,
                title: "Scan history",
                desc: "See when pages were viewed to help you understand activity."
              },
            ].map((f, i) => (
              <Card key={i} className="transition-all duration-200 hover:shadow-md border-primary/10">
                <CardHeader>
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-3">
                    {f.icon}
                  </div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {f.desc}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-3">
            <Badge variant="outline" className="gap-2">
              <Zap className="h-3.5 w-3.5" />
              On the roadmap
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">What’s coming next</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We’re actively building these enhancements.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: <Bell className="h-6 w-6" />,
                title: "Scan notifications",
                desc: "Get alerted when someone scans your pet’s QR (email/push)."
              },

              {
                icon: <DollarSign className="h-6 w-6" />,
                title: "Billing & pet limits",
                desc: "Base plan plus add-ons for more pets—clean, simple pricing."
              },
              {
                icon: <MapPin className="h-6 w-6" />,
                title: "Optional location share",
                desc: "Let finders send a GPS pin with consent (privacy-first)."
              }
            ].map((f, i) => (
              <Card key={i} className="transition-all duration-200 hover:shadow-md border-primary/10">
                <CardHeader>
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-3">
                    {f.icon}
                  </div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {f.desc}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container mx-auto px-4 sm:px-6">
          <Card className="max-w-4xl mx-auto shadow-xl border-primary/20">
            <CardContent className="p-12 text-center space-y-6">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto ring-4 ring-primary/5">
                <PawPrint className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Create your first pet profile today
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Generate a QR and a clean public page in minutes. Update details anytime.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Button asChild size="lg" className="gap-2 text-lg px-8 transition-all hover:scale-105">
                  <Link to="/register">
                    Get Started
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2 text-lg px-8 transition-all hover:scale-105">
                  <Link to="/signin">
                    Sign In
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
