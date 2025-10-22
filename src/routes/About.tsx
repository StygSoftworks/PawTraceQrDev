import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PawPrint, Heart } from "lucide-react";
import { TrustBadges } from "@/components/TrustBadges";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-slate-950 dark:via-orange-950/20 dark:to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <Badge variant="secondary" className="gap-2 px-4 py-2">
              <Heart className="h-3.5 w-3.5" />
              Our Story
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Why PawTraceQR Exists
            </h1>
            <p className="text-xl text-muted-foreground">
              A tale of two cats and one unexpected police encounter
            </p>
          </div>

          <Card className="shadow-xl border-primary/20">
            <CardContent className="p-8 md:p-12 space-y-6">
              <div className="flex justify-center mb-6">
                <img
                  src="/theoandbutterball.webp"
                  alt="Theo and Butterball"
                  className="rounded-lg shadow-md max-w-full h-auto"
                />
              </div>

              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <PawPrint className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-6 text-lg leading-relaxed text-foreground">
                  <p>
                    When my wife brought two incredible cats into our lives: <span className="font-semibold text-primary">Theo</span> and <span className="font-semibold text-primary">Butterball</span>, we knew these aren't just any cats—they're social butterflies who love exploring the world around them. As indoor-outdoor cats, they enjoy the freedom to roam, meet neighbors, and soak up the sunshine.
                  </p>

                  <p>
                    Most days their adventures are delightful and uneventful, One day Theo was strolling the neighborhood, charming everyone— when something unexpected happened.
                  </p>

                  <p className="font-medium text-lg">
                    Theo was arrested by the police.
                  </p>

                  <p>
                    You read that right. Our friendly, adventurous cat was picked up and brought to the local authorities. While we're grateful they kept him safe, the process took longer than it should have. There were phone calls, paperwork, and precious hours spent tracking him down—because there wasn't an easy way for the finder to know exactly who he belonged to and how to reach us immediately.
                  </p>

                  <p>
                    Here's the thing: Theo wasn't lost. He wasn't in danger. He was around the block! He was just living his best cat life. Without a simple way to identify him and contact us, a routine neighborhood stroll turned into an unnecessary ordeal.
                  </p>

                  <p>
                    That experience sparked an idea. What if there was a better way? What if anyone who found Theo—or Butterball, or any pet—could instantly see their information, know they weren't lost, and contact their owner with a simple scan?
                  </p>

                  <p className="text-xl font-semibold text-primary">
                    That's why we built PawTraceQR.
                  </p>

                  <p>
                    Our mission is simple: keep pets safe and reunite them with their families faster. No more confusion, no more unnecessary interventions, no more wasted time. Just a quick QR code scan that tells finders everything they need to know—whether the pet is missing, who to contact, and any important details about their care.
                  </p>

                  <p>
                    Because every pet deserves to wander safely, and every owner deserves peace of mind.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-primary/20">
            <CardContent className="p-8 md:p-12">
              <div className="text-center space-y-4 mb-6">
                <h2 className="text-2xl md:text-3xl font-bold">Our Commitment to You</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  We built PawTraceQR with privacy and trust at its core. Your data belongs to you,
                  and we're committed to keeping it that way.
                </p>
              </div>
              <TrustBadges variant="stacked" className="max-w-xl mx-auto" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}