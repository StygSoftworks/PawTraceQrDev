// src/routes/Terms.tsx
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, FileText, Info } from "lucide-react";
import Logo from "@/components/Logo";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative">
        {/* Header with Logo */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <Logo size="lg" showText={true} className="" />
          <Link to="/signin">
            <Button variant="outline" size="sm" className="gap-2 transition-all hover:scale-105">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Button>
          </Link>
        </div>

        <Card className="shadow-xl border-slate-200 dark:border-slate-800 overflow-hidden">
          <CardHeader className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center ring-4 ring-primary/5">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold tracking-tight">
                  Terms of Service
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-8 pb-8 space-y-8">
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                Please read these terms carefully before using PawTrace. By creating an account or using our service, 
                you agree to be bound by these terms.
              </AlertDescription>
            </Alert>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using PawTrace ("the Service," "we," "us," or "our"), you accept and agree to be 
                bound by the terms and provisions of this agreement. If you do not agree to these terms, please do 
                not use the Service. These Terms of Service ("Terms") govern your access to and use of PawTrace's 
                website, mobile applications, and related services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                PawTrace provides pet tracking and identification services through QR codes and related technologies. 
                The Service allows users to:
              </p>
              <ul className="space-y-2 text-muted-foreground ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Create and manage digital profiles for their pets</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Generate unique QR codes for pet identification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Store important pet information including medical records and emergency contacts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Facilitate the safe return of lost pets to their owners</span>
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">3. User Accounts and Registration</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                To use certain features of the Service, you must register for an account. When you create an account, you agree to:
              </p>
              <ul className="space-y-2 text-muted-foreground ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Provide accurate, current, and complete information during the registration process</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Maintain and promptly update your account information to keep it accurate and complete</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Maintain the security and confidentiality of your password and account credentials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Notify us immediately of any unauthorized use of your account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Accept full responsibility for all activities that occur under your account</span>
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                You must be at least 18 years old to create an account. If you are under 18, you may only use the 
                Service with the involvement and consent of a parent or legal guardian.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">4. Acceptable Use Policy</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
              </p>
              <ul className="space-y-2 text-muted-foreground ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Use the Service in any way that violates any applicable federal, state, local, or international law</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Transmit any material that is defamatory, obscene, threatening, or otherwise objectionable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Impersonate or attempt to impersonate PawTrace, a PawTrace employee, another user, or any other person</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Use any robot, spider, or other automatic device to access the Service for any purpose</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Introduce viruses, trojans, worms, logic bombs, or other harmful material</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Attempt to gain unauthorized access to any portion of the Service or related systems</span>
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">5. User Content</h2>
              <p className="text-muted-foreground leading-relaxed">
                You retain all rights to any content you submit, post, or display through the Service ("User Content"). 
                By submitting User Content, you grant PawTrace a worldwide, non-exclusive, royalty-free license to use, 
                reproduce, modify, and display such content solely for the purpose of providing and improving the Service.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                You represent and warrant that you own or have the necessary rights to all User Content you submit and 
                that such content does not violate any third-party rights or applicable laws.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">6. Intellectual Property Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service and its original content (excluding User Content), features, and functionality are and will 
                remain the exclusive property of PawTrace and its licensors. The Service is protected by copyright, 
                trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress 
                may not be used in connection with any product or service without the prior written consent of PawTrace.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">7. Subscription and Payment Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                Certain features of the Service may require payment of fees. You agree to pay all applicable fees as 
                described on the Service at the time of purchase. All fees are non-refundable unless otherwise stated. 
                We reserve the right to change our fees at any time, with notice provided in advance for subscription 
                services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">8. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or 
                liability, for any reason whatsoever, including without limitation if you breach these Terms. Upon 
                termination, your right to use the Service will immediately cease. You may also terminate your account 
                at any time by contacting us or using the account deletion feature in your settings.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">9. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, 
                EITHER EXPRESS OR IMPLIED. PAWTRACE DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED 
                WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT 
                THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">10. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                IN NO EVENT SHALL PAWTRACE, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE 
                FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, 
                LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF 
                OR INABILITY TO ACCESS OR USE THE SERVICE.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">11. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to defend, indemnify, and hold harmless PawTrace and its affiliates from and against any claims, 
                liabilities, damages, losses, and expenses, including reasonable attorney's fees, arising out of or in any 
                way connected with your access to or use of the Service or your violation of these Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">12. Governing Law and Dispute Resolution</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the United States, without 
                regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Service 
                shall be resolved through binding arbitration in accordance with the rules of the American Arbitration 
                Association.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">13. Changes to These Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision 
                is material, we will provide at least 30 days' notice prior to any new terms taking effect. What 
                constitutes a material change will be determined at our sole discretion. By continuing to access or use 
                our Service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">14. Severability</h2>
              <p className="text-muted-foreground leading-relaxed">
                If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed 
                and interpreted to accomplish the objectives of such provision to the greatest extent possible under 
                applicable law, and the remaining provisions will continue in full force and effect.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">15. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 mt-3 border border-slate-200 dark:border-slate-800">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Email:</strong>{" "}
                  <a href="mailto:legal@pawtrace.com" className="text-primary hover:underline">
                    legal@pawtrace.com
                  </a>
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong className="text-foreground">Support:</strong>{" "}
                  <Link to="/contact" className="text-primary hover:underline">
                    Contact Support
                  </Link>
                </p>
              </div>
            </section>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}