// src/routes/Home.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, } from "lucide-react";
import { HeroImage } from "@/components/HeroImage";
import { Bullet, BulletList } from "@/components/Bullet";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <HeroImage
        base="hero"
        alt="Close-up of a cat representing a pet profile"
        sizes="(max-width: 768px) 100vw, 70vw"
        imgClassName="h-[520px] w-full object-cover"
        gradientOverlayClassName="from-black/50 via-black/30 to-transparent"
        panel={
          <div className="h-full bg-black/45 backdrop-blur-[1px]">
            <div className="px-8 sm:px-12 pt-14 pb-10 space-y-6 max-w-xl">
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest text-white/80">
                <span className="opacity-90">EASY TO SCAN.</span>
                <span className="opacity-60">EASY TO SHARE.</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight uppercase">
                Smart Shareable<br /> Pet IDs!
              </h1>
              <p className="text-lg/7 text-white/90">
                Create a pet profile, we make a QR code and a public page showing
                basic contact info and if your pet is missing. Easy to scan, easy to share.
              </p>
              <Button asChild size="lg" className="bg-[var(--brand-coral)] hover:opacity-90">
                <Link to="/register">
                  Get Started <ChevronRight className="ml-1.5 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        }
      />

      {/* HOW IT WORKS */}
      <section className="border-t border-slate-200 bg-background">
        <div className="container mx-auto grid grid-cols-1 gap-8 px-4 sm:px-6 py-14 md:grid-cols-2">
          <div className="max-w-md">
            <h3 className="text-2xl font-bold uppercase tracking-wider text-foreground">
              How PawTraceQR Works
            </h3>
            <p className="mt-3 text-muted-foreground">
              Set up takes minutes. Everything below is available right now.
            </p>
          </div>
          <BulletList>
            <Bullet
              title="Create a pet profile"
              desc="Add name, species (dog/cat/other), pattern/breed, notes, vaccinations, and a photo."
            />
            <Bullet
              title="We generate a QR + short link"
              desc="Each pet gets a compact shareable URL and a scannable QR you can print or engrave."
            />
            <Bullet
              title="Public pet page"
              desc="Scanners see your pet’s basics and whether they’re marked missing."
            />
          </BulletList>
        </div>
      </section>

      {/* WHAT YOU CAN DO RIGHT NOW */}
      <section className="border-t border-slate-200 bg-background">
        <div className="container mx-auto grid grid-cols-1 gap-8 px-4 sm:px-6 py-14 md:grid-cols-2">
          <div className="max-w-md">
            <h3 className="text-2xl font-bold uppercase tracking-wider text-foreground">
              What you can do right now
            </h3>
            <p className="mt-3 text-muted-foreground">
              Practical tools that already work in production.
            </p>
          </div>
          <BulletList>
            <Bullet title="Short QR links" desc="Compact, scannable links for each pet with a dedicated public page." />
            <Bullet title="Smart photo optimization" desc="Uploads are optimized in the browser before storing to keep things fast." />
            <Bullet title="Simple dashboard" desc="Add, edit, or delete pets; upload a photo; and manage details with ease." />
            <Bullet title="Missing mode toggle" desc="Mark a pet as missing; your public page reflects the status and since-when." />
          </BulletList>
        </div>
      </section>
    </div>
  );
}
