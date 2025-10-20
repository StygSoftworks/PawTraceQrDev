import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PawPrint, Heart } from "lucide-react";

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
                    It all started when my wife brought two incredible cats into our lives: <span className="font-semibold text-primary">Theo</span> and <span className="font-semibold text-primary">Butterball</span>. These aren't just any cats—they're social butterflies who love exploring the world around them. As indoor-outdoor cats, they enjoy the freedom to roam, meet neighbors, and soak up the sunshine.
                  </p>

                  <p>
                    Most days, their adventures are delightfully uneventful. But one day, Theo decided to take his wandering a bit too far. He was just doing what he does best—strolling around the neighborhood, probably charming everyone he met—when something unexpected happened.
                  </p>

                  <p className="font-medium text-lg">
                    Theo was arrested by the police.
                  </p>

                  <p>
                    Yes, you read that right. Our friendly, adventurous cat was picked up and brought to the local authorities. While we're grateful they found him and kept him safe, the whole process took much longer than it should have. There were phone calls, paperwork, and precious hours spent tracking him down—all because there wasn't an easy way for the finder to know exactly who he belonged to and how to reach us immediately.
                  </p>

                  <p>
                    Here's the thing: <span className="font-semibold">Theo wasn't lost. He wasn't in danger. He was right around the block!</span> He was just being Theo—walking around, exploring, living his best cat life. But without a simple way to identify him and contact us, a routine neighborhood stroll turned into an unnecessary ordeal.
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

                  <div className="pt-6 border-t border-primary/20">
                    <p className="text-base text-muted-foreground italic">
                      Theo and Butterball continue their daily adventures, now with QR code tags that make sure they can always find their way home—without a police escort.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
