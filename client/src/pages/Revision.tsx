import { useState, useMemo, useCallback } from "react";
import { useRevisionSchedule, useCreateRevisions, useCompleteRevisionSession, useDeleteRevisionSession } from "@/hooks/use-revision";
import { useRevisionNotificationPermission } from "@/hooks/use-revision-notifications";
import { useSyllabus } from "@/hooks/use-syllabus";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isPast, addDays } from "date-fns";
import { Calendar as CalendarIcon, CalendarClock, Check, Plus, Clock, Bell, BellOff, ChevronRight, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const createRevisions = useCreateRevisions();
  const completeRevisionSession = useCompleteRevisionSession();
  const deleteRevisionSession = useDeleteRevisionSession();
  const { toast } = useToast();
  const { permission: notificationPermission, requestPermission } = useRevisionNotificationPermission();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewDetailsDate, setViewDetailsDate] = useState<string | null>(null);
  const [newSchedule, setNewSchedule] = useState({
    subjectId: "",
    selectedTopicIds: new Set<number>(),
    scheduledDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
  });

  const subjects = (syllabus || []) as SubjectWithUnits[];

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id.toString() === newSchedule.subjectId),
    [subjects, newSchedule.subjectId]
  );

  const unitsWithTopics = useMemo(
    () => selectedSubject?.units ?? [],
    [selectedSubject]
  );

  // Map unitId -> { name, order } from syllabus for grouping topics in view-details popup
  const unitMap = useMemo(() => {
    const map: Record<number, { name: string; order: number }> = {};
    subjects.forEach((s) =>
      (s.units ?? []).forEach((u) => {
        map[u.id] = { name: u.name, order: u.order };
      })
    );
    return map;
  }, [subjects]);

  const selectedTopicIds = newSchedule.selectedTopicIds;
  const setSelectedTopicIds = useCallback((updater: (prev: Set<number>) => Set<number>) => {
    setNewSchedule((prev) => ({ ...prev, selectedTopicIds: updater(prev.selectedTopicIds) }));
  }, []);

  const toggleTopic = useCallback((topicId: number) => {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }, [setSelectedTopicIds]);

  const toggleUnit = useCallback((unit: { topics: { id: number }[] }) => {
    const topicIds = unit.topics.map((t) => t.id);
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      const allSelected = topicIds.every((id) => next.has(id));
      if (allSelected) topicIds.forEach((id) => next.delete(id));
      else topicIds.forEach((id) => next.add(id));
      return next;
    });
  }, [setSelectedTopicIds]);

  const isUnitFullySelected = useCallback(
    (unit: { topics: { id: number }[] }) => unit.topics.length > 0 && unit.topics.every((t) => selectedTopicIds.has(t.id)),
    [selectedTopicIds]
  );
  const isUnitPartiallySelected = useCallback(
    (unit: { topics: { id: number }[] }) => {
      const count = unit.topics.filter((t) => selectedTopicIds.has(t.id)).length;
      return count > 0 && count < unit.topics.length;
    },
    [selectedTopicIds]
  );

  const handleCreate = () => {
    const topicIds = Array.from(selectedTopicIds);
    if (topicIds.length === 0) return;
    createRevisions.mutate(
      { topicIds, scheduledDate: newSchedule.scheduledDate },
      {
        onSuccess: (_, vars) => {
          setIsCreateOpen(false);
          setNewSchedule({
            subjectId: "",
            selectedTopicIds: new Set<number>(),
            scheduledDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
          });
          toast({
            title: "Revisions scheduled",
            description: `${vars.topicIds.length} topic${vars.topicIds.length > 1 ? "s" : ""} added. We'll remind you when they're due.`,
            variant: "success",
          });
        },
      }
    );
  };

  const handleEnableNotifications = async () => {
    const result = await requestPermission();
    if (result === "granted") {
      toast({ title: "Notifications enabled", description: "You'll get a reminder when revisions are due.", variant: "success" });
    } else if (result === "denied") {
      toast({ title: "Notifications blocked", variant: "destructive", description: "Enable them in your browser settings to get reminders." });
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setNewSchedule((prev) => ({ ...prev, subjectId, selectedTopicIds: new Set<number>() }));
  };

  if (isLoading) return <div>Loading...</div>;

  type ScheduleItem = (typeof schedule)[number];
  const rawSchedule = schedule ?? [];

  // Sort: incomplete first (by date asc), then completed (by date asc). So "completed or later dates" listed below.
  const sortedItems = [...rawSchedule].sort((a, b) => {
    const aDone = a.status === "completed" ? 1 : 0;
    const bDone = b.status === "completed" ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
  });

  // Group by scheduledDate (one card per revision session)
  const sessionsByDate = sortedItems.reduce<Record<string, ScheduleItem[]>>((acc, item) => {
    const d = item.scheduledDate;
    if (!acc[d]) acc[d] = [];
    acc[d].push(item);
    return acc;
  }, {});
  const sessionDates = [...new Set(sortedItems.map((i) => i.scheduledDate))];

  // All units with their topic id sets (from syllabus)
  const unitsWithTopicSets = useMemo(() => {
    return subjects.flatMap((s) =>
      (s.units ?? []).map((u) => ({
        unitId: u.id,
        topicIds: new Set(u.topics.map((t) => t.id)),
      }))
    );
  }, [subjects]);

  // For a session's items, return { displayAsUnits: boolean, count: number } for card title
  const getSessionDisplay = useCallback(
    (items: ScheduleItem[]): { displayAsUnits: boolean; count: number } => {
      const sessionTopicIds = new Set(items.map((i) => i.topicId));
      if (sessionTopicIds.size === 0) return { displayAsUnits: false, count: 0 };
      const fullUnits = unitsWithTopicSets.filter((u) => {
        if (u.topicIds.size === 0) return false;
        return [...u.topicIds].every((tid) => sessionTopicIds.has(tid));
      });
      const coveredByFullUnits = new Set(fullUnits.flatMap((u) => [...u.topicIds]));
      const sessionFullyCoveredByUnits =
        sessionTopicIds.size === coveredByFullUnits.size &&
        [...sessionTopicIds].every((tid) => coveredByFullUnits.has(tid));
      if (sessionFullyCoveredByUnits && fullUnits.length > 0) {
        return { displayAsUnits: true, count: fullUnits.length };
      }
      return { displayAsUnits: false, count: items.length };
    },
    [unitsWithTopicSets]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Revision Schedule</h1>
          <p className="text-muted-foreground mt-1">Spaced repetition to retain what you learn.</p>
        </div>
        <div className="flex items-center gap-2">
          {typeof notificationPermission !== "undefined" && notificationPermission !== "granted" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleEnableNotifications}
              disabled={notificationPermission === "denied"}
            >
              {notificationPermission === "denied" ? (
                <BellOff className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              {notificationPermission === "denied" ? "Notifications blocked" : "Enable reminders"}
            </Button>
          )}
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
              {selectedSubject && (
                <div className="space-y-2">
                  <Label>Topics & units</Label>
                  <p className="text-xs text-muted-foreground">
                    Add whole units or pick individual topics. {selectedTopicIds.size > 0 && (
                      <span className="font-medium text-foreground">{selectedTopicIds.size} topic{selectedTopicIds.size !== 1 ? "s" : ""} selected</span>
                    )}
                  </p>
                  <ScrollArea className="h-[220px] rounded-md border p-2">
                    <div className="space-y-1">
                      {unitsWithTopics.map((unit) => (
                        <Collapsible key={unit.id} className="group/unit">
                          <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
                            <CollapsibleTrigger asChild>
                              <button type="button" className="flex items-center gap-1.5 min-w-0 flex-1 text-left">
                                <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]/unit:rotate-90" />
                                <span className="truncate font-medium text-sm">{unit.name}</span>
                              </button>
                            </CollapsibleTrigger>
                            <Checkbox
                              checked={isUnitFullySelected(unit) ? true : isUnitPartiallySelected(unit) ? "indeterminate" : false}
                              onCheckedChange={() => toggleUnit(unit)}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Add whole unit: ${unit.name}`}
                              className="shrink-0"
                            />
                          </div>
                          <CollapsibleContent>
                            <div className="pl-6 pr-2 pb-2 space-y-1">
                              {unit.topics.map((topic) => (
                                <label
                                  key={topic.id}
                                  className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted/50 cursor-pointer"
                                >
                                  <Checkbox
                                    checked={selectedTopicIds.has(topic.id)}
                                    onCheckedChange={() => toggleTopic(topic.id)}
                                    aria-label={topic.name}
                                    className="shrink-0"
                                  />
                                  <span className="text-sm truncate">{topic.name}</span>
                                </label>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
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
            <Button onClick={handleCreate} disabled={selectedTopicIds.size === 0 || createRevisions.isPending}>
              Schedule {selectedTopicIds.size > 0 ? `${selectedTopicIds.size} topic${selectedTopicIds.size > 1 ? "s" : ""}` : ""}
            </Button>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {sessionDates.map((scheduledDate) => {
          const items = sessionsByDate[scheduledDate] ?? [];
          const date = new Date(scheduledDate);
          const allCompleted = items.every((i) => i.status === "completed");
          const isOverdue = isPast(date) && !isToday(date) && !allCompleted;
          const isTodayTask = isToday(date);

          return (
            <div
              key={scheduledDate}
              className={cn(
                "rounded-xl border bg-card transition-all overflow-hidden",
                allCompleted ? "opacity-70 bg-muted/20" : "hover:shadow-md",
                isOverdue && "border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900"
              )}
            >
              <div className="flex items-start justify-between gap-4 p-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className={cn(
                    "h-12 w-12 shrink-0 rounded-full flex items-center justify-center border-2",
                    allCompleted ? "bg-green-100 border-green-200 text-green-600" :
                    isOverdue ? "bg-red-100 border-red-200 text-red-600" :
                    "bg-blue-100 border-blue-200 text-blue-600"
                  )}>
                    {allCompleted ? <Check className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <CalendarIcon className="h-3 w-3 shrink-0" />
                      <span className={cn(
                        isOverdue && "text-red-600 font-medium",
                        isTodayTask && "text-blue-600 font-medium"
                      )}>
                        {isTodayTask ? "Today" : format(date, "MMMM d, yyyy")}
                      </span>
                      {isOverdue && <Badge variant="destructive" className="h-5 text-[10px]">Overdue</Badge>}
                    </div>
                    <h4 className={cn("font-bold text-lg", allCompleted && "text-muted-foreground")}>
                      {(() => {
                        const { displayAsUnits, count } = getSessionDisplay(items);
                        return displayAsUnits ? `${count} unit${count !== 1 ? "s" : ""}` : `${count} topic${count !== 1 ? "s" : ""}`;
                      })()}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 gap-1.5 text-muted-foreground hover:text-foreground h-8 px-2"
                      aria-label="View topic list"
                      onClick={() => setViewDetailsDate(scheduledDate)}
                    >
                      <Eye className="h-4 w-4" />
                      <span>View details</span>
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!allCompleted && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                      onClick={() =>
                        completeRevisionSession.mutate(
                          { scheduledDate },
                          { onSuccess: () => toast({ title: "Revision session completed", description: "Great job keeping up with spaced repetition.", variant: "success" }) }
                        )
                      }
                      disabled={completeRevisionSession.isPending}
                    >
                      Mark Done
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() =>
                      deleteRevisionSession.mutate(
                        { scheduledDate },
                        {
                          onSuccess: (data) => toast({ title: "Session removed", description: `${data.deleted} topic${data.deleted !== 1 ? "s" : ""} removed from schedule.`, variant: "success" }),
                          onError: () => toast({ title: "Could not delete", variant: "destructive" }),
                        }
                      )
                    }
                    disabled={deleteRevisionSession.isPending}
                    aria-label="Delete revision session"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {sessionDates.length === 0 && (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
            <CalendarClock className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No revision scheduled</h3>
            <p className="text-muted-foreground">Add topics to your spaced repetition schedule.</p>
          </div>
        )}
      </div>

      <Dialog open={viewDetailsDate !== null} onOpenChange={(open) => !open && setViewDetailsDate(null)}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {viewDetailsDate
                ? format(new Date(viewDetailsDate), "EEEE, MMMM d, yyyy")
                : "Revision details"}
            </DialogTitle>
          </DialogHeader>
          {viewDetailsDate && (() => {
            const detailItems = sessionsByDate[viewDetailsDate] ?? [];
            const byUnit = detailItems.reduce<Record<number, typeof detailItems>>((acc, item) => {
              const unitId = item.topic?.unitId ?? 0;
              if (!acc[unitId]) acc[unitId] = [];
              acc[unitId].push(item);
              return acc;
            }, {});
            const unitIds = Object.keys(byUnit).map(Number).sort((a, b) => (unitMap[a]?.order ?? a) - (unitMap[b]?.order ?? b));
            return (
              <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="space-y-5">
                  {unitIds.map((unitId) => (
                    <div key={unitId}>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1.5 mb-2">
                        {unitMap[unitId]?.name ?? `Unit ${unitId}`}
                      </h4>
                      <ul className="space-y-2">
                        {byUnit[unitId].map((item) => (
                          <li
                            key={item.id}
                            className={cn(
                              "flex items-center gap-2 text-sm",
                              item.status === "completed" && "text-muted-foreground line-through"
                            )}
                          >
                            {item.status === "completed" ? (
                              <Check className="h-4 w-4 shrink-0 text-green-600" />
                            ) : (
                              <span className="h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/30" aria-hidden />
                            )}
                            <span>{item.topic?.name ?? "Unknown Topic"}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
