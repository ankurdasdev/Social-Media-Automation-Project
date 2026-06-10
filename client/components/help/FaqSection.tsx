import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSection {
  title: string;
  icon: string;
  items: FaqItem[];
}

const FAQ_DATA: FaqSection[] = [
  {
    title: "Getting Started",
    icon: "🚀",
    items: [
      { question: "What is CastHub?", answer: "CastHub is a casting automation platform that helps casting directors manage contacts and send personalized outreach messages via WhatsApp, Email, and Instagram — all from one unified dashboard." },
      { question: "How do I set up my account?", answer: "After signing up and verifying your email, you'll be guided through the onboarding process. Connect your WhatsApp, Instagram, and Google Drive accounts from the Integrations Centre to get started." },
      { question: "What platforms does CastHub support?", answer: "CastHub supports WhatsApp (via QR code pairing), Instagram (direct login), Gmail (via Google OAuth), and Google Drive for file attachments." },
      { question: "Is there a free trial?", answer: "Yes! New accounts get a free trial period. You can explore all features during the trial. After it expires, choose a Weekly (₹199) or Monthly (₹499) plan to continue." },
    ],
  },
  {
    title: "Contact Management",
    icon: "📇",
    items: [
      { question: "How do I add a new contact?", answer: "Navigate to the Contacts page and click the '+ Add Contact' button. Fill in the details like name, WhatsApp number, email, and Instagram handle." },
      { question: "Can I import contacts from Excel?", answer: "Yes! Click the 'Excel Import' button on the Contacts page. Upload your .xlsx file and the system will auto-detect column names and map them to CastHub fields." },
      { question: "How do I color-code rows?", answer: "Right-click on any contact row to open the context menu, then select 'Row Color'. Choose from standard colors, extended solids, custom hex values, or premium gradients." },
      { question: "What is AI Search?", answer: "AI Search lets you query your contacts using natural language. For example: 'Find all actors in Mumbai who haven't been contacted yet' or 'Show contacts with failed WhatsApp delivery'." },
      { question: "How do I bulk-edit contacts?", answer: "Select multiple contacts using the checkboxes, then use the bulk actions toolbar that appears. You can change sheet names, colors, or delete multiple contacts at once." },
      { question: "What are Sheet Names?", answer: "Sheet Names are like folders or categories for your contacts. You can group contacts by project, casting call, or any custom label. Filter your view by sheet name using the dropdown." },
    ],
  },
  {
    title: "Template Library",
    icon: "📝",
    items: [
      { question: "How do I create a message template?", answer: "Go to Template Library → click '+ New Template'. Choose a category (WhatsApp, Email, or Instagram), name it, and write your message using placeholders like {name} and {project}." },
      { question: "What template variables are available?", answer: "Available variables: {name} (contact name), {castingName} (casting director name), {project} (project name), {actingContext} (acting context/role). These are auto-replaced when sending." },
      { question: "Can I attach files to templates?", answer: "Yes! For WhatsApp and Email templates, you can attach files from Google Drive. Connect your Drive first in Integrations Centre, then browse and attach files when creating a template." },
      { question: "What's the difference between body and footer templates?", answer: "Email templates can be 'body' (main message content) or 'footer' (signature/closing text). You can combine one body template with one footer template for each outreach." },
    ],
  },
  {
    title: "Integrations",
    icon: "🔗",
    items: [
      { question: "How do I connect WhatsApp?", answer: "Go to Integrations Centre → WhatsApp → Connect. A QR code will appear. Open WhatsApp on your phone → Settings → Linked Devices → Link a Device → Scan the QR code." },
      { question: "How do I connect Instagram?", answer: "Go to Integrations Centre → Instagram → Connect. Enter your Instagram username and password. If you have 2FA enabled, you'll be prompted for the verification code." },
      { question: "How do I connect Google Drive?", answer: "Go to Integrations Centre → Google Drive → Connect. You'll be redirected to Google's OAuth page. Grant permissions and select the folder you want to use for attachments." },
      { question: "Why is my WhatsApp disconnecting?", answer: "WhatsApp sessions can expire if your phone goes offline for too long or if you manually disconnect from your phone. Reconnect by scanning the QR code again from Integrations Centre." },
    ],
  },
  {
    title: "Source Manager & Auto-Ingestion",
    icon: "📡",
    items: [
      { question: "What is Source Manager?", answer: "Source Manager lets you configure WhatsApp groups and Instagram threads for automatic casting call detection. The system scans these sources and auto-creates contacts from casting posts." },
      { question: "How often does auto-ingestion run?", answer: "By default, auto-ingestion runs daily. You can configure the schedule from the Source Manager page under 'Auto Scheduler'. You can also trigger a manual scan anytime." },
      { question: "What does AI Profiling do?", answer: "AI Profiling uses artificial intelligence to analyze incoming messages and extract contact details (name, phone, email, role) from casting call posts automatically." },
      { question: "Why are auto-ingested contacts marked yellow?", answer: "Yellow row color indicates that the contact was auto-ingested and hasn't been reviewed yet. This helps you quickly identify new contacts that need verification." },
    ],
  },
  {
    title: "Analytics & Outreach",
    icon: "📊",
    items: [
      { question: "How do I send outreach messages?", answer: "Select contacts on the Contacts page, configure their templates and personalization settings, then enable the automation trigger. The system will send messages through your connected platforms." },
      { question: "What does the AI Failure Autopsy do?", answer: "The AI Failure Autopsy on the Analytics page analyzes all failed outreach attempts and provides specific diagnoses — like incorrect phone numbers, rate limiting, or connection issues." },
      { question: "Can I chat with my analytics data?", answer: "Yes! The AI Data Analyst on the Analytics page lets you ask questions about your data in natural language, like 'What's my WhatsApp success rate this week?' or 'Which project has the most failures?'." },
    ],
  },
  {
    title: "Subscription & Billing",
    icon: "💳",
    items: [
      { question: "What plans are available?", answer: "CastHub offers two plans: Weekly (₹199/week) and Monthly (₹499/month — save 40% vs weekly). Both include all features: full contact management, multi-platform automation, AI features, and analytics." },
      { question: "What payment methods are accepted?", answer: "We accept UPI, Credit/Debit Cards, Net Banking, and Digital Wallets via Razorpay — India's most trusted payment gateway with 256-bit SSL encryption." },
      { question: "How do I apply a coupon code?", answer: "On the Subscription page, enter your coupon code in the 'Apply Coupon' section before making payment. Valid coupons will show the discount amount and updated total." },
      { question: "Can I get a refund?", answer: "Please contact support through the Contact form on this page with your payment details. Refund requests are evaluated on a case-by-case basis." },
    ],
  },
];

