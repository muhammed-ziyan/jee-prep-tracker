import { useState } from "react";
import { useSyllabus, useSyllabusProgress, useUpdateProgress } from "@/hooks/use-syllabus";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubjectWithUnits, UserTopicProgress } from "@shared/schema";

export default function Syllabus() {
  const { data: syllabus, isLoading: isSyllabusLoading } = useSyllabus();
  const { data: progress, isLoading: isProgressLoading } = useSyllabusProgress();
  const updateProgress = useUpdateProgress();

  const [selectedTopic, setSelectedTopic] = useState<{ id: number; name: string } | null>(null);
  const [editForm, setEditForm] = useState<{ status: string; confidence: string; notes: string }>({
    status: "not_started",
    confidence: "medium",
    notes: ""
  });

  if (isSyllabusLoading || isProgressLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Helper to get progress for a topic
  const getTopicProgress = (topicId: number) => {
    return progress?.find(p => p.topicId === topicId);
  };

  const handleTopicClick = (topicId: number, topicName: string) => {
    const currentProgress = getTopicProgress(topicId);
    setSelectedTopic({ id: topicId, name: topicName });
    setEditForm({
      status: currentProgress?.status || "not_started",
      confidence: currentProgress?.confidence || "medium",
      notes: currentProgress?.notes || ""
    });
  };

  const handleSaveProgress = () => {
    if (!selectedTopic) return;
    updateProgress.mutate({
      topicId: selectedTopic.id,
      status: editForm.status as "not_started" | "in_progress" | "completed",
      confidence: editForm.confidence as "low" | "medium" | "high",
      notes: editForm.notes
    }, {
      onSuccess: () => setSelectedTopic(null)
    });
  };

  // Safe cast for syllabus data since we used z.any() in hook
  const subjects = (syllabus || []) as SubjectWithUnits[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Syllabus Tracker</h1>
          <p className="text-muted-foreground mt-1">Track your chapter-wise completion status.</p>
        </div>
      </div>

      <Tabs defaultValue={subjects[0]?.name} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 p-1 bg-muted/50 rounded-2xl mb-8">
          {subjects.map((subject) => (
            <TabsTrigger 
              key={subject.id} 
              value={subject.name}
              className="rounded-xl text-base font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
            >
              {subject.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {subjects.map((subject) => (
          <TabsContent key={subject.id} value={subject.name} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass-card rounded-2xl overflow-hidden">
              <Accordion type="multiple" className="w-full">
                {subject.units.map((unit) => (
                  <AccordionItem key={unit.id} value={`unit-${unit.id}`} className="border-b border-border/50 px-6 last:border-0">
                    <AccordionTrigger className="hover:no-underline py-6">
                      <div className="flex items-center gap-4 text-left">
                        <span className="font-semibold text-lg">{unit.name}</span>
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                          {unit.topics.length} topics
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {unit.topics.map((topic) => {
                          const p = getTopicProgress(topic.id);
                          const isCompleted = p?.status === "completed";
                          
                          return (
                            <div 
                              key={topic.id}
                              onClick={() => handleTopicClick(topic.id, topic.name)}
                              className={cn(
                                "p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between group",
                                isCompleted 
                                  ? "bg-green-50/50 border-green-200 hover:border-green-300 dark:bg-green-900/10 dark:border-green-900" 
                                  : "bg-background border-border hover:border-primary/50 hover:shadow-sm"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                {isCompleted ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
                                )}
                                <span className={cn("font-medium", isCompleted && "text-muted-foreground line-through")}>
                                  {topic.name}
                                </span>
                              </div>
                              {p?.confidence && (
                                <Badge variant="outline" className={cn(
                                  "capitalize ml-2",
                                  p.confidence === "high" ? "border-green-200 text-green-700 bg-green-50" :
                                  p.confidence === "medium" ? "border-yellow-200 text-yellow-700 bg-yellow-50" :
                                  "border-red-200 text-red-700 bg-red-50"
                                )}>
                                  {p.confidence}
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!selectedTopic} onOpenChange={(open) => !open && setSelectedTopic(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Progress: {selectedTopic?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Confidence Level</Label>
              <Select value={editForm.confidence} onValueChange={(v) => setEditForm({ ...editForm, confidence: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Need Revision</SelectItem>
                  <SelectItem value="medium">Medium - Comfortable</SelectItem>
                  <SelectItem value="high">High - Mastered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea 
                value={editForm.notes} 
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Important formulas, weak areas..."
                className="h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveProgress} disabled={updateProgress.isPending}>
              {updateProgress.isPending ? "Saving..." : "Save Progress"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
