"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ExamDate = { id: number; name: string; examDate: string; displayOrder: number };

function fetchExamDates(): Promise<ExamDate[]> {
  return fetch("/api/admin/exam-dates", { credentials: "include" }).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch exam dates");
    return r.json();
  });
}

export default function AdminExamDatesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: examDates, isLoading } = useQuery({
    queryKey: ["/api/admin/exam-dates"],
    queryFn: fetchExamDates,
  });
  const [dialog, setDialog] = useState<"add" | { edit: ExamDate } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", examDate: "", displayOrder: 0 });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/exam-dates"] });

  const createMutation = useMutation({
    mutationFn: async (body: { name: string; examDate: string; displayOrder?: number }) => {
      const r = await fetch("/api/admin/exam-dates", {
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
      setDialog(null);
      setForm({ name: "", examDate: "", displayOrder: 0 });
      toast({ title: "Exam date added" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: number;
      body: { name?: string; examDate?: string; displayOrder?: number };
    }) => {
      const r = await fetch(`/api/admin/exam-dates/${id}`, {
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
      setDialog(null);
      toast({ title: "Exam date updated" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/admin/exam-dates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      invalidate();
      setDeleteId(null);
      toast({ title: "Exam date removed" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const openAdd = () => {
    setForm({ name: "", examDate: new Date().toISOString().slice(0, 10), displayOrder: (examDates?.length ?? 0) });
    setDialog("add");
  };
  const openEdit = (exam: ExamDate) => {
    setForm({ name: exam.name, examDate: exam.examDate, displayOrder: exam.displayOrder });
    setDialog({ edit: exam });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dialog === "add") {
      createMutation.mutate({ name: form.name, examDate: form.examDate, displayOrder: form.displayOrder });
    } else if (dialog && "edit" in dialog) {
      updateMutation.mutate({
        id: dialog.edit.id,
        body: { name: form.name, examDate: form.examDate, displayOrder: form.displayOrder },
      });
    }
  };

  const list = (examDates ?? []) as ExamDate[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Exam dates</h1>
          <p className="text-muted-foreground mt-1">
            Set exam names and dates. Students will see days remaining on their dashboard.
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add exam
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-24">Order</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No exam dates yet. Add one to show countdown on student dashboards.
                  </TableCell>
                </TableRow>
              ) : (
                list.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.name}</TableCell>
                    <TableCell>{exam.examDate}</TableCell>
                    <TableCell>{exam.displayOrder}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(exam)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(exam.id)}
                          aria-label="Delete"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog === "add" ? "Add exam date" : "Edit exam date"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Exam name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. JEE Main 2025"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="examDate">Exam date</Label>
              <Input
                id="examDate"
                type="date"
                value={form.examDate}
                onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayOrder">Display order</Label>
              <Input
                id="displayOrder"
                type="number"
                min={0}
                value={form.displayOrder}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: parseInt(e.target.value, 10) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">Lower number appears first on dashboard.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !form.name.trim() ||
                  !form.examDate ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {dialog === "add" ? "Add" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove exam date?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            This will remove the exam from the list. Students will no longer see its countdown.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId !== null && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
