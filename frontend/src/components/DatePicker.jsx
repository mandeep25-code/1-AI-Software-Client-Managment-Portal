import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DatePicker({ value, onChange, placeholder = "Pick a date", testId }) {
  const date = value ? new Date(value) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          data-testid={testId}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-[#050505] border-white/10 hover:bg-white/5 rounded-sm",
            !date && "text-zinc-500"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-[#0A0A0A] border-white/10" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? d.toISOString() : null)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
