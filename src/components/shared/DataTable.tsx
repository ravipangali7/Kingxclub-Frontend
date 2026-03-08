import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight, Plus, ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  /** If provided, enables sorting by this key from the row object. */
  sortKey?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKey?: keyof T;
  onAdd?: () => void;
  addLabel?: string;
  secondaryAction?: { label: string; onClick: () => void };
  pageSize?: number;
  /** Use "adminListing" for master/super listing pages: colorful header, striped rows, styled pagination */
  variant?: "default" | "adminListing";
  /** Optional row class (e.g. red background for inactive) */
  getRowClassName?: (row: T) => string;
}

type SortDir = "asc" | "desc";

export function DataTable<T extends { id: string | number }>({
  data, columns, searchPlaceholder = "Search...", searchKey, onAdd, addLabel = "Add New", secondaryAction, pageSize = 10,
  variant = "default", getRowClassName,
}: DataTableProps<T>) {
  const isThemed = variant === "adminListing";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  const safeData = Array.isArray(data) ? data : [];

  const filtered = useMemo(() => {
    let rows = searchKey
      ? safeData.filter((row) => String(row[searchKey]).toLowerCase().includes(search.toLowerCase()))
      : safeData;

    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        const av = (a as Record<string, unknown>)[sortKey];
        const bv = (b as Record<string, unknown>)[sortKey];
        const an = Number(av);
        const bn = Number(bv);
        let cmp = 0;
        if (!isNaN(an) && !isNaN(bn)) {
          cmp = an - bn;
        } else {
          cmp = String(av ?? "").localeCompare(String(bv ?? ""));
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return rows;
  }, [safeData, search, searchKey, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageData = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const SortIcon = ({ col }: { col: Column<T> }) => {
    if (!col.sortKey) return null;
    if (sortKey !== col.sortKey) return <ChevronsUpDown className="h-3 w-3 ml-0.5 text-muted-foreground/50 inline" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 ml-0.5 text-primary inline" />
      : <ChevronDown className="h-3 w-3 ml-0.5 text-primary inline" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 h-9 sm:h-9 text-sm min-h-[44px] sm:min-h-0"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          {onAdd && (
            <Button onClick={onAdd} size="sm" className="gold-gradient text-primary-foreground gap-1 min-h-[44px] sm:min-h-9 px-4">
              <Plus className="h-3 w-3" /> {addLabel}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline" size="sm" className="gap-1 min-h-[44px] sm:min-h-9 px-4">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>

      <div className={`rounded-lg overflow-hidden min-w-0 ${isThemed ? "border-2 border-primary/40 shadow-md bg-gradient-to-b from-primary/5 to-transparent" : "border"}`}>
        <div className="overflow-x-auto -mx-px" style={{ WebkitOverflowScrolling: "touch" }}>
          <Table className={`min-w-[600px] ${isThemed ? "[&_th]:border-b [&_th]:border-primary/30 [&_td]:border-b [&_td]:border-primary/15" : ""}`}>
            <TableHeader>
              <TableRow className={isThemed ? "bg-primary border-b-2 border-primary text-primary-foreground shadow-sm" : "bg-muted/50"}>
                {columns.map((col, i) => (
                  <TableHead
                    key={i}
                    className={`text-xs whitespace-nowrap font-semibold ${isThemed ? "text-primary-foreground hover:bg-primary/90" : ""} ${col.className || ""} ${col.sortKey ? "cursor-pointer select-none transition-colors" : ""} ${!isThemed && col.sortKey ? "hover:bg-muted/80" : ""}`}
                    onClick={col.sortKey ? () => handleSort(col.sortKey!) : undefined}
                  >
                    {col.header}
                    <SortIcon col={col} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground py-8">
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                pageData.map((row, rowIndex) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      isThemed
                        ? `transition-colors hover:bg-primary/15 ${rowIndex % 2 === 1 ? "bg-muted/40" : "bg-background/80"}`
                        : "hover:bg-muted/30 transition-colors",
                      getRowClassName?.(row)
                    )}
                  >
                    {columns.map((col, i) => {
                      const cellTint = isThemed && (i % 3 === 0 ? "bg-primary/5" : i % 3 === 1 ? "bg-accent/5" : "bg-muted/20");
                      return (
                        <TableCell key={i} className={`text-sm ${col.className || ""} ${cellTint || ""}`}>
                          {typeof col.accessor === "function" ? col.accessor(row) : String(row[col.accessor] ?? "")}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div
          className={
            isThemed
              ? "flex items-center justify-between text-xs rounded-lg border-2 border-primary/25 bg-gradient-to-r from-primary/10 to-accent/10 px-3 py-2 font-medium"
              : "flex items-center justify-between text-xs text-muted-foreground"
          }
        >
          <span>{filtered.length} items</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span>{page + 1} / {totalPages}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
