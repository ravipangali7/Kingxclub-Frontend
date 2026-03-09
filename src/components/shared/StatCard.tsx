import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export const StatCard = ({ title, value, icon: Icon, trend, trendUp, className }: StatCardProps) => {
  return (
    <Card className={`theme-card min-w-0 ${className || ""}`}>
      <CardHeader className="flex flex-row items-center justify-between p-2 mobile:p-4 pb-1 mobile:pb-2">
        <CardTitle className="text-[10px] mobile:text-xs font-medium text-muted-foreground truncate">{title}</CardTitle>
        <div className="h-6 w-6 mobile:h-8 mobile:w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
          <Icon className="h-3 w-3 mobile:h-4 mobile:w-4" />
        </div>
      </CardHeader>
      <CardContent className="p-2 mobile:p-4 pt-0">
        <div className="text-sm mobile:text-lg md:text-xl font-gaming font-bold truncate">{typeof value === "number" ? value.toLocaleString() : value}</div>
        {trend && (
          <p className={`text-[10px] mt-1 ${trendUp ? "text-success" : "text-destructive"}`}>
            {trendUp ? "↑" : "↓"} {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
