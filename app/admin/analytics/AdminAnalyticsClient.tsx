"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, BarChart3, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const defaultFrom = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
};
const defaultTo = () => new Date().toISOString().slice(0, 10);

export function AdminAnalyticsClient() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const [reportFrom, setReportFrom] = useState(defaultFrom());
  const [reportTo, setReportTo] = useState(defaultTo());
  const [reportUserId, setReportUserId] = useState<string>("");

  const queryParams = useMemo(() => ({ from, to }), [from, to]);
  const reportParams = useMemo(
    () => ({ from: reportFrom, to: reportTo, userId: reportUserId || undefined }),
    [reportFrom, reportTo, reportUserId]
  );

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/admin/analytics", queryParams],
    queryFn: () =>
      fetch(
        `/api/admin/analytics?${new URLSearchParams(queryParams as Record<string, string>)}`,
        { credentials: "include" }
      ).then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      }),
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/admin/analytics/students", queryParams],
    queryFn: () =>
      fetch(
        `/api/admin/analytics/students?${new URLSearchParams(queryParams as Record<string, string>)}`,
        { credentials: "include" }
      ).then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      }),
  });

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ["/api/admin/analytics/study-sessions", reportParams],
    queryFn: () => {
      const params = new URLSearchParams({ from: reportParams.from, to: reportParams.to });
      if (reportParams.userId) params.set("userId", reportParams.userId);
      return fetch(`/api/admin/analytics/study-sessions?${params}`, {
        credentials: "include",
      }).then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      });
    },
    enabled: !!reportParams.from && !!reportParams.to,
  });

  const { data: usersData } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: () =>
      fetch("/api/admin/users", { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      }),
  });

  const studentOptions = useMemo(() => {
    const list = (usersData?.users ?? []) as { id: string; email: string | null }[];
    return list.map((s) => ({ value: s.id, label: s.email ?? s.id }));
  }, [usersData]);

  const defaultTab = tabParam === "report" ? "report" : "overview";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Aggregate stats and student reports.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid gap-2">
              <Label>From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>

          {analyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total study hours</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.totalStudyHours ?? 0}</div>
                    <p className="text-xs text-muted-foreground">In selected date range</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Active users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.activeUsersCount ?? 0}</div>
                    <p className="text-xs text-muted-foreground">With sessions in range</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total sessions</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.totalSessionsCount ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Study sessions in range</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">Students (in date range)</h2>
                {studentsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Study hours</TableHead>
                          <TableHead>Sessions</TableHead>
                          <TableHead>Syllabus %</TableHead>
                          <TableHead>Revision due</TableHead>
                          <TableHead>Backlog</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {((students ?? []) as { userId: string; email: string | null; totalStudyHours: number; sessionsCount: number; syllabusCompletionPct: number; revisionDue: number; backlogCount: number }[]).map((s) => (
                          <TableRow key={s.userId}>
                            <TableCell className="font-medium">{s.email ?? s.userId}</TableCell>
                            <TableCell>{s.totalStudyHours}</TableCell>
                            <TableCell>{s.sessionsCount}</TableCell>
                            <TableCell>{s.syllabusCompletionPct}%</TableCell>
                            <TableCell>{s.revisionDue}</TableCell>
                            <TableCell>{s.backlogCount}</TableCell>
                            <TableCell>
                              <Link href={`/admin/users/${s.userId}`}>
                                <Button variant="ghost" size="sm">View</Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="report" className="space-y-6 mt-6">
          <p className="text-muted-foreground text-sm">
            Generate a report for a student (or all students) over a date range. Study sessions and activity are shown below.
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid gap-2">
              <Label>Student</Label>
              <Select value={reportUserId || "all"} onValueChange={(v) => setReportUserId(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All students</SelectItem>
                  {studentOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>From</Label>
              <Input type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>To</Label>
              <Input type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)} />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">
              {reportUserId ? "Study sessions (student report)" : "Study sessions (all students)"}
            </h2>
            {reportLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Duration (min)</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {((report?.sessions ?? []) as { date: string; userEmail?: string; userId: string; durationMinutes: number; notes: string | null }[]).map((s, i) => (
                      <TableRow key={s.date + s.userId + i}>
                        <TableCell>{s.date}</TableCell>
                        <TableCell>{s.userEmail ?? s.userId}</TableCell>
                        <TableCell>{s.durationMinutes}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{s.notes ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(!report?.sessions || report.sessions.length === 0) && (
                  <p className="p-4 text-muted-foreground text-sm">No sessions in this range.</p>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
