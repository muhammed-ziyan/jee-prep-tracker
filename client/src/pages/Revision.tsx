import { useState, useMemo } from "react";
import { useRevisionSchedule, useCreateRevision, useCompleteRevision } from "@/hooks/use-revision";
import { useSyllabus } from "@/hooks/use-syllabus";
import { format, isToday, isPast, addDays } from "date-fns";
import { Calendar as CalendarIcon, CalendarClock, Check, Plus, Clock, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SubjectWithUnits } from "@shared/schema";

const DATE_PRESETS = [
  { label: "Tomorrow", days: 1 },
  { label: "3 days from today", days: 3 },
  { label: "1 week from today", days: 7 },
  { label: "2 weeks from today", days: 14 },
  { label: "3 weeks from today", days: 21 },
] as const;

export default function Revision() {
  const { data: schedule, isLoading } = useRevisionSchedule();
  const { data: syllabus } = useSyllabus();
  const createRevision = useCreateRevision();
  const completeRevision = useCompleteRevision();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [topicComboboxOpen, setTopicComboboxOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    subjectId: "",
    topicId: "",
    scheduledDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    status: "not_started"
  });

  const subjects = (syllabus || []) as SubjectWithUnits[];

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id.toString() === newSchedule.subjectId),
    [subjects, newSchedule.subjectId]
  );

  // Topics only for the selected subject (for the topic combobox)
  const topicsForSubject = useMemo(() => {
    if (!selectedSubject) return [];
    return selectedSubject.units.flatMap((u) =>
      u.topics.map((t) => ({ ...t, unitName: u.name }))
    );
  }, [selectedSubject]);

  const selectedTopic = useMemo(
    () => topicsForSubject.find((t) => t.id.toString() === newSchedule.topicId),
    [topicsForSubject, newSchedule.topicId]
  );

  const handleCreate = () => {
    createRevision.mutate(
      {
        topicId: parseInt(newSchedule.topicId),
        scheduledDate: newSchedule.scheduledDate,
        status: "not_started",
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setNewSchedule({
            subjectId: "",
            topicId: "",
            scheduledDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
            status: "not_started",
          });
        },
      }
    );
  };

  const handleSubjectChange = (subjectId: string) => {
    setNewSchedule((prev) => ({ ...prev, subjectId, topicId: "" }));
    setTopicComboboxOpen(false);
  };

  if (isLoading) return <div>Loading...</div>;

  const sortedSchedule = [...(schedule || [])].sort((a, b) => 
    new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Revision Schedule</h1>
          <p className="text-muted-foreground mt-1">Spaced repetition to retain what you learn.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Schedule Revision
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule New Revision</DialogTitle>
            </DialogHeader>
            <div className="grid min-w-0 gap-4 py-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={newSchedule.subjectId}
                  onValueChange={handleSubjectChange}
                >
                  <SelectTrigger className="min-w-0">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <Popover open={topicComboboxOpen} onOpenChange={setTopicComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={topicComboboxOpen}
                      disabled={!newSchedule.subjectId}
                      className="w-full min-w-0 justify-between gap-2 font-normal overflow-visible"
                    >
                      <span className="min-w-0 overflow-hidden text-left">
                        {selectedTopic ? (
                          <>
                            {selectedTopic.unitName ? (
                              <span className="text-muted-foreground text-xs mr-1 shrink-0">{selectedTopic.unitName} → </span>
                            ) : null}
                            <span className="block truncate text-ellipsis">{selectedTopic.name}</span>
                          </>
                        ) : (
                          newSchedule.subjectId ? "Select topic (type to search)..." : "Select a subject first"
                        )}
                      </span>
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Type to search topic..." />
                      <CommandList>
                        <CommandEmpty>No topic found.</CommandEmpty>
                        {topicsForSubject.map((topic) => (
                          <CommandItem
                            key={topic.id}
                            value={`${topic.unitName} ${topic.name}`}
                            onSelect={() => {
                              setNewSchedule((prev) => ({ ...prev, topicId: topic.id.toString() }));
                              setTopicComboboxOpen(false);
                            }}
                          >
                            <span className="text-muted-foreground text-xs mr-2">{topic.unitName}</span>
                            {topic.name}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <div className="flex flex-wrap gap-2">
                  {DATE_PRESETS.map((preset) => {
                    const presetDate = format(addDays(new Date(), preset.days), "yyyy-MM-dd");
                    const isActive = newSchedule.scheduledDate === presetDate;
                    return (
                      <Button
                        key={preset.days}
                        type="button"
                        variant={isActive ? "secondary" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          setNewSchedule((prev) => ({ ...prev, scheduledDate: presetDate }))
                        }
                      >
                        {preset.label}
                      </Button>
                    );
                  })}
                </div>
                <Input
                  type="date"
                  value={newSchedule.scheduledDate}
                  onChange={(e) =>
                    setNewSchedule((prev) => ({ ...prev, scheduledDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={!newSchedule.topicId || createRevision.isPending}>
              Schedule
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sortedSchedule.map((item) => {
          const date = new Date(item.scheduledDate);
          const isOverdue = isPast(date) && !isToday(date) && item.status !== "completed";
          const isTodayTask = isToday(date);

          return (
            <div 
              key={item.id} 
              className={cn(
                "flex items-center justify-between p-4 rounded-xl border bg-card transition-all",
                item.status === "completed" ? "opacity-60 bg-muted/20" : "hover:shadow-md",
                isOverdue && "border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center border-2",
                  item.status === "completed" ? "bg-green-100 border-green-200 text-green-600" :
                  isOverdue ? "bg-red-100 border-red-200 text-red-600" :
                  "bg-blue-100 border-blue-200 text-blue-600"
                )}>
                  {item.status === "completed" ? <Check className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                </div>
                <div>
                  <h4 className={cn("font-bold text-lg", item.status === "completed" && "line-through text-muted-foreground")}>
                    {item.topic?.name || "Unknown Topic"}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    <span className={cn(
                      isOverdue && "text-red-600 font-medium",
                      isTodayTask && "text-blue-600 font-medium"
                    )}>
                      {isTodayTask ? "Today" : format(date, "MMMM d, yyyy")}
                    </span>
                    {isOverdue && <Badge variant="destructive" className="h-5 text-[10px]">Overdue</Badge>}
                  </div>
                </div>
              </div>

              {item.status !== "completed" && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                  onClick={() => completeRevision.mutate(item.id)}
                  disabled={completeRevision.isPending}
                >
                  Mark Done
                </Button>
              )}
            </div>
          );
        })}
        
        {sortedSchedule.length === 0 && (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
            <CalendarClock className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No revision scheduled</h3>
            <p className="text-muted-foreground">Add topics to your spaced repetition schedule.</p>
          </div>
        )}
      </div>
    </div>
  );
}
