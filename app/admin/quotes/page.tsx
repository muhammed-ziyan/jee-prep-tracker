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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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

type MotivationalQuote = {
  id: number;
  quote: string;
  author: string | null;
  displayOrder: number;
  isActive: boolean;
};

function fetchQuotes(): Promise<MotivationalQuote[]> {
  return fetch("/api/admin/quotes", { credentials: "include" }).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch quotes");
    return r.json();
  });
}

export default function AdminQuotesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: quotes, isLoading } = useQuery({
    queryKey: ["/api/admin/quotes"],
    queryFn: fetchQuotes,
  });
  const [dialog, setDialog] = useState<"add" | { edit: MotivationalQuote } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    quote: "",
    author: "",
    displayOrder: 0,
    isActive: true,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });

  const createMutation = useMutation({
    mutationFn: async (body: {
      quote: string;
      author?: string | null;
      displayOrder?: number;
      isActive?: boolean;
    }) => {
      const r = await fetch("/api/admin/quotes", {
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
      setForm({ quote: "", author: "", displayOrder: 0, isActive: true });
      toast({ title: "Quote added" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: number;
      body: { quote?: string; author?: string | null; displayOrder?: number; isActive?: boolean };
    }) => {
      const r = await fetch(`/api/admin/quotes/${id}`, {
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
      toast({ title: "Quote updated" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/admin/quotes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      invalidate();
      setDeleteId(null);
      toast({ title: "Quote removed" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const openAdd = () => {
    setForm({
      quote: "",
      author: "",
      displayOrder: (quotes?.length ?? 0),
      isActive: true,
    });
    setDialog("add");
  };
  const openEdit = (q: MotivationalQuote) => {
    setForm({
      quote: q.quote,
      author: q.author ?? "",
      displayOrder: q.displayOrder,
      isActive: q.isActive,
    });
    setDialog({ edit: q });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dialog === "add") {
      createMutation.mutate({
        quote: form.quote.trim(),
        author: form.author.trim() || null,
        displayOrder: form.displayOrder,
        isActive: form.isActive,
      });
    } else if (dialog && "edit" in dialog) {
      updateMutation.mutate({
        id: dialog.edit.id,
        body: {
          quote: form.quote.trim(),
          author: form.author.trim() || null,
          displayOrder: form.displayOrder,
          isActive: form.isActive,
        },
      });
    }
  };

  const list = (quotes ?? []) as MotivationalQuote[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Motivational quotes</h1>
          <p className="text-muted-foreground mt-1">
            Manage quotes shown on the student dashboard. One random active quote is displayed each time.
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add quote
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
                <TableHead className="max-w-[320px]">Quote</TableHead>
                <TableHead>Author</TableHead>
                <TableHead className="w-20">Order</TableHead>
                <TableHead className="w-20">Active</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No quotes yet. Add one to show on student dashboards.
                  </TableCell>
                </TableRow>
              ) : (
                list.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium max-w-[320px] truncate" title={q.quote}>
                      {q.quote}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{q.author ?? "—"}</TableCell>
                    <TableCell>{q.displayOrder}</TableCell>
                    <TableCell>{q.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(q)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(q.id)}
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

      <Dialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog === "add" ? "Add quote" : "Edit quote"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="quote">Quote</Label>
              <Textarea
                id="quote"
                value={form.quote}
                onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
                placeholder="Enter motivational quote..."
                rows={3}
                required
                className="resize-none"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="author">Author (optional)</Label>
              <Input
                id="author"
                value={form.author}
                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                placeholder="e.g. Albert Einstein"
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
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: !!checked }))}
              />
              <Label htmlFor="isActive" className="font-normal cursor-pointer">
                Active (show on dashboard)
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.quote.trim() || createMutation.isPending || updateMutation.isPending}
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

      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove quote?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            This quote will no longer appear on student dashboards.
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
