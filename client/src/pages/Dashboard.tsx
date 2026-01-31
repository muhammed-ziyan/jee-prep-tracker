import { useDashboardStats } from "@/hooks/use-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { StatCard } from "@/components/StatCard";
import { 
  TrendingUp, 
  CalendarClock, 
  ListTodo, 
  BookOpen, 
  AlertCircle
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const syllabusData = stats?.syllabusCompletion.map(s => ({
    name: s.subjectName,
    value: s.percentage,
    color: s.subjectName === 'Physics' ? 'var(--chart-physics)' : 
           s.subjectName === 'Chemistry' ? 'var(--chart-chemistry)' : 
           'var(--chart-maths)'
  })) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Welcome back, {user?.firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-2">Here's your prep overview for today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Study Hours" 
          value={stats?.totalStudyHours || 0} 
          icon={TrendingUp} 
          className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-background"
          colorClass="text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300"
        />
        <StatCard 
          title="Questions Solved" 
          value={stats?.questionsSolved || 0} 
          icon={BookOpen}
          colorClass="text-teal-600 bg-teal-100 dark:bg-teal-900 dark:text-teal-300"
        />
        <StatCard 
          title="Revision Due" 
          value={stats?.revisionDue || 0} 
          icon={CalendarClock}
          colorClass="text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300"
          trend={stats?.revisionDue ? "High Priority" : undefined}
          trendUp={false}
        />
        <StatCard 
          title="Backlog Items" 
          value={stats?.backlogCount || 0} 
          icon={AlertCircle}
          colorClass="text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Syllabus Completion Chart */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold font-display mb-6">Syllabus Completion</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={syllabusData} layout="vertical" margin={{ left: 40 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={80} tick={{fill: 'currentColor'}} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                  {syllabusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Center */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-center items-center text-center space-y-6">
          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <ListTodo className="h-10 w-10" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-display">Ready to study?</h3>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
              Log a new study session or add a test to keep your streak alive.
            </p>
          </div>
          <div className="flex gap-4">
             {/* Future: Add link to log study session */}
             <div className="px-4 py-2 bg-muted rounded-lg text-sm text-muted-foreground font-medium">
               Quick Actions Coming Soon
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
