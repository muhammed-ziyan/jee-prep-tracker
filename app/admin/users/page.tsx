"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Pencil, ExternalLink, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AdminUserRow = {
  id: string;
  email: string | null;
  user_metadata: Record<string, unknown>;
  created_at: string;
  role: "admin" | "student";
  current_level?: "11" | "12";
  username?: string | null;
};

function fetchUsers(): Promise<{ users: AdminUserRow[] }> {
  return fetch("/api/admin/users", { credentials: "include" }).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch users");
    return r.json();
  });
}

const editFormDefaults = {
  email: "",
  first_name: "",
  last_name: "",
  role: "student" as "admin" | "student",
  current_level: "11" as "11" | "12",
  username: "",
  new_password: "",
};

const addFormDefaults = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  role: "student" as "admin" | "student",
  current_level: "11" as "11" | "12",
  username: "",
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: fetchUsers,
  });
  const [editing, setEditing] = useState<AdminUserRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(editFormDefaults);
  const [addForm, setAddForm] = useState(addFormDefaults);

  const createMutation = useMutation({
    mutationFn: async (body: {
      email: string;
      password: string;
      first_name?: string;
      last_name?: string;
      role?: "admin" | "student";
      current_level?: "11" | "12";
      username?: string;
    }) => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message ?? "Create failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setAdding(false);
      setAddForm(addFormDefaults);
      toast({ title: "User created" });
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: {
        role?: "admin" | "student";
        email?: string;
        current_level?: "11" | "12";
        username?: string | null;
        password?: string;
        user_metadata?: { first_name?: string; last_name?: string };
      };
    }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message ?? "Update failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditing(null);
      toast({ title: "User updated" });
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const openEdit = (row: AdminUserRow) => {
    const meta = row.user_metadata ?? {};
    setForm({
      email: row.email ?? "",
      first_name: (meta.first_name as string) ?? "",
      last_name: (meta.last_name as string) ?? "",
      role: row.role,
      current_level: row.current_level ?? "11",
      username: row.username ?? "",
      new_password: "",
    });
    setEditing(row);
  };

  const handleSave = () => {
    if (!editing) return;
    updateMutation.mutate({
      id: editing.id,
      body: {
        email: form.email || undefined,
        user_metadata: {
          first_name: form.first_name || undefined,
          last_name: form.last_name || undefined,
        },
        role: form.role,
        current_level: form.current_level,
        username: form.username === "" ? null : form.username || undefined,
        ...(form.new_password.length >= 6 && { password: form.new_password }),
      },
    });
  };

  const handleAddUser = () => {
    createMutation.mutate({
      email: addForm.email.trim(),
      password: addForm.password,
      first_name: addForm.first_name.trim() || undefined,
      last_name: addForm.last_name.trim() || undefined,
      role: addForm.role,
      current_level: addForm.current_level,
      username: addForm.username.trim() || undefined,
    });
  };

  const users = data?.users ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">
            Add and manage users. Edit profile or open user data from the actions menu.
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add user
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.email ?? "—"}</TableCell>
                  <TableCell>
                    {[u.user_metadata?.first_name, u.user_metadata?.last_name]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{u.username ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{u.current_level ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(u)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit profile
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${u.id}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View / Edit data
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-first">First name</Label>
                <Input
                  id="edit-first"
                  value={form.first_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, first_name: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-last">Last name</Label>
                <Input
                  id="edit-last"
                  value={form.last_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, last_name: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-username">Username (for login)</Label>
              <Input
                id="edit-username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v: "admin" | "student") =>
                    setForm((f) => ({ ...f, role: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Level</Label>
                <Select
                  value={form.current_level}
                  onValueChange={(v: "11" | "12") =>
                    setForm((f) => ({ ...f, current_level: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="11">Class 11</SelectItem>
                    <SelectItem value="12">Class 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">New password (leave blank to keep)</Label>
              <Input
                id="edit-password"
                type="password"
                value={form.new_password}
                onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
                placeholder="Min 6 characters"
                autoComplete="new-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adding} onOpenChange={(open) => !open && setAdding(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-password">Password</Label>
              <Input
                id="add-password"
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="add-first">First name</Label>
                <Input
                  id="add-first"
                  value={addForm.first_name}
                  onChange={(e) => setAddForm((f) => ({ ...f, first_name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-last">Last name</Label>
                <Input
                  id="add-last"
                  value={addForm.last_name}
                  onChange={(e) => setAddForm((f) => ({ ...f, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-username">Username (optional, for login)</Label>
              <Input
                id="add-username"
                value={addForm.username}
                onChange={(e) => setAddForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select
                  value={addForm.role}
                  onValueChange={(v: "admin" | "student") =>
                    setAddForm((f) => ({ ...f, role: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Level</Label>
                <Select
                  value={addForm.current_level}
                  onValueChange={(v: "11" | "12") =>
                    setAddForm((f) => ({ ...f, current_level: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="11">Class 11</SelectItem>
                    <SelectItem value="12">Class 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={createMutation.isPending || !addForm.email.trim() || addForm.password.length < 6}
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
