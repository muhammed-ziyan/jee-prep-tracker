import { useState } from "react";
import { useRevisionSchedule, useCreateRevision, useCompleteRevision } from "@/hooks/use-revision";
import { useSyllabus } from "@/hooks/use-syllabus";
import { format, isToday, isPast, addDays } from "date-fns";
import { Calendar as CalendarIcon, Check, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SubjectWithUnits } from "@shared/schema";

export default function Revision() {
  const { data: schedule, isLoading } = useRevisionSchedule();
  const { data: syllabus } = useSyllabus();
  const createRevision = useCreateRevision();
  const completeRevision = useCompleteRevision();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    topicId: "",
    scheduledDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    status: "not_started"
  });

  const subjects = (syllabus || []) as SubjectWithUnits[];
  
  // Flatten topics for selection
  const allTopics = subjects.flatMap(s => s.units.flatMap(u => u.topics.map(t => ({
    ...t,
    subjectName: s.name,
    unitName: u.name
  }))));

  const handleCreate = () => {
    createRevision.mutate({
      topicId: parseInt(newSchedule.topicId),
      scheduledDate: newSchedule.scheduledDate,
      status: "not_started"
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewSchedule({ ...newSchedule, topicId: "" });
      }
    });
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Revision</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Topic</Label>
                <Select value={newSchedule.topicId} onValueChange={(v) => setNewSchedule({ ...newSchedule, topicId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {allTopics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id.toString()}>
                        {topic.subjectName} - {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={newSchedule.scheduledDate} 
                  onChange={(e) => setNewSchedule({ ...newSchedule, scheduledDate: e.target.value })} 
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
