import React, { createContext, useContext, useState, useEffect, useRef } from "react";
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

const STEPS: TutorialStep[] = [
  {
    targetId: "tutorial-contacts-nav",
    title: "Welcome to CastHub!",
    content: "Let's take a quick tour. This is your Contacts page, where you import and manage all your talent data.",
    placement: "right",
    path: "/contacts"
  },
  {
    targetId: "tutorial-add-contact",
    title: "Add Contacts",
    content: "Click here to manually add a new contact or create custom text for different platforms.",
    placement: "left",
    path: "/contacts"
  },
  {
    targetId: "tutorial-grid",
    title: "Excel-like Grid",
    content: "Right-click ANY cell to color-code it! Hover over a cell and drag the bottom right corner to auto-fill down.",
    placement: "top",
    path: "/contacts"
  },
  {
    targetId: "tutorial-controller-nav",
    title: "The Controller",
    content: "This is where the magic happens. You can link your Google Drive, Instagram, and WhatsApp here.",
    placement: "right",
    path: "/controller"
  },
  {
    targetId: "tutorial-automation-run",
    title: "Run Automation",
    content: "Once your accounts are linked, click this button to fire off your automated outreach sequences.",
    placement: "left",
    path: "/controller"
  },
  {
    targetId: "tutorial-restart-btn",
    title: "Need a refresher?",
    content: "You can click this button anytime to restart this tutorial. Happy automating!",
    placement: "right",
    path: "/controller"
  }
];

interface TutorialContextType {
  startTutorial: () => void;
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
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const startTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
    // Persist that they have seen it
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
    if (!isActive) return;

    const step = STEPS[currentStep];
    
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
  }, [isActive, currentStep, location.pathname, navigate]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(c => c + 1);
    else setIsActive(false);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  const handleClose = () => {
    setIsActive(false);
  };

  return (
    <TutorialContext.Provider value={{ startTutorial, isActive }}>
      {children}
      {isActive && createPortal(
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* Backdrop with a hole cut out (simulated via drop-shadow or a complex clip-path) */}
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
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.5), 0 0 20px 5px rgba(139, 92, 246, 0.5)" // Assuming primary is purple
              }}
            />
          )}

          {/* Tutorial Tooltip */}
          <div 
            className="absolute bg-background border border-border/50 rounded-2xl shadow-2xl p-6 w-[320px] pointer-events-auto transition-all duration-500 ease-out z-[10001]"
            style={{
              top: targetRect ? getTooltipTop(targetRect, STEPS[currentStep].placement) : '50%',
              left: targetRect ? getTooltipLeft(targetRect, STEPS[currentStep].placement) : '50%',
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
               <h3 className="font-black text-lg">{STEPS[currentStep].title}</h3>
             </div>
             
             <p className="text-sm text-muted-foreground font-medium mb-6 leading-relaxed">
               {STEPS[currentStep].content}
             </p>

             <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
               <span className="text-xs font-bold text-muted-foreground">
                 Step {currentStep + 1} of {STEPS.length}
               </span>
               <div className="flex gap-2">
                 <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentStep === 0}>
                   <ChevronLeft className="w-4 h-4" />
                 </Button>
                 <Button variant="default" size="sm" onClick={handleNext} className="font-bold">
                   {currentStep === STEPS.length - 1 ? "Finish" : <ChevronRight className="w-4 h-4" />}
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