export default function FaqSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleItem = (key: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredSections = FAQ_DATA.map((section, sIdx) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        !searchQuery ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    originalIndex: sIdx,
  })).filter((section) => section.items.length > 0);

  return (
    <Card className="glass-card border-border overflow-hidden">
      <CardHeader className="p-6 border-b border-border/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-black tracking-tight">Frequently Asked Questions</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
              {FAQ_DATA.reduce((acc, s) => acc + s.items.length, 0)} answers across {FAQ_DATA.length} categories
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-11 rounded-xl bg-muted/30 border-border/50 font-bold text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredSections.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p className="text-sm font-bold">No matching questions found.</p>
            <p className="text-xs mt-1">Try a different search term or ask the AI Assistant.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filteredSections.map((section) => (
              <div key={section.originalIndex}>
                <button
                  onClick={() => toggleSection(section.originalIndex)}
                  className="w-full flex items-center justify-between p-5 hover:bg-muted/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{section.icon}</span>
                    <span className="text-sm font-black uppercase tracking-widest text-foreground">{section.title}</span>
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                      {section.items.length}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform duration-300",
                      expandedSections.has(section.originalIndex) && "rotate-180"
                    )}
                  />
                </button>
                {expandedSections.has(section.originalIndex) && (
                  <div className="px-5 pb-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                    {section.items.map((item, iIdx) => {
                      const itemKey = `${section.originalIndex}-${iIdx}`;
                      const isOpen = expandedItems.has(itemKey);
                      return (
                        <div key={iIdx} className="rounded-xl overflow-hidden">
                          <button
                            onClick={() => toggleItem(itemKey)}
                            className={cn(
                              "w-full flex items-start gap-3 p-4 text-left transition-colors rounded-xl",
                              isOpen ? "bg-primary/5" : "hover:bg-muted/20"
                            )}
                          >
                            <ChevronRight
                              className={cn(
                                "w-4 h-4 text-muted-foreground shrink-0 mt-0.5 transition-transform duration-200",
                                isOpen && "rotate-90 text-primary"
                              )}
                            />
                            <span className={cn("text-sm font-bold", isOpen ? "text-primary" : "text-foreground")}>
                              {item.question}
                            </span>
                          </button>
                          {isOpen && (
                            <div className="pl-11 pr-4 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                              <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
