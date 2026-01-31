import { useState, useMemo } from "react";
import { useBacklog, useCreateBacklog, useDeleteBacklog, useUpdateBacklog } from "@/hooks/use-backlog";
import { useSyllabus } from "@/hooks/use-syllabus";
import { AlertCircle, Trash2, CheckCircle, Circle, Plus, Layers, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { SubjectWithUnits } from "@shared/schema";

type BacklogScope = "unit" | "topic";

const initialForm = {
  scope: "unit" as BacklogScope,
  subjectId: "",
  unitId: "",
  topicIds: [] as string[],
  title: "",
  description: "",
  priority: "medium",
  type: "concept",
  deadline: "",
};

export default function Backlog() {
  const { data: items, isLoading } = useBacklog();
  const { data: syllabus } = useSyllabus();
  const createBacklog = useCreateBacklog();
  const updateBacklog = useUpdateBacklog();
  const deleteBacklog = useDeleteBacklog();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newItem, setNewItem] = useState(initialForm);

  const subjects = (syllabus || []) as SubjectWithUnits[];
  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id.toString() === newItem.subjectId),
    [subjects, newItem.subjectId]
  );
  const selectedUnit = useMemo(
    () => selectedSubject?.units.find((u) => u.id.toString() === newItem.unitId),
    [selectedSubject, newItem.unitId]
  );
  const topicsInUnit = useMemo(() => selectedUnit?.topics ?? [], [selectedUnit]);

  const unitWiseTitle = useMemo(() => {
    if (!selectedSubject || !selectedUnit) return "";
    return `${selectedSubject.name} - ${selectedUnit.name}`;
  }, [selectedSubject, selectedUnit]);

  const handleSubjectChange = (subjectId: string) => {
    setNewItem((prev) => ({ ...prev, subjectId, unitId: "", topicIds: [], title: prev.scope === "unit" ? "" : prev.title }));
  };
  const handleUnitChange = (unitId: string) => {
    setNewItem((prev) => ({ ...prev, unitId, topicIds: [], title: prev.scope === "unit" ? "" : prev.title }));
  };

  const canSubmitUnitWise =
    newItem.scope === "unit" &&
    newItem.subjectId &&
    newItem.unitId &&
    !!unitWiseTitle;
  const canSubmitTopicWise =
    newItem.scope === "topic" &&
    newItem.subjectId &&
    newItem.unitId &&
    newItem.topicIds.length > 0;

  const handleCreate = async () => {
    const basePayload = {
      description: newItem.description || undefined,
      priority: newItem.priority as "low" | "medium" | "high",
      type: newItem.type as "concept" | "practice" | "forgetting",
      deadline: newItem.deadline ? new Date(newItem.deadline).toISOString() : undefined,
    };

    if (newItem.scope === "unit") {
      createBacklog.mutate(
        {
          title: unitWiseTitle,
          topicId: undefined,
          ...basePayload,
        },
        {
          onSuccess: () => {
            setIsCreateOpen(false);
            setNewItem(initialForm);
          },
        }
      );
      return;
    }

    // Topic-wise: one card with all selected topics (topicIds array)
    const selectedTopics = topicsInUnit.filter((t) => newItem.topicIds.includes(t.id.toString()));
    const title = selectedTopics.map((t) => t.name).join(", ");
    const topicIds = selectedTopics.map((t) => t.id);

    createBacklog.mutate(
      {
        title,
        topicIds,
        ...basePayload,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setNewItem(initialForm);
        },
      }
    );
  };

  const toggleComplete = (id: number, currentStatus: boolean | null) => {
    updateBacklog.mutate({ id, isCompleted: !currentStatus });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Backlog & Weak Areas</h1>
          <p className="text-muted-foreground mt-1">Prioritize and eliminate your weaknesses.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20">
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="min-w-0 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add to Backlog</DialogTitle>
            </DialogHeader>
            <div className="grid min-w-0 gap-4 py-4">
              <div className="space-y-2">
                <Label>Backlog type</Label>
                <RadioGroup
                  value={newItem.scope}
                  onValueChange={(v) =>
                    setNewItem((prev) => ({
                      ...prev,
                      scope: v as BacklogScope,
                      topicIds: [],
                      title: v === "unit" ? (prev.subjectId && prev.unitId ? "" : prev.title) : prev.title,
                    }))
                  }
                  className="flex gap-4"
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="unit" />
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span>Unit-wise</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="topic" />
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>Topic-wise</span>
                  </label>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={newItem.subjectId} onValueChange={handleSubjectChange}>
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
                <Label>Unit</Label>
                <Select
                  value={newItem.unitId}
                  onValueChange={handleUnitChange}
                  disabled={!newItem.subjectId}
                >
                  <SelectTrigger className="min-w-0">
                    <SelectValue placeholder={newItem.subjectId ? "Select unit" : "Select subject first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSubject?.units.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.name}
                      </SelectItem>
                    )) ?? []}
                  </SelectContent>
                </Select>
              </div>

              {newItem.scope === "topic" && newItem.unitId && (
                <div className="space-y-2">
                  <Label>Topics (select one or more)</Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2 bg-muted/30">
                    {topicsInUnit.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No topics in this unit.</p>
                    ) : (
                      topicsInUnit.map((topic) => (
                        <label
                          key={topic.id}
                          className="flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={newItem.topicIds.includes(topic.id.toString())}
                            onCheckedChange={(checked) => {
                              setNewItem((prev) => {
                                const next = checked
                                  ? [...prev.topicIds, topic.id.toString()]
                                  : prev.topicIds.filter((id) => id !== topic.id.toString());
                                return { ...prev, topicIds: next };
                              });
                            }}
                          />
                          <span className="text-sm">{topic.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newItem.priority} onValueChange={(v) => setNewItem({ ...newItem, priority: v })}>
                    <SelectTrigger className="min-w-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newItem.type} onValueChange={(v) => setNewItem({ ...newItem, type: v })}>
                    <SelectTrigger className="min-w-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concept">Concept Clarity</SelectItem>
                      <SelectItem value="practice">Practice Gap</SelectItem>
                      <SelectItem value="forgetting">Forgetting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Notes, weak areas..."
                />
              </div>

              <div className="space-y-2">
                <Label>Target Date (Optional)</Label>
                <Input
                  type="date"
                  value={newItem.deadline}
                  onChange={(e) => setNewItem({ ...newItem, deadline: e.target.value })}
                />
              </div>
            </div>
            <Button
              onClick={handleCreate}
              disabled={
                createBacklog.isPending ||
                !(canSubmitUnitWise || canSubmitTopicWise)
              }
              className="w-full"
            >
              Add to Backlog
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items?.map((item) => (
          <div
            key={item.id}
            className={cn(
              "p-6 rounded-2xl border shadow-sm transition-all relative group bg-card",
              item.isCompleted ? "opacity-60 grayscale" : "hover:shadow-md hover:-translate-y-1"
            )}
          >
            <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize",
                    item.priority === "high" ? "bg-red-100 text-red-700 border-red-200" :
                    item.priority === "medium" ? "bg-orange-100 text-orange-700 border-orange-200" :
                    "bg-blue-100 text-blue-700 border-blue-200"
                  )}
                >
                  {item.priority} Priority
                </Badge>
                {(item.topicIds?.length ?? (item.topicId ? 1 : 0)) > 1 && (
                  <Badge variant="secondary" className="bg-muted/80">
                    {(item.topicIds?.length ?? 1)} topics
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive -mr-2"
                onClick={() => deleteBacklog.mutate(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <h3 className={cn("text-lg font-bold mb-2", item.isCompleted && "line-through")}>{item.title}</h3>
            <p className="text-sm text-muted-foreground mb-6 line-clamp-3">{item.description}</p>

            <div className="flex items-center justify-between mt-auto">
              <Badge variant="secondary" className="capitalize bg-muted text-muted-foreground">
                {item.type}
              </Badge>

              <Button
                size="sm"
                variant={item.isCompleted ? "outline" : "default"}
                className={cn("gap-2", item.isCompleted && "text-green-600 border-green-200")}
                onClick={() => toggleComplete(item.id, item.isCompleted)}
              >
                {item.isCompleted ? (
                  <><CheckCircle className="h-4 w-4" /> Done</>
                ) : (
                  <><Circle className="h-4 w-4" /> Mark Done</>
                )}
              </Button>
            </div>

            {item.deadline && (
              <div className="absolute top-0 right-0 p-3">
                {/* Could show deadline badge here */}
              </div>
            )}
          </div>
        ))}

        {items?.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-3xl bg-muted/10">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold">All clear!</h3>
            <p className="text-muted-foreground mt-2">You have no backlog items. Great job!</p>
          </div>
        )}
      </div>
    </div>
  );
}
