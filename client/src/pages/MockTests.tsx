import { useState, useMemo } from "react";
import { useMockTests, useCreateMockTest, useUpdateMockTest } from "@/hooks/use-mock-tests";
import { useSyllabus } from "@/hooks/use-syllabus";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Plus, GraduationCap, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { SubjectWithUnits } from "@shared/schema";
import type { MockTestSubjectScope } from "@shared/types";

type PerSubjectState = {
  scope: MockTestSubjectScope | "custom" | null;
  unitIds: number[];
  score: number;
  negativeMarks: number;
  maxScore: number;
};

const SCOPE_OPTIONS: { value: MockTestSubjectScope; label: string }[] = [
  { value: "class_11", label: "Full Class 11" },
  { value: "class_12", label: "Full Class 12" },
  { value: "full", label: "Full syllabus" },
];

const initialPerSubject = (): PerSubjectState => ({
  scope: "full",
  unitIds: [],
  score: 0,
  negativeMarks: 0,
  maxScore: 0,
});

export default function MockTests() {
  const { data: tests, isLoading } = useMockTests();
  const { data: syllabus } = useSyllabus();
  const createTest = useCreateMockTest();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<{
    id: string;
    title: string;
    testDate: string;
    maxScore: number;
    totalScore: number;
    subjects: { subjectId: number; subject?: { name: string }; score: number; negativeMarks?: number; maxScore?: number | null; scope?: string | null; unitIds?: number[] | null }[];
  } | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    date: string;
    maxScore: number;
    perSubject: Record<number, PerSubjectState>;
  } | null>(null);
  const [chartSubjectId, setChartSubjectId] = useState<number | "all">("all");
  const [newTest, setNewTest] = useState({
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    maxScore: 300,
    selectedSubjectIds: [] as number[],
    perSubject: {} as Record<number, PerSubjectState>,
  });
  const updateTest = useUpdateMockTest(editingTest?.id ?? "");
  const { toast } = useToast();

  const openEditDialog = (test: {
    id: string;
    title: string;
    testDate: string;
    maxScore: number;
    totalScore?: number;
    subjects: { subjectId: number; subject?: { name: string }; score: number; negativeMarks?: number; maxScore?: number | null; scope?: string | null; unitIds?: number[] | null }[];
  }) => {
    const totalScore =
      test.totalScore ?? test.subjects?.reduce((sum, s) => sum + s.score, 0) ?? 0;
    setEditingTest({ ...test, totalScore });
    const dateStr = test.testDate.includes("T") ? test.testDate.slice(0, 10) : test.testDate.slice(0, 10);
    setEditForm({
      title: test.title,
      date: dateStr,
      maxScore: test.maxScore,
      perSubject: Object.fromEntries(
        (test.subjects ?? []).map((s) => [
          s.subjectId,
          {
            scope: (s.scope ?? "full") as MockTestSubjectScope,
            unitIds: s.unitIds ?? [],
            score: s.score,
            negativeMarks: s.negativeMarks ?? 0,
            maxScore: s.maxScore ?? 0,
          },
        ])
      ),
    });
  };

  const closeEditDialog = () => {
    setEditingTest(null);
    setEditForm(null);
  };

  const setEditSubjectScope = (subjectId: number, scope: MockTestSubjectScope | "custom" | null, unitIds?: number[]) => {
    setEditForm((prev) =>
      prev
        ? {
            ...prev,
            perSubject: {
              ...prev.perSubject,
              [subjectId]: {
                ...(prev.perSubject[subjectId] ?? initialPerSubject()),
                scope: scope === "custom" ? null : scope,
                unitIds: unitIds ?? (scope === "custom" ? [] : []),
              },
            },
          }
        : null
    );
  };

  const setEditToggleUnit = (subjectId: number, unitId: number) => {
    setEditForm((prev) => {
      if (!prev) return null;
      const ps = prev.perSubject[subjectId] ?? initialPerSubject();
      const unitIds = ps.unitIds.includes(unitId)
        ? ps.unitIds.filter((id) => id !== unitId)
        : [...ps.unitIds, unitId];
      return {
        ...prev,
        perSubject: { ...prev.perSubject, [subjectId]: { ...ps, unitIds, scope: null } },
      };
    });
  };

  const subjects = (syllabus || []) as SubjectWithUnits[];

  const divideScoreEqually = (total: number, n: number): number[] => {
    if (n <= 0) return [];
    const base = Math.floor(total / n);
    const remainder = total % n;
    return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
  };

  const toggleSubject = (subjectId: number) => {
    setNewTest((prev) => {
      const selected = prev.selectedSubjectIds.includes(subjectId)
        ? prev.selectedSubjectIds.filter((id) => id !== subjectId)
        : [...prev.selectedSubjectIds, subjectId];
      const n = selected.length;
      const perSubject = { ...prev.perSubject };
      if (n === 0) {
        selected.forEach((id) => delete perSubject[id]);
        return { ...prev, selectedSubjectIds: selected, perSubject };
      }
      if (!selected.includes(subjectId)) delete perSubject[subjectId];
      const scores = n > 1 ? divideScoreEqually(prev.maxScore, n) : [prev.maxScore];
      const maxScores = n > 1 ? divideScoreEqually(prev.maxScore, n) : [prev.maxScore];
      selected.forEach((id, i) => {
        perSubject[id] = {
          ...(perSubject[id] ?? initialPerSubject()),
          maxScore: maxScores[i] ?? 0,
          score: n > 1 ? (scores[i] ?? 0) : (perSubject[id]?.score ?? 0),
        };
      });
      return { ...prev, selectedSubjectIds: selected, perSubject };
    });
  };

  const setSubjectScope = (subjectId: number, scope: MockTestSubjectScope | "custom" | null, unitIds?: number[]) => {
    setNewTest((prev) => ({
      ...prev,
      perSubject: {
        ...prev.perSubject,
        [subjectId]: {
          ...(prev.perSubject[subjectId] ?? initialPerSubject()),
          scope: scope === "custom" ? null : scope,
          unitIds: unitIds ?? (scope === "custom" ? [] : []),
        },
      },
    }));
  };

  const toggleUnit = (subjectId: number, unitId: number) => {
    setNewTest((prev) => {
      const ps = prev.perSubject[subjectId] ?? initialPerSubject();
      const unitIds = ps.unitIds.includes(unitId)
        ? ps.unitIds.filter((id) => id !== unitId)
        : [...ps.unitIds, unitId];
      return {
        ...prev,
        perSubject: { ...prev.perSubject, [subjectId]: { ...ps, unitIds, scope: null } },
      };
    });
  };

  const setSubjectScore = (subjectId: number, score: number) => {
    setNewTest((prev) => ({
      ...prev,
      perSubject: {
        ...prev.perSubject,
        [subjectId]: { ...(prev.perSubject[subjectId] ?? initialPerSubject()), score },
      },
    }));
  };

  const setSubjectNegativeMarks = (subjectId: number, negativeMarks: number) => {
    setNewTest((prev) => ({
      ...prev,
      perSubject: {
        ...prev.perSubject,
        [subjectId]: { ...(prev.perSubject[subjectId] ?? initialPerSubject()), negativeMarks },
      },
    }));
  };

  const setSubjectMaxScore = (subjectId: number, maxScore: number) => {
    setNewTest((prev) => ({
      ...prev,
      perSubject: {
        ...prev.perSubject,
        [subjectId]: { ...(prev.perSubject[subjectId] ?? initialPerSubject()), maxScore },
      },
    }));
  };

  const selectedSubjects = useMemo(
    () => subjects.filter((s) => newTest.selectedSubjectIds.includes(s.id)),
    [subjects, newTest.selectedSubjectIds]
  );

  const totalScore = useMemo(() => {
    return selectedSubjects.reduce((sum, s) => {
      const ps = newTest.perSubject[s.id];
      if (!ps) return sum;
      return sum + ps.score;
    }, 0);
  }, [selectedSubjects, newTest.perSubject]);

  const totalNetScore = useMemo(() => {
    return selectedSubjects.reduce((sum, s) => {
      const ps = newTest.perSubject[s.id];
      if (!ps) return sum;
      return sum + (ps.score - (ps.negativeMarks ?? 0));
    }, 0);
  }, [selectedSubjects, newTest.perSubject]);

  const createSumSubjectMax = useMemo(() => {
    if (selectedSubjects.length <= 1) return newTest.maxScore;
    return selectedSubjects.reduce((sum, s) => {
      const ps = newTest.perSubject[s.id] ?? initialPerSubject();
      return sum + (ps.maxScore ?? 0);
    }, 0);
  }, [selectedSubjects, newTest.perSubject, newTest.maxScore]);

  const createValidationFailed = useMemo(() => {
    if (!newTest.title || newTest.selectedSubjectIds.length === 0) return true;
    if (totalNetScore > newTest.maxScore) return true;
    if (selectedSubjects.length > 1) {
      if (createSumSubjectMax !== newTest.maxScore) return true;
      const anyZeroMax = selectedSubjects.some(
        (s) => (newTest.perSubject[s.id] ?? initialPerSubject()).maxScore <= 0
      );
      if (anyZeroMax) return true;
    }
    const anyNetExceedsMax = selectedSubjects.some((s) => {
      const ps = newTest.perSubject[s.id] ?? initialPerSubject();
      const net = ps.score - (ps.negativeMarks ?? 0);
      const maxForSubject =
        selectedSubjects.length > 1 ? (ps.maxScore ?? 0) : newTest.maxScore;
      return maxForSubject > 0 && net > maxForSubject;
    });
    return anyNetExceedsMax;
  }, [
    newTest.title,
    newTest.selectedSubjectIds.length,
    newTest.maxScore,
    newTest.perSubject,
    selectedSubjects,
    totalNetScore,
    createSumSubjectMax,
  ]);

  const editFormSubjects = useMemo(() => {
    if (!editingTest?.subjects?.length || !editForm) return [];
    return editingTest.subjects
      .map((s) => {
        const subWithUnits = subjects.find((u) => u.id === s.subjectId);
        return subWithUnits ? { ...s, subjectWithUnits: subWithUnits } : null;
      })
      .filter(Boolean) as {
      subjectId: number;
      subject?: { name: string };
      score: number;
      negativeMarks?: number;
      maxScore?: number | null;
      subjectWithUnits: SubjectWithUnits;
    }[];
  }, [editingTest, editForm, subjects]);

  const editFormTotalNetScore = useMemo(() => {
    if (!editForm) return 0;
    return Object.entries(editForm.perSubject).reduce(
      (sum, [, ps]) => sum + (ps.score - (ps.negativeMarks ?? 0)),
      0
    );
  }, [editForm]);

  const editFormSumSubjectMax = useMemo(() => {
    if (!editForm || !editFormSubjects.length) return 0;
    const isMultiple = editFormSubjects.length > 1;
    if (!isMultiple) return editForm.maxScore;
    return editFormSubjects.reduce((sum, s) => {
      const ps = editForm.perSubject[s.subjectId] ?? initialPerSubject();
      return sum + (ps.maxScore ?? 0);
    }, 0);
  }, [editForm, editFormSubjects]);

  const editValidationFailed = useMemo(() => {
    if (!editForm || !editForm.title.trim() || !editFormSubjects.length) return true;
    if (editFormTotalNetScore > editForm.maxScore) return true;
    if (editFormSubjects.length > 1) {
      if (editFormSumSubjectMax !== editForm.maxScore) return true;
      const anyZeroMax = editFormSubjects.some(
        (s) => (editForm!.perSubject[s.subjectId] ?? initialPerSubject()).maxScore <= 0
      );
      if (anyZeroMax) return true;
    }
    const anyNetExceedsMax = editFormSubjects.some((s) => {
      const ps = editForm.perSubject[s.subjectId] ?? initialPerSubject();
      const net = ps.score - (ps.negativeMarks ?? 0);
      const maxForSubject =
        editFormSubjects.length > 1 ? (ps.maxScore ?? 0) : editForm.maxScore;
      return maxForSubject > 0 && net > maxForSubject;
    });
    return anyNetExceedsMax;
  }, [editForm, editFormSubjects, editFormTotalNetScore, editFormSumSubjectMax]);

  const handleEditSubmit = () => {
    if (!editingTest || !editForm) return;
    const isMultipleSubjects = editFormSubjects.length > 1;
    const subjectMaxScores = editFormSubjects.map((s) => {
      const ps = editForm.perSubject[s.subjectId] ?? initialPerSubject();
      return isMultipleSubjects ? (ps.maxScore ?? 0) : editForm.maxScore;
    });
    const sumSubjectMax = subjectMaxScores.reduce((a, b) => a + b, 0);

    if (editFormTotalNetScore > editForm.maxScore) {
      toast({
        title: "Total exceeds test max",
        description: `Total net score (${editFormTotalNetScore}) cannot exceed test max score (${editForm.maxScore}).`,
        variant: "destructive",
      });
      return;
    }
    if (isMultipleSubjects) {
      if (sumSubjectMax !== editForm.maxScore) {
        toast({
          title: "Invalid max scores",
          description: `Sum of subject max marks (${sumSubjectMax}) must equal test max score (${editForm.maxScore}).`,
          variant: "destructive",
        });
        return;
      }
      const zeroMax = editFormSubjects.find((s) => (editForm!.perSubject[s.subjectId] ?? initialPerSubject()).maxScore <= 0);
      if (zeroMax) {
        toast({
          title: "Max marks required",
          description: "Each subject must have a max marks value when the test has multiple subjects.",
          variant: "destructive",
        });
        return;
      }
    }
    for (const s of editFormSubjects) {
      const ps = editForm.perSubject[s.subjectId] ?? initialPerSubject();
      const net = ps.score - (ps.negativeMarks ?? 0);
      const maxForSubject = isMultipleSubjects ? (ps.maxScore ?? 0) : editForm.maxScore;
      if (maxForSubject > 0 && net > maxForSubject) {
        toast({
          title: "Marks exceed max",
          description: `${s.subjectWithUnits.name}: scored marks (${net}) cannot exceed max marks for this subject (${maxForSubject}).`,
          variant: "destructive",
        });
        return;
      }
    }

    const subjectsPayload = editFormSubjects.map((s) => {
      const ps = editForm.perSubject[s.subjectId] ?? initialPerSubject();
      const maxScore = isMultipleSubjects ? (ps.maxScore ?? 0) : editForm.maxScore;
      const scope = ps.scope === "custom" ? null : (ps.scope ?? undefined);
      return {
        subjectId: s.subjectId,
        score: ps.score,
        negativeMarks: ps.negativeMarks ?? 0,
        maxScore,
        scope,
        unitIds: ps.unitIds?.length ? ps.unitIds : undefined,
        correctCount: 0,
        incorrectCount: 0,
        unattemptedCount: 0,
      };
    });

    updateTest.mutate(
      {
        test: {
          title: editForm.title,
          testDate: editForm.date,
          maxScore: editForm.maxScore,
          totalScore: editFormTotalNetScore,
          notes: null,
        },
        subjects: subjectsPayload,
      },
      {
        onSuccess: () => {
          closeEditDialog();
        },
        onError: (err) => {
          toast({
            title: "Update failed",
            description: err instanceof Error ? err.message : "Could not update test",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleSubmit = () => {
    const isMultipleSubjects = selectedSubjects.length > 1;
    const subjectMaxScores = selectedSubjects.map((s) => {
      const ps = newTest.perSubject[s.id] ?? initialPerSubject();
      return isMultipleSubjects ? (ps.maxScore ?? 0) : newTest.maxScore;
    });
    const sumSubjectMax = subjectMaxScores.reduce((a, b) => a + b, 0);

    if (totalNetScore > newTest.maxScore) {
      toast({
        title: "Total exceeds test max",
        description: `Total net score (${totalNetScore}) cannot exceed test max score (${newTest.maxScore}).`,
        variant: "destructive",
      });
      return;
    }

    if (isMultipleSubjects) {
      if (sumSubjectMax !== newTest.maxScore) {
        toast({
          title: "Invalid max scores",
          description: `Sum of subject max marks (${sumSubjectMax}) must equal test max score (${newTest.maxScore}).`,
          variant: "destructive",
        });
        return;
      }
      const zeroMax = selectedSubjects.find((s) => (newTest.perSubject[s.id] ?? initialPerSubject()).maxScore <= 0);
      if (zeroMax) {
        toast({
          title: "Max marks required",
          description: "Each subject must have a max marks value when the test has multiple subjects.",
          variant: "destructive",
        });
        return;
      }
    }

    for (const s of selectedSubjects) {
      const ps = newTest.perSubject[s.id] ?? initialPerSubject();
      const net = ps.score - (ps.negativeMarks ?? 0);
      const maxForSubject = isMultipleSubjects ? (ps.maxScore ?? 0) : newTest.maxScore;
      if (maxForSubject > 0 && net > maxForSubject) {
        toast({
          title: "Marks exceed max",
          description: `${s.name}: scored marks (${net}) cannot exceed max marks for this subject (${maxForSubject}).`,
          variant: "destructive",
        });
        return;
      }
    }

    const subjectsPayload = selectedSubjects.map((s) => {
      const ps = newTest.perSubject[s.id] ?? initialPerSubject();
      const maxScore = isMultipleSubjects ? (ps.maxScore ?? 0) : newTest.maxScore;
      const scope = ps.scope === "custom" ? null : (ps.scope ?? undefined);
      return {
        subjectId: s.id,
        score: ps.score,
        negativeMarks: ps.negativeMarks ?? 0,
        maxScore,
        scope,
        unitIds: ps.unitIds?.length ? ps.unitIds : undefined,
        correctCount: 0,
        incorrectCount: 0,
        unattemptedCount: 0,
      };
    });

    createTest.mutate(
      {
        test: {
          title: newTest.title,
          testDate: newTest.date,
          maxScore: newTest.maxScore,
          totalScore,
          notes: null,
        },
        subjects: subjectsPayload,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setNewTest({
            title: "",
            date: format(new Date(), "yyyy-MM-dd"),
            maxScore: 300,
            selectedSubjectIds: [],
            perSubject: {},
          });
        },
      }
    );
  };

  type TestForChart = {
    testDate: string;
    totalScore: number;
    maxScore: number;
    title: string;
    subjects?: { subjectId: number; score: number; negativeMarks?: number; maxScore?: number | null }[];
  };

  const chartData = useMemo(() => {
    const list = (tests ?? []) as TestForChart[];
    const filtered =
      chartSubjectId === "all"
        ? list
        : list.filter((t) => t.subjects?.some((s) => s.subjectId === chartSubjectId));

    return filtered
      .map((t) => {
        const d = t.testDate ? new Date(t.testDate) : null;
        const valid = d && !Number.isNaN(d.getTime());
        let percentage: number;
        if (chartSubjectId === "all") {
          percentage = t.maxScore > 0 ? Math.round((t.totalScore / t.maxScore) * 100) : 0;
        } else {
          const sub = t.subjects?.find((s) => s.subjectId === chartSubjectId);
          const net = sub ? (sub.score ?? 0) - (sub.negativeMarks ?? 0) : 0;
          const subjectMax =
            sub?.maxScore != null && sub.maxScore > 0
              ? sub.maxScore
              : t.maxScore / Math.max(1, t.subjects?.length ?? 1);
          percentage = subjectMax > 0 ? Math.round((net / subjectMax) * 100) : 0;
        }
        return {
          date: valid ? format(d, "MMM d") : "—",
          percentage,
          fullDate: t.testDate || "",
          title: t.title,
        };
      })
      .sort((a, b) => {
        const ta = a.fullDate ? new Date(a.fullDate).getTime() : 0;
        const tb = b.fullDate ? new Date(b.fullDate).getTime() : 0;
        return ta - tb;
      });
  }, [tests, chartSubjectId]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Tests</h1>
          <p className="text-muted-foreground mt-1">Analyze your performance and exam temperament.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Test Result
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto min-w-0 max-w-lg">
            <DialogHeader>
              <DialogTitle>Log Test</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 min-w-0">
              <div className="space-y-2">
                <Label>Test Title</Label>
                <Input
                  placeholder="e.g. Unit Test 3"
                  value={newTest.title}
                  onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newTest.date}
                    onChange={(e) => setNewTest({ ...newTest, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Score (test total)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newTest.maxScore}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0;
                      setNewTest((prev) => {
                        const next = { ...prev, maxScore: v };
                        const n = prev.selectedSubjectIds.length;
                        if (n === 0) return next;
                        if (n === 1) {
                          const sid = prev.selectedSubjectIds[0];
                          next.perSubject = {
                            ...prev.perSubject,
                            [sid]: { ...(prev.perSubject[sid] ?? initialPerSubject()), maxScore: v },
                          };
                        } else {
                          const split = divideScoreEqually(v, n);
                          next.perSubject = { ...prev.perSubject };
                          prev.selectedSubjectIds.forEach((sid, i) => {
                            next.perSubject[sid] = {
                              ...(prev.perSubject[sid] ?? initialPerSubject()),
                              maxScore: split[i] ?? 0,
                              score: split[i] ?? 0,
                            };
                          });
                        }
                        return next;
                      });
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">
                  Subjects in this test (select one or more)
                </Label>
                <div className="flex flex-wrap gap-3">
                  {subjects.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2 hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={newTest.selectedSubjectIds.includes(s.id)}
                        onCheckedChange={() => toggleSubject(s.id)}
                      />
                      <span className="text-sm font-medium">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedSubjects.map((s) => {
                const ps = newTest.perSubject[s.id] ?? initialPerSubject();
                const showUnitList = ps.scope === null;
                return (
                  <div key={s.id} className="rounded-xl border bg-muted/20 p-4 space-y-3">
                    <div className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      {s.name}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Syllabus scope</Label>
                      <div className="flex flex-wrap gap-2">
                        {SCOPE_OPTIONS.map((opt) => (
                          <Button
                            key={opt.value}
                            type="button"
                            variant={ps.scope === opt.value ? "secondary" : "outline"}
                            size="sm"
                            className="text-xs"
                            onClick={() => setSubjectScope(s.id, opt.value)}
                          >
                            {opt.label}
                          </Button>
                        ))}
                        <Button
                          type="button"
                          variant={ps.scope === null ? "secondary" : "outline"}
                          size="sm"
                          className="text-xs"
                          onClick={() => setSubjectScope(s.id, "custom")}
                        >
                          Custom units
                        </Button>
                      </div>
                      {showUnitList && (
                        <div className="mt-2 pl-1 space-y-1 max-h-32 overflow-y-auto">
                          {s.units.map((u) => (
                            <label
                              key={u.id}
                              className="flex items-center gap-2 cursor-pointer text-sm"
                            >
                              <Checkbox
                                checked={ps.unitIds.includes(u.id)}
                                onCheckedChange={() => toggleUnit(s.id, u.id)}
                              />
                              <span>{u.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={`grid gap-3 pt-2 ${selectedSubjects.length > 1 ? "grid-cols-3" : "grid-cols-2"}`}>
                      <div className="space-y-1">
                        <Label className="text-xs">Marks scored</Label>
                        <Input
                          type="number"
                          min={0}
                          className="w-full"
                          value={ps.score || ""}
                          onChange={(e) => setSubjectScore(s.id, parseInt(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Negative marks</Label>
                        <Input
                          type="number"
                          min={0}
                          className="w-full"
                          value={ps.negativeMarks || ""}
                          onChange={(e) => setSubjectNegativeMarks(s.id, parseInt(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      {selectedSubjects.length > 1 && (
                        <div className="space-y-1">
                          <Label className="text-xs">Max marks (this subject)</Label>
                          <Input
                            type="number"
                            min={0}
                            className="w-full"
                            value={ps.maxScore ?? ""}
                            onChange={(e) => setSubjectMaxScore(s.id, parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      )}
                    </div>
                    {(ps.score > 0 || (ps.negativeMarks ?? 0) > 0) && (
                      <p className="text-xs text-muted-foreground">
                        Positive (raw): {ps.score + (ps.negativeMarks ?? 0)} marks
                      </p>
                    )}
                  </div>
                );
              })}

              {selectedSubjects.length > 0 && (
                <div className="pt-2 border-t space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total net score</span>
                    <span className="font-bold">{totalNetScore}</span>
                  </div>
                  {totalNetScore > newTest.maxScore && (
                    <p className="text-xs text-destructive">Cannot exceed test max score ({newTest.maxScore})</p>
                  )}
                  {selectedSubjects.length > 1 && createSumSubjectMax !== newTest.maxScore && (
                    <p className="text-xs text-destructive">
                      Sum of subject max marks ({createSumSubjectMax}) must equal test max score ({newTest.maxScore})
                    </p>
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={createValidationFailed || createTest.isPending}
              className="w-full"
            >
              Save Result
            </Button>
          </DialogContent>
        </Dialog>

        {/* View / Edit Test Dialog */}
        <Dialog open={!!editingTest} onOpenChange={(open) => !open && closeEditDialog()}>
          <DialogContent className="max-h-[90vh] overflow-y-auto min-w-0 max-w-lg">
            <DialogHeader>
              <DialogTitle>Test details</DialogTitle>
            </DialogHeader>
            {editingTest && editForm && (
              <div className="grid gap-4 py-4 min-w-0">
                <div className="space-y-2">
                  <Label>Test Title</Label>
                  <Input
                    placeholder="e.g. Unit Test 3"
                    value={editForm.title}
                    onChange={(e) => setEditForm((p) => (p ? { ...p, title: e.target.value } : null))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm((p) => (p ? { ...p, date: e.target.value } : null))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Score (test total)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={editForm.maxScore}
                      onChange={(e) =>
                        setEditForm((p) =>
                          p
                            ? {
                                ...p,
                                maxScore: parseInt(e.target.value) || 0,
                                ...(editFormSubjects.length === 1
                                  ? {
                                      perSubject: {
                                        ...p.perSubject,
                                        [editFormSubjects[0].subjectId]: {
                                          ...(p.perSubject[editFormSubjects[0].subjectId] ?? initialPerSubject()),
                                          maxScore: parseInt(e.target.value) || 0,
                                        },
                                      },
                                    }
                                  : {}),
                              }
                            : null
                        )
                      }
                    />
                  </div>
                </div>

                <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">
                  Subjects
                </Label>
                {editFormSubjects.map((s) => {
                  const ps = editForm.perSubject[s.subjectId] ?? initialPerSubject();
                  const showUnitList = ps.scope === null;
                  const sub = s.subjectWithUnits;
                  return (
                    <div key={s.subjectId} className="rounded-xl border bg-muted/20 p-4 space-y-3">
                      <div className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                        {sub.name}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Syllabus scope</Label>
                        <div className="flex flex-wrap gap-2">
                          {SCOPE_OPTIONS.map((opt) => (
                            <Button
                              key={opt.value}
                              type="button"
                              variant={ps.scope === opt.value ? "secondary" : "outline"}
                              size="sm"
                              className="text-xs"
                              onClick={() => setEditSubjectScope(s.subjectId, opt.value)}
                            >
                              {opt.label}
                            </Button>
                          ))}
                          <Button
                            type="button"
                            variant={ps.scope === null ? "secondary" : "outline"}
                            size="sm"
                            className="text-xs"
                            onClick={() => setEditSubjectScope(s.subjectId, "custom")}
                          >
                            Custom units
                          </Button>
                        </div>
                        {showUnitList && sub.units && (
                          <div className="mt-2 pl-1 space-y-1 max-h-32 overflow-y-auto">
                            {sub.units.map((u) => (
                              <label
                                key={u.id}
                                className="flex items-center gap-2 cursor-pointer text-sm"
                              >
                                <Checkbox
                                  checked={ps.unitIds.includes(u.id)}
                                  onCheckedChange={() => setEditToggleUnit(s.subjectId, u.id)}
                                />
                                <span>{u.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      <div
                        className={`grid gap-3 pt-2 ${editFormSubjects.length > 1 ? "grid-cols-3" : "grid-cols-2"}`}
                      >
                        <div className="space-y-1">
                          <Label className="text-xs">Marks scored</Label>
                          <Input
                            type="number"
                            min={0}
                            value={ps.score || ""}
                            onChange={(e) =>
                              setEditForm((p) =>
                                p
                                  ? {
                                      ...p,
                                      perSubject: {
                                        ...p.perSubject,
                                        [s.subjectId]: {
                                          ...(p.perSubject[s.subjectId] ?? initialPerSubject()),
                                          score: parseInt(e.target.value) || 0,
                                        },
                                      },
                                    }
                                  : null
                              )
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Negative marks</Label>
                          <Input
                            type="number"
                            min={0}
                            value={ps.negativeMarks ?? ""}
                            onChange={(e) =>
                              setEditForm((p) =>
                                p
                                  ? {
                                      ...p,
                                      perSubject: {
                                        ...p.perSubject,
                                        [s.subjectId]: {
                                          ...(p.perSubject[s.subjectId] ?? initialPerSubject()),
                                          negativeMarks: parseInt(e.target.value) || 0,
                                        },
                                      },
                                    }
                                  : null
                              )
                            }
                          />
                        </div>
                        {editFormSubjects.length > 1 && (
                          <div className="space-y-1">
                            <Label className="text-xs">Max marks (this subject)</Label>
                            <Input
                              type="number"
                              min={0}
                              value={ps.maxScore ?? ""}
                              onChange={(e) =>
                                setEditForm((p) =>
                                  p
                                    ? {
                                        ...p,
                                        perSubject: {
                                          ...p.perSubject,
                                          [s.subjectId]: {
                                            ...(p.perSubject[s.subjectId] ?? initialPerSubject()),
                                            maxScore: parseInt(e.target.value) || 0,
                                          },
                                        },
                                      }
                                    : null
                                )
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2 border-t space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total net score</span>
                    <span className="font-bold">{editFormTotalNetScore}</span>
                  </div>
                  {editFormTotalNetScore > editForm.maxScore && (
                    <p className="text-xs text-destructive">
                      Cannot exceed test max score ({editForm.maxScore})
                    </p>
                  )}
                  {editFormSubjects.length > 1 && editFormSumSubjectMax !== editForm.maxScore && (
                    <p className="text-xs text-destructive">
                      Sum of subject max marks ({editFormSumSubjectMax}) must equal test max score ({editForm.maxScore})
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleEditSubmit}
                  disabled={editValidationFailed || updateTest.isPending}
                  className="w-full"
                >
                  Save changes
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Charts */}
      {chartData && chartData.length > 0 ? (
        <div className="glass-card p-6 rounded-2xl overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-bold font-display">Score Progression</h3>
            <Select
              value={chartSubjectId === "all" ? "all" : String(chartSubjectId)}
              onValueChange={(v) => setChartSubjectId(v === "all" ? "all" : Number(v))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 16, left: 8, bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted-foreground/20" />
                <XAxis
                  dataKey="date"
                  className="text-muted-foreground fill-muted-foreground"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine
                  axisLine
                  dy={4}
                />
                <YAxis
                  className="text-muted-foreground fill-muted-foreground"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine
                  axisLine
                  width={32}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: number) => [`${value}%`, "Percentage"]}
                labelFormatter={(label, payload) =>
                  payload?.[0]?.payload?.title ? `${payload[0].payload.title} — ${label}` : label
                }
              />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-muted/20 rounded-2xl border border-dashed">
          <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold">No test data yet</h3>
          <p className="text-muted-foreground">Add your first test result to see analytics.</p>
        </div>
      )}

      {/* Recent Tests List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold font-display">Recent Tests</h3>
        <div className="grid gap-4">
          {tests?.map((test: any) => (
            <div
              key={test.id}
              className="glass-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <h4 className="font-bold text-lg">{test.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(test.testDate), "MMMM d, yyyy")}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => openEditDialog(test)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  View / Edit
                </Button>
              <div className="flex items-center gap-6">
                <div className="hidden md:flex gap-3 flex-wrap">
                  {test.subjects?.map((s: any) => {
                    const net = (s.score ?? 0) - (s.negativeMarks ?? 0);
                    const scopeLabel =
                      s.scope === "class_11"
                        ? "11"
                        : s.scope === "class_12"
                          ? "12"
                          : s.scope === "full"
                            ? "Full"
                            : "";
                    return (
                      <div key={s.id} className="text-center px-3 py-1.5 bg-muted rounded-lg min-w-[4rem]">
                        <div className="text-xs text-muted-foreground uppercase font-bold">
                          {s.subject?.name?.slice(0, 3)}
                          {scopeLabel && ` · ${scopeLabel}`}
                        </div>
                        <div className="font-bold">{net}</div>
                        {(s.negativeMarks ?? 0) > 0 && (
                          <div className="text-[10px] text-muted-foreground">
                            −{s.negativeMarks}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="text-right pl-4 border-l border-border">
                  <div className="text-2xl font-display font-bold text-primary">
                    {test.totalScore}
                    <span className="text-sm text-muted-foreground font-normal">/{test.maxScore}</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">Total Score</div>
                </div>
              </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
