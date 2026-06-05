import { Link } from "react-router-dom";
import { Zap, Shield, FileText, Mail, ExternalLink } from "lucide-react";

export function TermsContent() {
  return (
    <div className="prose prose-invert max-w-none space-y-10 text-muted-foreground leading-relaxed">
      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">1. Acceptance of Terms</h2>
        <p>By accessing or using CastHub ("the Platform", "we", "our", or "us"), you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you must not access or use the Platform. These terms apply to all users, visitors, and others who access or use the service.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">2. Description of Service</h2>
        <p>CastHub is a casting automation platform that allows professionals in the entertainment industry to manage outreach campaigns via WhatsApp, Gmail, and Instagram. The platform provides tools for contact management, bulk messaging, template creation, and campaign analytics.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">3. Eligibility</h2>
        <p>You must be at least 18 years of age to use the Platform. By using CastHub, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into binding contracts. Accounts registered on behalf of organizations must be created by authorized representatives.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">4. Account Registration</h2>
        <p>To access certain features, you must create an account. You agree to provide accurate, current, and complete information and to keep it updated. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">5. Acceptable Use Policy</h2>
        <p>You agree to use the Platform only for lawful purposes and in compliance with all applicable laws and regulations, including those of the country in which you operate. You must NOT use CastHub to:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Send spam, unsolicited, or bulk messages in violation of any law</li>
          <li>Harass, threaten, or harm any individual</li>
          <li>Impersonate any person or entity</li>
          <li>Transmit malicious code or interfere with platform infrastructure</li>
          <li>Violate the Terms of Service of WhatsApp, Google, or Instagram</li>
          <li>Engage in any activity that could damage CastHub's reputation or operations</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">6. Third-Party Platforms</h2>
        <p>CastHub integrates with third-party platforms including WhatsApp, Gmail (Google), and Instagram (Meta). Your use of these integrations is also subject to the respective terms and conditions of those platforms. We are not affiliated with, endorsed by, or sponsored by Meta Platforms, Inc., Google LLC, or WhatsApp LLC. Misuse of these integrations that results in account restrictions or bans on those platforms is solely your responsibility.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">7. Subscription and Payments</h2>
        <p>Certain features of CastHub may require a paid subscription. All fees are exclusive of taxes unless otherwise stated. Subscription fees are billed in advance on a recurring basis. You may cancel your subscription at any time; cancellations take effect at the end of the current billing period. Refunds are issued at our sole discretion.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">8. Intellectual Property</h2>
        <p>All content, features, and functionality of the Platform — including but not limited to text, graphics, logos, icons, and software — are owned by CastHub and are protected by applicable intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">9. Limitation of Liability</h2>
        <p>To the maximum extent permitted by applicable law, CastHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Platform, including but not limited to loss of data, loss of profits, or interruption of service, even if we have been advised of the possibility of such damages.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">10. Disclaimer of Warranties</h2>
        <p>The Platform is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">11. Termination</h2>
        <p>We reserve the right to suspend or terminate your account and access to the Platform at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, third parties, or the integrity of the Platform.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">12. Governing Law</h2>
        <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts located in India.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">13. Changes to Terms</h2>
        <p>We reserve the right to modify these Terms at any time. We will provide notice of significant changes by updating the "Last updated" date at the top of this page or by sending an email notification. Your continued use of the Platform after any modifications constitutes your acceptance of the new Terms.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">14. Contact Us</h2>
        <p>If you have any questions about these Terms of Service, please contact us at:</p>
        <a href="mailto:support@casthub.in" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
          <Mail className="w-4 h-4" /> support@casthub.in
        </a>
      </section>
    </div>
  );
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#060610] text-foreground">
      {/* Ambient bg */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-0 w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/50 dark:bg-[#060610]/80 bg-background/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Zap className="w-4.5 h-4.5 text-foreground fill-current" />
          </div>
          <span className="text-lg font-black tracking-tight">CAST<span className="text-primary italic">HUB</span></span>
        </Link>
        <Link to="/privacy" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> Privacy Policy
        </Link>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Legal</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-foreground">Terms of Service</h1>
          <p className="text-muted-foreground font-medium">Last updated: June 2025</p>
        </div>

        <TermsContent />

        {/* Footer Links */}
        <div className="pt-8 border-t border-border/50 flex flex-wrap gap-4 items-center justify-between">
          <p className="text-[11px] text-muted-foreground/40 font-medium">© {new Date().getFullYear()} CastHub. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground font-bold transition-colors">Privacy Policy</Link>
            <Link to="/login" className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground font-bold transition-colors">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
