import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  approved: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  suspended: "bg-crimson/10 text-crimson border-crimson/20",
  rejected: "bg-crimson/10 text-crimson border-crimson/20",
  win: "bg-success/10 text-success border-success/20",
  loss: "bg-crimson/10 text-crimson border-crimson/20",
  lose: "bg-crimson/10 text-crimson border-crimson/20",
  draw: "bg-muted text-muted-foreground border-border",
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <Badge variant="outline" className={`text-[10px] capitalize ${statusStyles[status] || ""}`}>
      {status === "lose" ? "Loss" : status}
    </Badge>
  );
};
