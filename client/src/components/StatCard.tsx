import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  colorClass?: string;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, className, colorClass = "text-primary" }: StatCardProps) {
  return (
    <div className={cn("glass-card p-6 rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300", className)}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-display font-bold mt-2 text-foreground">{value}</h3>
        </div>
        <div className={cn("p-3 rounded-xl bg-background shadow-sm", colorClass)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={cn("font-medium", trendUp ? "text-green-600" : "text-destructive")}>
            {trend}
          </span>
          <span className="text-muted-foreground ml-2">from last month</span>
        </div>
      )}
    </div>
  );
}
