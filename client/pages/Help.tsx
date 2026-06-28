import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Bot, MessageSquareText } from "lucide-react";

// Help components
import FaqSection from "@/components/help/FaqSection";
import QuickActions from "@/components/help/QuickActions";
import KeyboardShortcuts from "@/components/help/KeyboardShortcuts";
import Changelog from "@/components/help/Changelog";
import HelpAssistant from "@/components/help/HelpAssistant";
import ContactForm from "@/components/help/ContactForm";
import StatusDashboard from "@/components/help/StatusDashboard";
import Animated3DBackground from "@/components/Animated3DBackground";

export default function Help() {
  return (
    <AppLayout>
      <Animated3DBackground />
      <div className="relative space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        {/* Page Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black tracking-widest uppercase text-primary">
            <BookOpen className="w-3 h-3" />
            Resources
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase">
            Help & Support
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Guides, AI Assistant & Direct Support.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="guide" className="w-full">
          <TabsList className="bg-muted/50 border border-border/50 p-1.5 h-14 rounded-2xl w-full md:w-auto overflow-x-auto justify-start">
            <TabsTrigger
              value="guide"
              className="data-[state=active]:bg-background data-[state=active]:shadow-lg rounded-xl gap-2 h-11 px-6 font-bold transition-all text-[11px] uppercase tracking-wide"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Guide
            </TabsTrigger>
            <TabsTrigger
              value="assistant"
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl gap-2 h-11 px-6 font-bold transition-all text-[11px] uppercase tracking-wide"
            >
              <Bot className="w-3.5 h-3.5" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl gap-2 h-11 px-6 font-bold transition-all text-[11px] uppercase tracking-wide"
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              Contact Us
            </TabsTrigger>
          </TabsList>

          {/* Guide Tab */}
          <TabsContent value="guide" className="mt-6 outline-none space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <QuickActions />
            <FaqSection />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <KeyboardShortcuts />
              <Changelog />
            </div>
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="assistant" className="mt-6 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            <HelpAssistant />
          </TabsContent>

          {/* Contact Us Tab */}
          <TabsContent value="contact" className="mt-6 outline-none space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StatusDashboard />
            <ContactForm />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
