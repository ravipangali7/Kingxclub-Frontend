import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export interface ListDateRangeToolbarProps {
  dateFrom: string;
  dateTo: string;
  onDateChange: (params: { dateFrom: string; dateTo: string }) => void;
  onLoad: () => void | Promise<unknown>;
  loading?: boolean;
  className?: string;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function ListDateRangeToolbar({
  dateFrom,
  dateTo,
  onDateChange,
  onLoad,
  loading = false,
  className = "",
}: ListDateRangeToolbarProps) {
  const [loadBusy, setLoadBusy] = useState(false);
  const busy = loading || loadBusy;

  const handleLoad = async () => {
    setLoadBusy(true);
    try {
      await Promise.resolve(onLoad());
    } finally {
      setLoadBusy(false);
    }
  };

  const setRange = (preset: "all" | "24h" | "week" | "month") => {
    if (preset === "all") {
      onDateChange({ dateFrom: "", dateTo: "" });
      return;
    }
    const now = new Date();
    const end = new Date(now);
    let start: Date;
    if (preset === "24h") {
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (preset === "week") {
      start = new Date(now);
      start.setDate(start.getDate() - 7);
    } else {
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
    }
    onDateChange({
      dateFrom: toISODate(start),
      dateTo: toISODate(end),
    });
  };

  return (
    <div className={`rounded-lg border-2 border-primary/25 bg-gradient-to-r from-primary/10 via-muted/10 to-accent/10 p-3 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Start date</span>
          <Input
            type="date"
            className="w-40 h-10 text-sm border-primary/30"
            value={dateFrom}
            onChange={(e) => onDateChange({ dateFrom: e.target.value, dateTo })}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">End date</span>
          <Input
            type="date"
            className="w-40 h-10 text-sm border-primary/30"
            value={dateTo}
            onChange={(e) => onDateChange({ dateFrom, dateTo: e.target.value })}
          />
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Range</span>
          <select
            className="h-10 rounded-md border border-primary/30 bg-background px-3 text-sm min-w-[160px]"
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value as "" | "all" | "24h" | "week" | "month";
              if (v) setRange(v);
              e.target.value = "";
            }}
          >
            <option value="">Select range</option>
            <option value="all">All time</option>
            <option value="24h">Last 24 Hour</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 justify-end">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide invisible">Load</span>
          <Button
            type="button"
            size="sm"
            className="h-10 gold-gradient text-primary-foreground font-semibold min-w-[100px] px-5 shadow-sm"
            onClick={() => void handleLoad()}
            disabled={busy}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load"}
          </Button>
        </div>
      </div>
    </div>
  );
}
