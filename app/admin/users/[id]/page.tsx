"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type {
  UserTopicProgress,
  StudySession,
  RevisionSchedule,
  BacklogItem,
  MockTest,
  MockTestSubject,
  Subject,
  Topic,
} from "@shared/types";

type UserDetail = {
  id: string;
  email: string | null;
  user_metadata: Record<string, unknown>;
  created_at: string;
  role: string;
};

function useUserDetail(userId: string | undefined) {
  return useQuery({
    queryKey: ["/api/admin/users", userId],
    queryFn: () =>
      fetch(`/api/admin/users/${userId}`, { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch user");
        return r.json() as Promise<UserDetail>;
      }),
    enabled: !!userId,
  });
}

function useAdminSyllabus() {
  return useQuery({
    queryKey: ["/api/admin/syllabus"],
    queryFn: () =>
      fetch("/api/admin/syllabus", { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch syllabus");
        return r.json();
      }),
  });
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string | undefined;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: user, isLoading: userLoading } = useUserDetail(userId);
  const { data: syllabus } = useAdminSyllabus();

  const topicIdToName = (topicId: number): string => {
    if (!syllabus) return String(topicId);
    for (const s of syllabus) {
      for (const u of s.units ?? []) {
        for (const t of u.topics ?? []) {
          if (t.id === topicId) return t.name;
        }
      }
    }
    return String(topicId);
  };

  const subjectIdToName = (subjectId: number): string => {
    const s = (syllabus ?? []).find((x: { id: number }) => x.id === subjectId);
    return s?.name ?? String(subjectId);
  };

  if (userLoading || !userId) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">User not found.</p>
        <Link href="/admin/users">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to users
          </Button>
        </Link>
      </div>
    );
  }

  const displayName = [user.user_metadata?.first_name, user.user_metadata?.last_name]
    .filter(Boolean)
    .join(" ") || user.email || user.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold">{displayName}</h1>
          <p className="text-muted-foreground text-sm">{user.email ?? user.id}</p>
        </div>
      </div>

      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="sessions">Study sessions</TabsTrigger>
          <TabsTrigger value="revision">Revision</TabsTrigger>
          <TabsTrigger value="backlog">Backlog</TabsTrigger>
          <TabsTrigger value="mock-tests">Mock tests</TabsTrigger>
        </TabsList>
        <TabsContent value="progress">
          <ProgressTab userId={userId} topicIdToName={topicIdToName} invalidate={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "progress"] })} />
        </TabsContent>
        <TabsContent value="sessions">
          <StudySessionsTab userId={userId} subjectIdToName={subjectIdToName} invalidate={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "study-sessions"] })} />
        </TabsContent>
        <TabsContent value="revision">
          <RevisionTab userId={userId} syllabus={syllabus} topicIdToName={topicIdToName} invalidate={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "revision"] })} />
        </TabsContent>
        <TabsContent value="backlog">
          <BacklogTab userId={userId} invalidate={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "backlog"] })} />
        </TabsContent>
        <TabsContent value="mock-tests">
          <MockTestsTab userId={userId} invalidate={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId, "mock-tests"] })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProgressTab({
  userId,
  topicIdToName,
  invalidate,
}: {
  userId: string;
  topicIdToName: (id: number) => string;
  invalidate: () => void;
}) {
  const { toast } = useToast();
  const { data: progress, isLoading } = useQuery({
    queryKey: ["/api/admin/users", userId, "progress"],
    queryFn: () =>
      fetch(`/api/admin/users/${userId}/progress`, { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json() as Promise<UserTopicProgress[]>;
      }),
  });
  const [editing, setEditing] = useState<UserTopicProgress | null>(null);
  const [form, setForm] = useState({ status: "not_started", confidence: "", notes: "" });
  const updateMutation = useMutation({
    mutationFn: (body: { topicId: number; status?: string; confidence?: string | null; notes?: string | null }) =>
      fetch(`/api/admin/users/${userId}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error("Update failed");
        return r.json();
      }),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      toast({ title: "Progress updated" });
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });
  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  const list = progress ?? [];
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{list.length} topic(s) with progress.</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Topic</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{topicIdToName(p.topicId)}</TableCell>
              <TableCell>{p.status}</TableCell>
              <TableCell>{p.confidence ?? "—"}</TableCell>
              <TableCell className="max-w-[200px] truncate">{p.notes ?? "—"}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(p);
                    setForm({ status: p.status, confidence: p.confidence ?? "", notes: p.notes ?? "" });
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit progress</DialogTitle></DialogHeader>
          {editing && (
            <>
              <p className="text-sm text-muted-foreground">{topicIdToName(editing.topicId)}</p>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not started</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Confidence</Label>
                  <Select value={form.confidence || "none"} onValueChange={(v) => setForm((f) => ({ ...f, confidence: v === "none" ? "" : v }))}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button
                  onClick={() =>
                    updateMutation.mutate({
                      topicId: editing.topicId,
                      status: form.status as "not_started" | "in_progress" | "completed",
                      confidence: form.confidence || null,
                      notes: form.notes || null,
                    })
                  }
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StudySessionsTab({
  userId,
  subjectIdToName,
  invalidate,
}: {
  userId: string;
  subjectIdToName: (id: number) => string;
  invalidate: () => void;
}) {
  const { toast } = useToast();
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["/api/admin/users", userId, "study-sessions"],
    queryFn: () =>
      fetch(`/api/admin/users/${userId}/study-sessions`, { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json() as Promise<StudySession[]>;
      }),
  });
  const [dialog, setDialog] = useState<"add" | { session: StudySession } | null>(null);
  const [form, setForm] = useState({ date: "", durationMinutes: 60, subjectId: "" as string, notes: "" });
  const createMutation = useMutation({
    mutationFn: (body: { date: string; durationMinutes: number; subjectId?: number | null; notes?: string | null }) =>
      fetch(`/api/admin/users/${userId}/study-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      }),
    onSuccess: () => { invalidate(); setDialog(null); toast({ title: "Session created" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      fetch(`/api/admin/users/${userId}/study-sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      }),
    onSuccess: () => { invalidate(); setDialog(null); toast({ title: "Session updated" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/users/${userId}/study-sessions/${id}`, { method: "DELETE", credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Failed");
      }),
    onSuccess: () => { invalidate(); toast({ title: "Session deleted" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });
  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  const list = sessions ?? [];
  return (
    <div className="space-y-4">
      <Button onClick={() => { setForm({ date: new Date().toISOString().slice(0, 10), durationMinutes: 60, subjectId: "", notes: "" }); setDialog("add"); }}>
        <Plus className="h-4 w-4 mr-2" /> Add session
      </Button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Duration (min)</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.date}</TableCell>
              <TableCell>{s.subjectId != null ? subjectIdToName(s.subjectId) : "—"}</TableCell>
              <TableCell>{s.durationMinutes}</TableCell>
              <TableCell className="max-w-[200px] truncate">{s.notes ?? "—"}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => { setForm({ date: s.date, durationMinutes: s.durationMinutes, subjectId: s.subjectId != null ? String(s.subjectId) : "", notes: s.notes ?? "" }); setDialog({ session: s }); }}><Pencil className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(s.id); }}><Trash2 className="h-3 w-3" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialog === "add" ? "Add session" : "Edit session"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Duration (minutes)</Label>
              <Input type="number" min={1} value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value, 10) || 0 }))} />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (dialog === "add") createMutation.mutate({ date: form.date, durationMinutes: form.durationMinutes, subjectId: form.subjectId ? parseInt(form.subjectId, 10) : null, notes: form.notes || null });
                else if (dialog && "session" in dialog) updateMutation.mutate({ id: dialog.session.id, body: { date: form.date, durationMinutes: form.durationMinutes, notes: form.notes || null } });
              }}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RevisionTab({
  userId,
  syllabus,
  topicIdToName,
  invalidate,
}: {
  userId: string;
  syllabus: unknown;
  topicIdToName: (id: number) => string;
  invalidate: () => void;
}) {
  const { toast } = useToast();
  const { data: schedule, isLoading } = useQuery({
    queryKey: ["/api/admin/users", userId, "revision"],
    queryFn: () =>
      fetch(`/api/admin/users/${userId}/revision`, { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json() as Promise<(RevisionSchedule & { topic: Topic })[]>;
      }),
  });
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ topicId: "", scheduledDate: new Date().toISOString().slice(0, 10) });
  const topicOptions: { id: number; name: string }[] = [];
  if (Array.isArray(syllabus)) {
    for (const s of syllabus as { units?: { topics?: { id: number; name: string }[] }[] }[]) {
      for (const u of s.units ?? []) {
        for (const t of u.topics ?? []) {
          topicOptions.push({ id: t.id, name: t.name });
        }
      }
    }
  }
  const createMutation = useMutation({
    mutationFn: (body: { topicId: number; scheduledDate: string }) =>
      fetch(`/api/admin/users/${userId}/revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      }).then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
    onSuccess: () => { invalidate(); setAddOpen(false); toast({ title: "Revision added" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });
  const completeMutation = useMutation({
    mutationFn: (scheduleId: number) =>
      fetch(`/api/admin/users/${userId}/revision/${scheduleId}/complete`, { method: "PATCH", credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      }),
    onSuccess: () => { invalidate(); toast({ title: "Marked complete" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: (scheduleId: number) =>
      fetch(`/api/admin/users/${userId}/revision/${scheduleId}`, { method: "DELETE", credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Failed");
      }),
    onSuccess: () => { invalidate(); toast({ title: "Deleted" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });
  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  const list = schedule ?? [];
  return (
    <div className="space-y-4">
      <Button onClick={() => { setAddForm({ topicId: topicOptions[0]?.id ? String(topicOptions[0].id) : "", scheduledDate: new Date().toISOString().slice(0, 10) }); setAddOpen(true); }}>
        <Plus className="h-4 w-4 mr-2" /> Add revision
      </Button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Topic</TableHead>
            <TableHead>Scheduled date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{topicIdToName(s.topicId)}</TableCell>
              <TableCell>{s.scheduledDate}</TableCell>
              <TableCell>{s.status}</TableCell>
              <TableCell>
                {s.status !== "completed" && (
                  <Button variant="ghost" size="sm" onClick={() => completeMutation.mutate(s.id)}>Complete</Button>
                )}
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(s.id); }}><Trash2 className="h-3 w-3" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add revision</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Topic</Label>
              <Select value={addForm.topicId} onValueChange={(v) => setAddForm((f) => ({ ...f, topicId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                <SelectContent>
                  {topicOptions.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Scheduled date</Label>
              <Input type="date" value={addForm.scheduledDate} onChange={(e) => setAddForm((f) => ({ ...f, scheduledDate: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => addForm.topicId && createMutation.mutate({ topicId: parseInt(addForm.topicId, 10), scheduledDate: addForm.scheduledDate })} disabled={createMutation.isPending || !addForm.topicId}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BacklogTab({ userId, invalidate }: { userId: string; invalidate: () => void }) {
  const { toast } = useToast();
  const { data: items, isLoading } = useQuery({
    queryKey: ["/api/admin/users", userId, "backlog"],
    queryFn: () =>
      fetch(`/api/admin/users/${userId}/backlog`, { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json() as Promise<BacklogItem[]>;
      }),
  });
  const [dialog, setDialog] = useState<"add" | { item: BacklogItem } | null>(null);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", type: "concept" });
  const createMutation = useMutation({
    mutationFn: (body: { title: string; description?: string; priority: string; type: string }) =>
      fetch(`/api/admin/users/${userId}/backlog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      }).then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
    onSuccess: () => { invalidate(); setDialog(null); toast({ title: "Created" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<BacklogItem> }) =>
      fetch(`/api/admin/users/${userId}/backlog/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      }).then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
    onSuccess: () => { invalidate(); setDialog(null); toast({ title: "Updated" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/users/${userId}/backlog/${id}`, { method: "DELETE", credentials: "include" }).then((r) => { if (!r.ok) throw new Error("Failed"); }),
    onSuccess: () => { invalidate(); toast({ title: "Deleted" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });
  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  const list = items ?? [];
  return (
    <div className="space-y-4">
      <Button onClick={() => { setForm({ title: "", description: "", priority: "medium", type: "concept" }); setDialog("add"); }}><Plus className="h-4 w-4 mr-2" /> Add item</Button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.title}</TableCell>
              <TableCell>{item.priority}</TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>{item.isCompleted ? "Yes" : "No"}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => { setForm({ title: item.title, description: item.description ?? "", priority: item.priority, type: item.type }); setDialog({ item }); }}><Pencil className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(item.id); }}><Trash2 className="h-3 w-3" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialog === "add" ? "Add backlog item" : "Edit item"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concept">Concept</SelectItem>
                    <SelectItem value="practice">Practice</SelectItem>
                    <SelectItem value="forgetting">Forgetting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (dialog === "add") createMutation.mutate(form);
                else if (dialog && "item" in dialog) updateMutation.mutate({ id: dialog.item.id, body: { ...form, priority: form.priority as "low" | "medium" | "high", type: form.type as "concept" | "practice" | "forgetting" } });
              }}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MockTestsTab({ userId, invalidate }: { userId: string; invalidate: () => void }) {
  const { toast } = useToast();
  const { data: tests, isLoading } = useQuery({
    queryKey: ["/api/admin/users", userId, "mock-tests"],
    queryFn: () =>
      fetch(`/api/admin/users/${userId}/mock-tests`, { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json() as Promise<(MockTest & { subjects: (MockTestSubject & { subject: Subject })[] })[]>;
      }),
  });
  const deleteMutation = useMutation({
    mutationFn: (testId: string) =>
      fetch(`/api/admin/users/${userId}/mock-tests/${testId}`, { method: "DELETE", credentials: "include" }).then((r) => { if (!r.ok) throw new Error("Failed"); }),
    onSuccess: () => { invalidate(); toast({ title: "Deleted" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });
  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  const list = tests ?? [];
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Subjects</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-medium">{t.title}</TableCell>
              <TableCell>{t.testDate}</TableCell>
              <TableCell>{t.totalScore} / {t.maxScore}</TableCell>
              <TableCell>{(t.subjects ?? []).map((s) => s.subject?.name ?? s.subjectId).join(", ")}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("Delete this test?")) deleteMutation.mutate(t.id); }}><Trash2 className="h-3 w-3" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
