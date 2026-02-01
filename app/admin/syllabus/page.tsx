"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Pencil, Trash2, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Subject, Unit, Topic } from "@shared/types";

type SubjectWithUnits = Subject & { units: (Unit & { topics: Topic[] })[] };

function fetchSyllabus(): Promise<SubjectWithUnits[]> {
  return fetch("/api/admin/syllabus", { credentials: "include" }).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch syllabus");
    return r.json();
  });
}

export default function AdminSyllabusPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: syllabus, isLoading } = useQuery({
    queryKey: ["/api/admin/syllabus"],
    queryFn: fetchSyllabus,
  });
  const [subjectDialog, setSubjectDialog] = useState<"add" | { edit: Subject } | null>(null);
  const [unitDialog, setUnitDialog] = useState<{ subjectId: number; add: true } | { unit: Unit } | null>(null);
  const [topicDialog, setTopicDialog] = useState<{ unitId: number; add: true } | { topic: Topic } | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: "", color: "#6366f1" });
  const [unitForm, setUnitForm] = useState({ name: "", order: 0 });
  const [topicForm, setTopicForm] = useState({
    name: "",
    order: 0,
    isImportant: false,
    weightage: "",
    isClass11: true,
    isClass12: true,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/syllabus"] });

  const createSubject = useMutation({
    mutationFn: async (body: { name: string; color: string }) => {
      const r = await fetch("/api/admin/syllabus/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message ?? "Failed");
      }
      return r.json();
    },
    onSuccess: () => {
      invalidate();
      setSubjectDialog(null);
      toast({ title: "Subject created" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const updateSubject = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: { name?: string; color?: string } }) => {
      const r = await fetch(`/api/admin/syllabus/subjects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message ?? "Failed");
      }
      return r.json();
    },
    onSuccess: () => {
      invalidate();
      setSubjectDialog(null);
      toast({ title: "Subject updated" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteSubject = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/admin/syllabus/subjects/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Subject deleted" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const createUnit = useMutation({
    mutationFn: async ({ subjectId, body }: { subjectId: number; body: { name: string; order: number } }) => {
      const r = await fetch(`/api/admin/syllabus/subjects/${subjectId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message ?? "Failed");
      }
      return r.json();
    },
    onSuccess: () => {
      invalidate();
      setUnitDialog(null);
      toast({ title: "Unit created" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const updateUnit = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: { name?: string; order?: number } }) => {
      const r = await fetch(`/api/admin/syllabus/units/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message ?? "Failed");
      }
      return r.json();
    },
    onSuccess: () => {
      invalidate();
      setUnitDialog(null);
      toast({ title: "Unit updated" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteUnit = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/admin/syllabus/units/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      invalidate();
      setUnitDialog(null);
      toast({ title: "Unit deleted" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const createTopic = useMutation({
    mutationFn: async ({
      unitId,
      body,
    }: {
      unitId: number;
      body: { name: string; order: number; isImportant?: boolean; weightage?: string; isClass11?: boolean; isClass12?: boolean };
    }) => {
      const r = await fetch(`/api/admin/syllabus/units/${unitId}/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message ?? "Failed");
      }
      return r.json();
    },
    onSuccess: () => {
      invalidate();
      setTopicDialog(null);
      toast({ title: "Topic created" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const updateTopic = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: number;
      body: Partial<{ name: string; order: number; isImportant: boolean; weightage: string | null; isClass11: boolean; isClass12: boolean }>;
    }) => {
      const r = await fetch(`/api/admin/syllabus/topics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message ?? "Failed");
      }
      return r.json();
    },
    onSuccess: () => {
      invalidate();
      setTopicDialog(null);
      toast({ title: "Topic updated" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteTopic = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/admin/syllabus/topics/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      invalidate();
      setTopicDialog(null);
      toast({ title: "Topic deleted" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Syllabus</h1>
          <p className="text-muted-foreground mt-1">Edit subjects, units, and topics.</p>
        </div>
        <Button onClick={() => setSubjectDialog("add")}>
          <Plus className="h-4 w-4 mr-2" />
          Add subject
        </Button>
      </div>

      <Accordion type="multiple" className="w-full">
        {(syllabus ?? []).map((subject) => (
          <AccordionItem key={subject.id} value={`subject-${subject.id}`}>
            <AccordionTrigger className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: subject.color }}
              />
              {subject.name}
            </AccordionTrigger>
            <AccordionContent>
              <div className="pl-6 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSubjectForm({ name: subject.name, color: subject.color });
                      setSubjectDialog({ edit: subject });
                    }}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit subject
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUnitForm({ name: "", order: subject.units.length });
                      setUnitDialog({ subjectId: subject.id, add: true });
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add unit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm("Delete this subject and all its units/topics?"))
                        deleteSubject.mutate(subject.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
                {subject.units.map((unit) => (
                  <Collapsible key={unit.id}>
                    <div className="border rounded-lg px-3 flex items-center gap-2">
                      <CollapsibleTrigger className="flex flex-1 items-center justify-between py-3 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                        <span className="font-medium">{unit.name}</span>
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform" />
                      </CollapsibleTrigger>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setUnitForm({ name: unit.name, order: unit.order });
                            setUnitDialog({ unit });
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setTopicForm({
                              name: "",
                              order: unit.topics.length,
                              isImportant: false,
                              weightage: "",
                              isClass11: true,
                              isClass12: true,
                            });
                            setTopicDialog({ unitId: unit.id, add: true });
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => {
                            if (confirm("Delete this unit and its topics?"))
                              deleteUnit.mutate(unit.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <CollapsibleContent>
                      <ul className="space-y-1 pl-4 pb-2 pt-0">
                        {unit.topics.map((topic) => (
                          <li
                            key={topic.id}
                            className="flex items-center justify-between gap-2 py-1.5 rounded hover:bg-muted/50 px-2"
                          >
                            <span className="text-sm flex items-center gap-2 flex-wrap">
                              {topic.name}
                              {topic.isImportant && (
                                <span className="text-xs text-primary">Important</span>
                              )}
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                {topic.isClass11 && topic.isClass12 && (
                                  <span className="rounded bg-muted px-1.5 py-0.5">11 & 12</span>
                                )}
                                {topic.isClass11 && !topic.isClass12 && (
                                  <span className="rounded bg-muted px-1.5 py-0.5">Class 11</span>
                                )}
                                {!topic.isClass11 && topic.isClass12 && (
                                  <span className="rounded bg-muted px-1.5 py-0.5">Class 12</span>
                                )}
                                {!topic.isClass11 && !topic.isClass12 && (
                                  <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">No level</span>
                                )}
                              </span>
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  const c11 = topic.isClass11 ?? true;
                                  const c12 = topic.isClass12 ?? true;
                                  const only11 = c11 && !c12;
                                  const only12 = c12 && !c11;
                                  setTopicForm({
                                    name: topic.name,
                                    order: topic.order,
                                    isImportant: topic.isImportant ?? false,
                                    weightage: topic.weightage ?? "",
                                    isClass11: only11 || !only12,
                                    isClass12: only12,
                                  });
                                  setTopicDialog({ topic });
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={() => {
                                  if (confirm("Delete this topic?"))
                                    deleteTopic.mutate(topic.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Subject dialog */}
      <Dialog
        open={subjectDialog !== null}
        onOpenChange={(open) => !open && setSubjectDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {subjectDialog === "add" ? "Add subject" : "Edit subject"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={subjectForm.name}
                onChange={(e) => setSubjectForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Physics"
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <Input
                type="color"
                value={subjectForm.color}
                onChange={(e) => setSubjectForm((f) => ({ ...f, color: e.target.value }))}
                className="h-10 w-20 p-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubjectDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (subjectDialog === "add")
                  createSubject.mutate(subjectForm);
                else if (subjectDialog && "edit" in subjectDialog)
                  updateSubject.mutate({
                    id: subjectDialog.edit.id,
                    body: { name: subjectForm.name, color: subjectForm.color },
                  });
              }}
              disabled={createSubject.isPending || updateSubject.isPending}
            >
              {(createSubject.isPending || updateSubject.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unit dialog */}
      <Dialog open={unitDialog !== null} onOpenChange={(open) => !open && setUnitDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {unitDialog && "add" in unitDialog && unitDialog.add
                ? "Add unit"
                : "Edit unit"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={unitForm.name}
                onChange={(e) => setUnitForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Unit name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Order</Label>
              <Input
                type="number"
                min={0}
                value={unitForm.order}
                onChange={(e) =>
                  setUnitForm((f) => ({ ...f, order: parseInt(e.target.value, 10) || 0 }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnitDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (unitDialog && "add" in unitDialog && unitDialog.add)
                  createUnit.mutate({
                    subjectId: unitDialog.subjectId,
                    body: { name: unitForm.name, order: unitForm.order },
                  });
                else if (unitDialog && "unit" in unitDialog)
                  updateUnit.mutate({
                    id: unitDialog.unit.id,
                    body: { name: unitForm.name, order: unitForm.order },
                  });
              }}
              disabled={createUnit.isPending || updateUnit.isPending}
            >
              {(createUnit.isPending || updateUnit.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Topic dialog */}
      <Dialog open={topicDialog !== null} onOpenChange={(open) => !open && setTopicDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {topicDialog && "add" in topicDialog && topicDialog.add
                ? "Add topic"
                : "Edit topic"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={topicForm.name}
                onChange={(e) => setTopicForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Topic name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Order</Label>
              <Input
                type="number"
                min={0}
                value={topicForm.order}
                onChange={(e) =>
                  setTopicForm((f) => ({ ...f, order: parseInt(e.target.value, 10) || 0 }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="topic-important"
                checked={topicForm.isImportant}
                onCheckedChange={(c) =>
                  setTopicForm((f) => ({ ...f, isImportant: !!c }))
                }
              />
              <Label htmlFor="topic-important">Important</Label>
            </div>
            <div className="grid gap-2">
              <Label>Weightage (optional)</Label>
              <Input
                value={topicForm.weightage}
                onChange={(e) => setTopicForm((f) => ({ ...f, weightage: e.target.value }))}
                placeholder="e.g. 5%"
              />
            </div>
            <div className="grid gap-2">
              <Label>Level (one only; matches student view filtering)</Label>
              <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="topic-11"
                  checked={topicForm.isClass11 && !topicForm.isClass12}
                  onCheckedChange={(c) =>
                    setTopicForm((f) => ({ ...f, isClass11: !!c, isClass12: !c }))
                  }
                />
                <Label htmlFor="topic-11">Class 11</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="topic-12"
                  checked={topicForm.isClass12 && !topicForm.isClass11}
                  onCheckedChange={(c) =>
                    setTopicForm((f) => ({ ...f, isClass12: !!c, isClass11: !c }))
                  }
                />
                <Label htmlFor="topic-12">Class 12</Label>
              </div>
            </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopicDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const oneLevel = topicForm.isClass11 && !topicForm.isClass12
                  ? { isClass11: true, isClass12: false }
                  : { isClass11: false, isClass12: true };
                const body = { ...topicForm, ...oneLevel };
                if (topicDialog && "add" in topicDialog && topicDialog.add)
                  createTopic.mutate({
                    unitId: topicDialog.unitId,
                    body,
                  });
                else if (topicDialog && "topic" in topicDialog)
                  updateTopic.mutate({
                    id: topicDialog.topic.id,
                    body,
                  });
              }}
              disabled={createTopic.isPending || updateTopic.isPending}
            >
              {(createTopic.isPending || updateTopic.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
