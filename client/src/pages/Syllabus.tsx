"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSyllabus, useSyllabusProgress, useUpdateProgress, type SyllabusScope } from "@/hooks/use-syllabus";
import { api } from "@shared/routes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, Circle, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubjectWithUnits, UserTopicProgress, Topic } from "@shared/schema";

type StatusFilter = "all" | "not_started" | "in_progress" | "completed";
type ConfidenceFilter = "all" | "low_only";

export default function Syllabus() {
  const queryClient = useQueryClient();
  const [syllabusScope, setSyllabusScope] = useState<SyllabusScope>("whole");
  const { data: syllabus, isLoading: isSyllabusLoading } = useSyllabus(syllabusScope);
  const { data: progress, isLoading: isProgressLoading } = useSyllabusProgress();
  const updateProgress = useUpdateProgress();

  const [selectedTopic, setSelectedTopic] = useState<{ id: number; name: string } | null>(null);
  const [editForm, setEditForm] = useState<{ status: string; confidence: string; notes: string }>({
    status: "not_started",
    confidence: "medium",
    notes: ""
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("all");

  const subjects = (syllabus || []) as SubjectWithUnits[];

  const getTopicProgress = (topicId: number) => progress?.find((p) => p.topicId === topicId);

  if (isSyllabusLoading || isProgressLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const topicMatchesFilter = (topic: Topic) => {
    const p = getTopicProgress(topic.id);
    const status = p?.status ?? "not_started";
    if (statusFilter !== "all" && status !== statusFilter) return false;
    if (confidenceFilter === "low_only" && (p?.confidence ?? "medium") !== "low") return false;
    return true;
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
    updateProgress.mutate(
      {
        topicId: selectedTopic.id,
        status: editForm.status as "not_started" | "in_progress" | "completed",
        confidence: editForm.confidence as "low" | "medium" | "high",
        notes: editForm.notes
      },
      {
        onSuccess: async () => {
          await Promise.all([
            queryClient.refetchQueries({ queryKey: [api.syllabus.getProgress.path] }),
            queryClient.refetchQueries({ queryKey: [api.dashboard.stats.path] })
          ]);
          setSelectedTopic(null);
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Syllabus Tracker</h1>
          <p className="text-muted-foreground mt-1">
            JEE Main official syllabus — tick topics, add confidence and notes. Progress updates across the app.
          </p>
        </div>

        {/* Syllabus scope: Whole / Class 11 / Class 12 */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={syllabusScope} onValueChange={(v) => setSyllabusScope(v as SyllabusScope)}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Syllabus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="whole">Whole syllabus</SelectItem>
              <SelectItem value="class_11">Class 11</SelectItem>
              <SelectItem value="class_12">Class 12</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="not_started">Not started</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="completed">Done</SelectItem>
            </SelectContent>
          </Select>
          <Select value={confidenceFilter} onValueChange={(v) => setConfidenceFilter(v as ConfidenceFilter)}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder="Confidence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All confidence</SelectItem>
              <SelectItem value="low_only">Low confidence only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue={subjects[0]?.name} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 p-1 bg-muted/50 rounded-2xl mb-6">
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
                {subject.units.map((unit) => {
                  const unitTopics = unit.topics.filter(topicMatchesFilter);
                  const unitTotal = unit.topics.length;
                  const unitDone = unit.topics.filter((t) => getTopicProgress(t.id)?.status === "completed").length;
                  const unitPct = unitTotal ? Math.round((unitDone / unitTotal) * 100) : 0;

                  return (
                    <AccordionItem key={unit.id} value={`unit-${unit.id}`} className="border-b border-border/50 px-6 last:border-0">
                      <AccordionTrigger className="hover:no-underline py-6">
                        <div className="flex flex-col gap-3 text-left w-full pr-4">
                          <span className="font-semibold text-lg">{unit.name}</span>
                          {/* Unit-level progress bar */}
                          <div className="flex items-center gap-3">
                            <Progress value={unitPct} className="h-2 flex-1 rounded-full max-w-[240px]" />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {unitDone}/{unitTotal} done
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-6 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(statusFilter !== "all" || confidenceFilter !== "all" ? unitTopics : unit.topics).map((topic) => {
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
                                <div className="flex items-center gap-3 min-w-0">
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
                                  )}
                                  <span className={cn("font-medium truncate", isCompleted && "text-muted-foreground line-through")}>
                                    {topic.name}
                                  </span>
                                </div>
                                {p?.confidence && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "capitalize ml-2 flex-shrink-0",
                                      p.confidence === "high" ? "border-green-200 text-green-700 bg-green-50" :
                                      p.confidence === "medium" ? "border-yellow-200 text-yellow-700 bg-yellow-50" :
                                      "border-red-200 text-red-700 bg-red-50"
                                    )}
                                  >
                                    {p.confidence}
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {(statusFilter !== "all" || confidenceFilter !== "all") && unitTopics.length === 0 && (
                          <p className="text-sm text-muted-foreground py-4">No topics match the current filters.</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!selectedTopic} onOpenChange={(open) => !open && setSelectedTopic(null)}>
        <DialogContent className="sm:max-w-[425px] min-w-0">
          <DialogHeader className="min-w-0">
            <DialogTitle className="truncate pr-8">Update Progress: {selectedTopic?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid min-w-0 gap-6 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger className="min-w-0">
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
                <SelectTrigger className="min-w-0">
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
