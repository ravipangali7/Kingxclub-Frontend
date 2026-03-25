import { Button } from "@/components/ui/button";

export function RejectReasonSuggestionsRow({
  suggestions,
  onSelect,
}: {
  suggestions: string[];
  onSelect: (text: string) => void;
}) {
  if (!suggestions.length) return null;
  return (
    <div className="overflow-x-auto flex gap-2 pb-1 -mx-1 px-1 max-w-full">
      {suggestions.map((s) => (
        <Button
          key={s}
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0 rounded-full h-8 text-xs max-w-[200px] truncate"
          title={s}
          onClick={() => onSelect(s)}
        >
          {s}
        </Button>
      ))}
    </div>
  );
}
