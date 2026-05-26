import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { IngestionScheduleCard } from "./IngestionScheduleCard";
import { getOrCreateUserId } from "@/lib/utils";

export function AIScheduleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const userId = getOrCreateUserId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl glass-card border-white/10 p-0 overflow-hidden shadow-2xl rounded-[2.5rem]">
         <DialogHeader className="sr-only">
           <DialogTitle>AI Casting Radar Schedule</DialogTitle>
           <DialogDescription>Configure the schedule for the AI Casting Radar.</DialogDescription>
         </DialogHeader>
        {/* Render the card without padding constraints since DialogContent has p-0 */}
        <IngestionScheduleCard userId={userId} />
      </DialogContent>
    </Dialog>
  );
}
