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

export default function Help() {
  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-foreground sm:text-5xl uppercase">
            Help & <span className="text-primary italic">Support</span>
          </h1>
          <p className="text-muted-foreground font-bold tracking-widest uppercase text-[11px]">
            Guides, AI Assistant & Direct Support
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="guide" className="w-full">
          <TabsList className="dark:bg-black/40 bg-muted border border-border/50 p-1 rounded-xl w-full justify-start h-12 overflow-x-auto">
            <TabsTrigger
              value="guide"
              className="rounded-lg font-black uppercase tracking-widest text-[10px] h-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Guide
            </TabsTrigger>
            <TabsTrigger
              value="assistant"
              className="rounded-lg font-black uppercase tracking-widest text-[10px] h-full px-6 data-[state=active]:bg-emerald-500 data-[state=active]:text-white gap-2"
            >
              <Bot className="w-3.5 h-3.5" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className="rounded-lg font-black uppercase tracking-widest text-[10px] h-full px-6 data-[state=active]:bg-blue-500 data-[state=active]:text-white gap-2"
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
