import React, { createContext, useContext, useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ChevronRight, ChevronLeft, X, Sparkles } from "lucide-react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { isTokenValid } from "@/lib/utils";

interface TutorialStep {
  targetId: string;
  title: string;
  content: string;
  placement: "top" | "bottom" | "left" | "right";
  path?: string;
}

const TUTORIAL_STEPS: Record<string, TutorialStep[]> = {
  dashboard: [
    {
      targetId: "tutorial-dashboard-welcome",
      title: "Welcome to CastHub Dashboard!",
      content: "This is your CastHub home. Here you can see a high-level summary of your database, connections, and automated workflows.",
      placement: "bottom",
      path: "/dashboard"
    },
    {
      targetId: "tutorial-dashboard-stats",
      title: "Global Metrics",
      content: "These cards display your database size, outreach rate, and platform operational status. Keep an eye on these live values!",
      placement: "bottom",
      path: "/dashboard"
    },
    {
      targetId: "tutorial-dashboard-nav",
      title: "Quick Navigation",
      content: "Easily hop between the Source Manager (Controller), Contacts List, and Performance Analytics using these dynamic shortcuts.",
      placement: "right",
      path: "/dashboard"
    },
    {
      targetId: "tutorial-dashboard-contacts",
      title: "Recent Contacts Stream",
      content: "A real-time list showing your most recently sync'd talent records, including their context details and timestamps.",
      placement: "left",
      path: "/dashboard"
    }
  ],
  contacts: [
    {
      targetId: "tutorial-contacts-welcome",
      title: "Contacts Database Grid",
      content: "Welcome to your talent workspace. You can organize, filter, override messages, and dispatch outreach campaigns directly from this page.",
      placement: "bottom",
      path: "/contacts"
    },
    {
      targetId: "tutorial-contacts-import",
      title: "Spreadsheet Ingestor",
      content: "Click this 'IMPORT EXCEL' button to upload a multi-sheet spreadsheet. It opens our synonym auto-mapper to bind columns instantly!",
      placement: "bottom",
      path: "/contacts"
    },
    {
      targetId: "tutorial-contacts-sheets",
      title: "Dynamic Custom Sheets",
      content: "Switch between tabs here. When you import spreadsheets, every sheet automatically generates its own isolated category tab!",
      placement: "bottom",
      path: "/contacts"
    },
    {
      targetId: "tutorial-contacts-add",
      title: "Manual Record Creation",
      content: "Click '+ ADD CONTACT' to create a contact manually. You can fill out WhatsApp, Email, or Instagram details and templates independently.",
      placement: "bottom",
      path: "/contacts"
    },
    {
      targetId: "tutorial-grid",
      title: "Excel-Like Grid Utilities",
      content: "Right-click any cell to pick row colors! Click-and-drag from the bottom-right corner of any cell to auto-fill records down.",
      placement: "top",
      path: "/contacts"
    },
    {
      targetId: "tutorial-contacts-ai",
      title: "AI Search Filter",
      content: "Toggle the Sparkles icon to use our AI search! Ask things like 'Find failed email contacts from project Alpha' to auto-filter instantly.",
      placement: "bottom",
      path: "/contacts"
    }
  ],
  controller: [
    {
      targetId: "tutorial-controller-welcome",
      title: "Source Controller",
      content: "Welcome to your automation hub. This is where you configure target lists, manage outreach templates, and run scheduled sequences.",
      placement: "bottom",
      path: "/controller"
    },
    {
      targetId: "tutorial-controller-sync",
      title: "Sync Connections",
      content: "Click 'Sync Groups' (on WhatsApp tab) or 'Sync Threads' (on Instagram tab) to pull active conversation data from your connected accounts.",
      placement: "bottom",
      path: "/controller"
    },
    {
      targetId: "tutorial-controller-templates",
      title: "Sequence Template Manager",
      content: "Create reusable outreach copies here. Email templates support discrete 'Body' and 'Footer' selections to sequence automatically.",
      placement: "bottom",
      path: "/controller"
    },
    {
      targetId: "tutorial-controller-profiling",
      title: "AI Profiling Assistant",
      content: "Open this assistant to analyze actor portfolios, headshots, and casting roles to generate custom template outreach copy.",
      placement: "bottom",
      path: "/controller"
    },
    {
      targetId: "tutorial-controller-scheduler",
      title: "Automation Scheduler",
      content: "Click 'Auto-Scheduler' to establish timing bounds, interval delays, and recurring campaigns to run completely automatically in the background.",
      placement: "bottom",
      path: "/controller"
    },
    {
      targetId: "tutorial-controller-add",
      title: "Register New Targets",
      content: "Click 'ADD NEW SOURCE' to register a custom WhatsApp group link, Instagram handle, or hashtag to automatically harvest.",
      placement: "bottom",
      path: "/controller"
    }
  ],
  analytics: [
    {
      targetId: "tutorial-analytics-welcome",
      title: "Performance Analytics",
      content: "Analyze and optimize your team's outreach campaign. Trace metrics across all connected networks here.",
      placement: "bottom",
      path: "/analytics"
    },
    {
      targetId: "tutorial-analytics-metrics",
      title: "Key Status Indicators",
      content: "Read your aggregate reach-outs, overall outreach success rates, and fail ratios. Click any card to view filtered contact listings.",
      placement: "bottom",
      path: "/analytics"
    },
    {
      targetId: "tutorial-analytics-timeframe",
      title: "Time Range Selectors",
      content: "Toggle between 'Daily', 'Weekly', or 'Monthly' views to dynamically slice comparative volume distributions.",
      placement: "left",
      path: "/analytics"
    },
    {
      targetId: "tutorial-analytics-charts",
      title: "Outreach Volume & Success Charts",
      content: "Visual bar and pie charts displaying message volumes per channel and percentage rate distributions. Click slices to filter contacts.",
      placement: "top",
      path: "/analytics"
    }
  ],
  settings: [
    {
      targetId: "tutorial-settings-welcome",
      title: "Integrations Center",
      content: "Connect and monitor your security-verified outreach networks. Set credentials, authentication, and API variables here.",
      placement: "bottom",
      path: "/settings"
    },
    {
      targetId: "tutorial-settings-google",
      title: "Google Auth & Drive Syncing",
      content: "Click here to securely connect Google Accounts to enable Gmail message sending and Drive attachment folder access.",
      placement: "bottom",
      path: "/settings"
    },
    {
      targetId: "tutorial-settings-whatsapp",
      title: "WhatsApp API Mapping",
      content: "Configure your phone number identifiers, system variables, and template tokens for target sequence dispatches.",
      placement: "top",
      path: "/settings"
    },
    {
      targetId: "tutorial-settings-instagram",
      title: "Instagram Bot Controller",
      content: "Define target usernames, passwords, and security codes to connect the scraper session for Direct Message automations.",
      placement: "top",
      path: "/settings"
    }
  ]
};

