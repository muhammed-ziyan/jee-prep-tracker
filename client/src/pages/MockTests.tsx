import { useState } from "react";
import { useMockTests, useCreateMockTest } from "@/hooks/use-mock-tests";
import { useSyllabus } from "@/hooks/use-syllabus";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { Plus, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import type { SubjectWithUnits } from "@shared/schema";

export default function MockTests() {
  const { data: tests, isLoading } = useMockTests();
  const { data: syllabus } = useSyllabus();
  const createTest = useCreateMockTest();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    maxScore: 300,
    scores: {} as Record<string, number> // subjectId -> score
  });

  const subjects = (syllabus || []) as SubjectWithUnits[];

  const handleScoreChange = (subjectId: number, score: string) => {
    setNewTest({
      ...newTest,
      scores: { ...newTest.scores, [subjectId]: parseInt(score) || 0 }
    });
  };

  const handleSubmit = () => {
    const totalScore = Object.values(newTest.scores).reduce((a, b) => a + b, 0);
    
    // Prepare data strictly according to schema
    const testPayload = {
      test: {
        title: newTest.title,
        date: newTest.date,
        maxScore: newTest.maxScore,
        totalScore,
        notes: null
      },
      subjects: subjects.map(s => ({
        subjectId: s.id,
        score: newTest.scores[s.id] || 0,
        correctCount: 0, // Simplified for now
        incorrectCount: 0,
        unattemptedCount: 0
      }))
    };

    createTest.mutate(testPayload, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewTest({ title: "", date: format(new Date(), "yyyy-MM-dd"), maxScore: 300, scores: {} });
      }
    });
  };

  if (isLoading) return <div>Loading...</div>;

  const chartData = tests?.map(t => ({
    date: format(new Date(t.date), "MMM d"),
    score: t.totalScore,
    fullDate: t.date,
    title: t.title
  })).sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Mock Test Analytics</h1>
          <p className="text-muted-foreground mt-1">Analyze your performance and exam temperament.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Test Result
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Mock Test</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Test Title</Label>
                <Input 
                  placeholder="e.g. Allen Major Test 3"
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
                  <Label>Max Score</Label>
                  <Input 
                    type="number"
                    value={newTest.maxScore}
                    onChange={(e) => setNewTest({ ...newTest, maxScore: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              
              <div className="space-y-3 pt-2">
                <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Subject Scores</Label>
                {subjects.map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <Label>{s.name}</Label>
                    <Input 
                      type="number" 
                      className="w-24 text-right" 
                      placeholder="0"
                      onChange={(e) => handleScoreChange(s.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={!newTest.title || createTest.isPending}>
              Save Result
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Charts */}
      {chartData && chartData.length > 0 ? (
        <div className="glass-card p-6 rounded-2xl h-80">
          <h3 className="text-lg font-bold font-display mb-4">Score Progression</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3} 
                dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="p-12 text-center bg-muted/20 rounded-2xl border border-dashed">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold">No test data yet</h3>
          <p className="text-muted-foreground">Add your first mock test result to see analytics.</p>
        </div>
      )}

      {/* Recent Tests List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold font-display">Recent Tests</h3>
        <div className="grid gap-4">
          {tests?.map((test: any) => (
            <div key={test.id} className="glass-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-lg">{test.title}</h4>
                <p className="text-sm text-muted-foreground">{format(new Date(test.date), "MMMM d, yyyy")}</p>
              </div>
              
              <div className="flex items-center gap-6">
                 {/* Subject scores breakdown */}
                 <div className="hidden md:flex gap-3">
                   {test.subjects?.map((s: any) => (
                     <div key={s.id} className="text-center px-3 py-1 bg-muted rounded-lg">
                       <div className="text-xs text-muted-foreground uppercase font-bold">{s.subject?.name?.slice(0, 3)}</div>
                       <div className="font-bold">{s.score}</div>
                     </div>
                   ))}
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
          ))}
        </div>
      </div>
    </div>
  );
}
