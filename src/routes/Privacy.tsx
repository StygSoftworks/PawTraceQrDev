// src/routes/Privacy.tsx
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative">
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-12 w-12 flex items-center justify-center">
              <img 
                src="/PawTraceQRLogo.svg" 
                alt="PawTrace Logo" 
                className="w-full h-full object-contain transition-transform group-hover:scale-110"
              />
            </div>
            <span className="text-xl font-bold text-foreground">PawTrace</span>
          </Link>
          <Link to="/signin">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Button>
          </Link>
        </div>

        <Card className="shadow-xl border-slate-200 dark:border-slate-800">
          <CardHeader className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold tracking-tight">
                  Privacy Policy
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="prose prose-slate dark:prose-invert max-w-none pt-8 pb-8">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Account information (name, email address, password)</li>
                <li>Pet information (name, breed, medical information, photos)</li>
                <li>Contact information for emergency contacts</li>
                <li>Payment information for premium services</li>
                <li>Communications with us and other users</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Create and manage your account</li>
                <li>Generate QR codes and pet profiles</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Facilitate the reunification of lost pets with their owners</li>
                <li>Detect, prevent, and address fraud and security issues</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">3. Information Sharing</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>With your consent or at your direction</li>
                <li>With service providers who perform services on our behalf</li>
                <li>When someone scans your pet's QR code (only information you've chosen to make public)</li>
                <li>To comply with legal obligations or respond to legal requests</li>
                <li>To protect the rights and safety of PawTrace, our users, and the public</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">4. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information. 
                However, no method of transmission over the Internet or electronic storage is 100% secure, and we 
                cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">5. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your information for as long as your account is active or as needed to provide you services. 
                You may request deletion of your data at any time by contacting us, subject to certain legal 
                obligations to retain information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">6. Your Rights and Choices</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Access, update, or delete your personal information</li>
                <li>Object to processing of your information</li>
                <li>Request restriction of processing your information</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent at any time</li>
                <li>Lodge a complaint with a data protection authority</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">7. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to collect information about your browsing activities. 
                You can control cookies through your browser settings and other tools. Note that disabling cookies may 
                affect the functionality of our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">8. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service is not directed to children under the age of 13. We do not knowingly collect personal 
                information from children under 13. If you believe we have collected information from a child under 13, 
                please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">9. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We take 
                appropriate safeguards to ensure your data is protected in accordance with this Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">10. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">11. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us at{" "}
                <a href="mailto:privacy@pawtrace.com" className="text-primary hover:underline">
                  privacy@pawtrace.com
                </a>
              </p>
            </section>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}