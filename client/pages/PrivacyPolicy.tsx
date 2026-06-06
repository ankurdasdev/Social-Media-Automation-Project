import { Link } from "react-router-dom";
import { Zap, Shield, FileText, Mail } from "lucide-react";

export function PrivacyContent() {
  return (
    <div className="prose dark:prose-invert max-w-none space-y-10 text-muted-foreground leading-relaxed">
      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">1. Introduction</h2>
        <p>CastHub ("we", "our", or "us") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our platform. By using CastHub, you consent to the practices described in this policy.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">2. Information We Collect</h2>
        <p>We collect the following categories of information:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li><strong className="text-foreground">Account Information:</strong> Name, email address, phone number, gender, and date of birth provided at registration.</li>
          <li><strong className="text-foreground">Usage Data:</strong> Log data, IP addresses, browser type, pages visited, and time spent on the platform.</li>
          <li><strong className="text-foreground">Integration Credentials:</strong> OAuth tokens for Google (Gmail/Drive) and session data for WhatsApp and Instagram connections.</li>
          <li><strong className="text-foreground">Contact Data:</strong> Information you upload or import (e.g., talent contact lists) for use with our outreach tools.</li>
          <li><strong className="text-foreground">Payment Information:</strong> Billing details processed via our payment providers (Razorpay). We do not store raw card details.</li>
          <li><strong className="text-foreground">Communications:</strong> Messages, templates, and campaign content you create within the platform.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">3. How We Use Your Information</h2>
        <p>We use your data to:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Provide, operate, and improve the CastHub platform</li>
          <li>Authenticate your identity and secure your account</li>
          <li>Send transactional emails (e.g., email verification, password resets)</li>
          <li>Process payments and manage subscriptions</li>
          <li>Respond to support requests and inquiries</li>
          <li>Analyze usage patterns to improve user experience</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">4. Data Sharing and Disclosure</h2>
        <p>We do not sell, trade, or rent your personal information. We may share data with:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li><strong className="text-foreground">Service Providers:</strong> Third-party vendors that assist us in operating the platform (e.g., cloud hosting, email delivery, payment processing).</li>
          <li><strong className="text-foreground">Third-Party Platforms:</strong> When you authorize integrations with Google, WhatsApp, or Instagram, relevant data is transmitted to those platforms under their own privacy policies.</li>
          <li><strong className="text-foreground">Legal Requirements:</strong> We may disclose your data if required by law, court order, or governmental authority.</li>
          <li><strong className="text-foreground">Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred as part of the transaction.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">5. Data Retention</h2>
        <p>We retain your personal data for as long as your account is active or as needed to provide the service. If you delete your account, we will delete or anonymize your personal data within 30 days, except where retention is required by law or for legitimate business interests (e.g., fraud prevention).</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">6. Cookies and Tracking</h2>
        <p>We use cookies and similar tracking technologies to maintain session state and improve user experience. You can control cookie preferences through your browser settings. Disabling cookies may affect the functionality of certain features.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">7. Data Security</h2>
        <p>We implement industry-standard security measures including encryption at rest and in transit (TLS/HTTPS), hashed password storage (bcrypt), and access controls. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">8. Your Rights</h2>
        <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li><strong className="text-foreground">Access:</strong> Request a copy of the personal data we hold about you.</li>
          <li><strong className="text-foreground">Correction:</strong> Request that we correct inaccurate or incomplete data.</li>
          <li><strong className="text-foreground">Deletion:</strong> Request deletion of your personal data (subject to legal obligations).</li>
          <li><strong className="text-foreground">Portability:</strong> Request your data in a machine-readable format.</li>
          <li><strong className="text-foreground">Objection:</strong> Object to or restrict certain types of processing.</li>
        </ul>
        <p>To exercise any of these rights, contact us at <a href="mailto:support@casthub.in" className="text-primary font-bold hover:underline">support@casthub.in</a>.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">9. Children's Privacy</h2>
        <p>CastHub is not intended for individuals under the age of 18. We do not knowingly collect personal data from minors. If you believe a minor has provided us with their information, please contact us immediately and we will take steps to delete it.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">10. Third-Party Services</h2>
        <p>Our platform integrates with third-party services such as Google, Meta (WhatsApp/Instagram), and Razorpay. These services have their own privacy policies, and we encourage you to review them. We are not responsible for the privacy practices of these external services.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">11. International Data Transfers</h2>
        <p>Your data is stored and processed on servers located in India. If you access CastHub from outside India, your data may be transferred to and processed in India. By using the platform, you consent to this transfer.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">12. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the "Last updated" date and, where appropriate, via email. Your continued use of the platform after changes are posted constitutes your acceptance of the updated policy.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-foreground">13. Contact Us</h2>
        <p>For privacy-related questions, requests, or complaints, please contact our Data Protection team:</p>
        <a href="mailto:support@casthub.in" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
          <Mail className="w-4 h-4" /> support@casthub.in
        </a>
      </section>
    </div>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen dark:bg-[#060610] bg-background text-foreground">
      {/* Ambient bg */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/50 dark:bg-[#060610]/80 bg-background/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Zap className="w-4.5 h-4.5 text-foreground fill-current" />
          </div>
          <span className="text-lg font-black tracking-tight">CAST<span className="text-primary italic">HUB</span></span>
        </Link>
        <Link to="/terms" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Terms of Service
        </Link>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Legal</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground font-medium">Last updated: June 2025</p>
        </div>

        <PrivacyContent />

        {/* Footer Links */}
        <div className="pt-8 border-t border-border/50 flex flex-wrap gap-4 items-center justify-between">
          <p className="text-[11px] text-muted-foreground/40 font-medium">© {new Date().getFullYear()} CastHub. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/terms" className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground font-bold transition-colors">Terms of Service</Link>
            <Link to="/login" className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground font-bold transition-colors">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