interface TutorialContextType {
  startTutorial: (pageId?: string) => void;
  isActive: boolean;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) throw new Error("useTutorial must be used within TutorialProvider");
  return context;
}

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [activeSteps, setActiveSteps] = useState<TutorialStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const startTutorial = (pageId?: string) => {
    let resolvedPage = pageId;
    if (!resolvedPage) {
      if (location.pathname === "/contacts") resolvedPage = "contacts";
      else if (location.pathname === "/controller") resolvedPage = "controller";
      else if (location.pathname === "/analytics") resolvedPage = "analytics";
      else if (location.pathname === "/settings") resolvedPage = "settings";
      else resolvedPage = "dashboard";
    }

    const steps = TUTORIAL_STEPS[resolvedPage] || TUTORIAL_STEPS.dashboard;
    setActiveSteps(steps);
    setIsActive(true);
    setCurrentStep(0);
    localStorage.setItem("hasSeenTutorial", "true");
  };

  useEffect(() => {
    // Show tutorial automatically on first visit after a slight delay
    // ONLY if the user is logged in and not on auth pages
    const hasSeen = localStorage.getItem("hasSeenTutorial");
    const isAuthPage = ["/login", "/signup", "/reset-password"].includes(location.pathname);
    
    if (!hasSeen && isTokenValid() && !isAuthPage) {
      const timer = setTimeout(() => {
        startTutorial();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!isActive || activeSteps.length === 0) return;

    const step = activeSteps[currentStep];
    
    // Check if we need to navigate to the correct page for this step
    if (step.path && location.pathname !== step.path) {
      navigate(step.path);
      return;
    }

    const updateRect = () => {
      const el = document.getElementById(step.targetId);
      if (el) {
        // Scroll into view gently if not visible
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        setTimeout(() => {
          const freshEl = document.getElementById(step.targetId);
          if (freshEl) {
             setTargetRect(freshEl.getBoundingClientRect());
          }
        }, 300); // wait for scroll
      } else {
        // If element not found, just center the modal
        setTargetRect(null);
      }
    };

    // Calculate rect after a tiny delay to ensure the page has loaded/rendered if navigating
    const timer = setTimeout(() => {
      updateRect();
    }, 150);

    window.addEventListener("resize", updateRect);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateRect);
    };
  }, [isActive, currentStep, activeSteps, location.pathname, navigate]);

  const handleNext = () => {
    if (currentStep < activeSteps.length - 1) setCurrentStep(c => c + 1);
    else setIsActive(false);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  const handleClose = () => {
    setIsActive(false);
    localStorage.setItem("hasSeenTutorial", "true");
  };

  return (
    <TutorialContext.Provider value={{ startTutorial, isActive }}>
      {children}
      {isActive && activeSteps.length > 0 && createPortal(
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* Backdrop with a hole cut out */}
          <div className="absolute inset-0 bg-black/60 pointer-events-auto transition-opacity duration-300" />

          {/* Highlighted Target */}
          {targetRect && (
            <div 
              className="absolute bg-transparent border-4 border-primary rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none transition-all duration-500 ease-out z-[10000]"
              style={{
                top: targetRect.top - 8,
                left: targetRect.left - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.5), 0 0 20px 5px rgba(139, 92, 246, 0.5)" // Primary is purple
              }}
            />
          )}

          {/* Tutorial Tooltip */}
          <div 
            className="absolute bg-background border border-border/50 rounded-2xl shadow-2xl p-6 w-[320px] pointer-events-auto transition-all duration-500 ease-out z-[10001]"
            style={{
              top: targetRect ? getTooltipTop(targetRect, activeSteps[currentStep].placement) : '50%',
              left: targetRect ? getTooltipLeft(targetRect, activeSteps[currentStep].placement) : '50%',
              transform: targetRect ? 'none' : 'translate(-50%, -50%)',
            }}
          >
             <button onClick={handleClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
               <X className="w-4 h-4" />
             </button>
             
             <div className="flex items-center gap-2 mb-3">
               <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                 <Sparkles className="w-4 h-4" />
               </div>
               <h3 className="font-black text-lg">{activeSteps[currentStep].title}</h3>
             </div>
             
             <p className="text-sm text-muted-foreground font-medium mb-6 leading-relaxed">
               {activeSteps[currentStep].content}
             </p>

             <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
               <span className="text-xs font-bold text-muted-foreground">
                 Step {currentStep + 1} of {activeSteps.length}
               </span>
               <div className="flex gap-2">
                 <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentStep === 0}>
                   <ChevronLeft className="w-4 h-4" />
                 </Button>
                 <Button variant="default" size="sm" onClick={handleNext} className="font-bold">
                   {currentStep === activeSteps.length - 1 ? "Finish" : <ChevronRight className="w-4 h-4" />}
                 </Button>
               </div>
             </div>
          </div>
        </div>,
        document.body
      )}
    </TutorialContext.Provider>
  );
}

// Positioning helpers
function getTooltipTop(rect: DOMRect, placement: string) {
  if (placement === "bottom") return rect.bottom + 20;
  if (placement === "top") return rect.top - 200; // rough height estimate
  return rect.top; // left/right align top
}

function getTooltipLeft(rect: DOMRect, placement: string) {
  if (placement === "right") return rect.right + 20;
  if (placement === "left") return rect.left - 340; // width + gap
  return rect.left; // top/bottom align left
}
