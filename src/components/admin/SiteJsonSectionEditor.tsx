/**
 * Reusable building blocks for editing site setting JSON section configs in powerhouse.
 * Each section has: section_title, section_svg (image URL/path), and section-specific selectors.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { ImageUploadWithPreview } from "@/components/shared/ImageUploadWithPreview";
import { uploadSiteMedia } from "@/api/admin";

interface BaseItem {
  id: number;
  name: string;
}

// -----------------------------------------------------------------------
// SectionTitleSvg – shared title + section icon (image upload with preview)
// -----------------------------------------------------------------------
interface SectionTitleSvgProps {
  sectionTitle: string;
  sectionSvg: string;
  onTitleChange: (v: string) => void;
  onSvgChange: (v: string) => void;
}

export function SectionTitleSvg({ sectionTitle, sectionSvg, onTitleChange, onSvgChange }: SectionTitleSvgProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Section title</label>
        <Input value={sectionTitle} onChange={(e) => onTitleChange(e.target.value)} placeholder="e.g. Top Games" />
      </div>
      <div>
        <ImageUploadWithPreview
          value={sectionSvg || undefined}
          onChange={(file, url) => {
            if (url !== undefined) onSvgChange(url);
            else if (file === null) onSvgChange("");
          }}
          onUpload={async (file) => (await uploadSiteMedia(file)).url}
          label="Section icon (image)"
        />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// OrderedIdSelector – select + order multiple items from a list by id
// -----------------------------------------------------------------------
interface OrderedIdSelectorProps {
  label: string;
  allItems: BaseItem[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export function OrderedIdSelector({ label, allItems, selectedIds, onChange }: OrderedIdSelectorProps) {
  const [search, setSearch] = useState("");

  const available = allItems.filter(
    (item) => !selectedIds.includes(item.id) && item.name.toLowerCase().includes(search.toLowerCase())
  );
  const selected = selectedIds
    .map((id) => allItems.find((i) => i.id === id))
    .filter(Boolean) as BaseItem[];

  const add = (id: number) => onChange([...selectedIds, id]);
  const remove = (id: number) => onChange(selectedIds.filter((x) => x !== id));
  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const n = [...selectedIds];
    [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]];
    onChange(n);
  };
  const moveDown = (idx: number) => {
    if (idx === selectedIds.length - 1) return;
    const n = [...selectedIds];
    [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]];
    onChange(n);
  };

  return (
    <div className="space-y-3">
      {/* Selected items (ordered) */}
      {selected.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Selected {label} (drag order via arrows)</p>
          {selected.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5 text-sm">
              <span className="flex-1 truncate">{item.name}</span>
              <Button type="button" size="icon" variant="ghost" className="h-6 w-6" disabled={idx === 0} onClick={() => moveUp(idx)}>
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-6 w-6" disabled={idx === selected.length - 1} onClick={() => moveDown(idx)}>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => remove(item.id)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Available items */}
      <div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${label}…`}
          className="mb-2 h-8 text-sm"
        />
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
          {available.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => add(item.id)}
              className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-0.5 text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Plus className="h-3 w-3" />
              {item.name}
            </button>
          ))}
          {available.length === 0 && (
            <p className="text-xs text-muted-foreground">
              {allItems.length === 0 ? `No ${label} available.` : "All items selected."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// OrderedIdSelectorWithProviderFilter – like OrderedIdSelector but filters by game name + provider name
// -----------------------------------------------------------------------
export interface GameWithProvider extends BaseItem {
  provider_name?: string;
  category?: number;
}

interface OrderedIdSelectorWithProviderFilterProps {
  label: string;
  allItems: GameWithProvider[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export function OrderedIdSelectorWithProviderFilter({
  label,
  allItems,
  selectedIds,
  onChange,
}: OrderedIdSelectorWithProviderFilterProps) {
  const [search, setSearch] = useState("");

  const searchLower = search.toLowerCase().trim();
  const match = (item: GameWithProvider) => {
    if (!searchLower) return true;
    const name = (item.name ?? "").toLowerCase();
    const provider = (item.provider_name ?? "").toLowerCase();
    return name.includes(searchLower) || provider.includes(searchLower);
  };

  const available = allItems.filter((item) => !selectedIds.includes(item.id) && match(item));
  const selected = selectedIds
    .map((id) => allItems.find((i) => i.id === id))
    .filter(Boolean) as GameWithProvider[];

  const add = (id: number) => onChange([...selectedIds, id]);
  const remove = (id: number) => onChange(selectedIds.filter((x) => x !== id));
  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const n = [...selectedIds];
    [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]];
    onChange(n);
  };
  const moveDown = (idx: number) => {
    if (idx === selectedIds.length - 1) return;
    const n = [...selectedIds];
    [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]];
    onChange(n);
  };

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Selected {label} (order via arrows)</p>
          {selected.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5 text-sm">
              <span className="flex-1 truncate">{item.name}</span>
              {item.provider_name && <span className="text-xs text-muted-foreground truncate max-w-[120px]">{item.provider_name}</span>}
              <Button type="button" size="icon" variant="ghost" className="h-6 w-6" disabled={idx === 0} onClick={() => moveUp(idx)}>
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-6 w-6" disabled={idx === selected.length - 1} onClick={() => moveDown(idx)}>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => remove(item.id)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by game or provider name…"
          className="mb-2 h-8 text-sm"
        />
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
          {available.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => add(item.id)}
              className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-0.5 text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Plus className="h-3 w-3" />
              {item.name}
              {item.provider_name && <span className="opacity-70">({item.provider_name})</span>}
            </button>
          ))}
          {available.length === 0 && (
            <p className="text-xs text-muted-foreground">
              {allItems.length === 0 ? `No ${label} in this category.` : selectedIds.length >= allItems.length ? "All selected." : "No matches."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// CategoryGamesEditor – categories[{category_id, game_ids, section_title?, section_icon?}] editor
// -----------------------------------------------------------------------
export interface CategoryGamesEntry {
  category_id: number;
  game_ids: number[];
  section_title?: string;
  section_icon?: string;
}

interface CategoryGamesEditorProps {
  allCategories: BaseItem[];
  allGames: (BaseItem & { provider_name?: string; category?: number })[];
  value: CategoryGamesEntry[];
  onChange: (v: CategoryGamesEntry[]) => void;
}

export function CategoryGamesEditor({ allCategories, allGames, value, onChange }: CategoryGamesEditorProps) {
  const usedCategoryIds = value.map((e) => e.category_id);

  const addCategory = (catId: number) => {
    onChange([...value, { category_id: catId, game_ids: [] }]);
  };
  const removeCategory = (catId: number) => onChange(value.filter((e) => e.category_id !== catId));
  const setGames = (catId: number, gameIds: number[]) =>
    onChange(value.map((e) => e.category_id === catId ? { ...e, game_ids: gameIds } : e));
  const setEntry = (catId: number, patch: Partial<Pick<CategoryGamesEntry, "section_title" | "section_icon">>) =>
    onChange(value.map((e) => (e.category_id === catId ? { ...e, ...patch } : e)));
  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const n = [...value];
    [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]];
    onChange(n);
  };
  const moveDown = (idx: number) => {
    if (idx === value.length - 1) return;
    const n = [...value];
    [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]];
    onChange(n);
  };

  const availableCategories = allCategories.filter((c) => !usedCategoryIds.includes(c.id));
  const hasProviderMeta = allGames.some((g) => "provider_name" in g || "category" in g);

  return (
    <div className="space-y-4">
      {value.map((entry, idx) => {
        const cat = allCategories.find((c) => c.id === entry.category_id);
        const gamesInCategory = hasProviderMeta
          ? (allGames as { id: number; name: string; provider_name?: string; category?: number }[]).filter(
              (g) => g.category === entry.category_id
            )
          : allGames;
        const GameSelector = hasProviderMeta ? OrderedIdSelectorWithProviderFilter : OrderedIdSelector;
        const selectorProps = hasProviderMeta
          ? { label: "games" as const, allItems: gamesInCategory, selectedIds: entry.game_ids, onChange: (ids: number[]) => setGames(entry.category_id, ids) }
          : { label: "games" as const, allItems: gamesInCategory, selectedIds: entry.game_ids, onChange: (ids: number[]) => setGames(entry.category_id, ids) };

        return (
          <div key={entry.category_id} className="rounded-lg border p-4 space-y-3 bg-muted/10">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{cat?.name ?? `Category #${entry.category_id}`}</span>
              <div className="flex gap-1">
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={idx === 0} onClick={() => moveUp(idx)}>
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" disabled={idx === value.length - 1} onClick={() => moveDown(idx)}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeCategory(entry.category_id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Section title (optional)</label>
                <Input
                  value={entry.section_title ?? ""}
                  onChange={(e) => setEntry(entry.category_id, { section_title: e.target.value || undefined })}
                  placeholder="Leave empty to use category name"
                  className="text-sm"
                />
              </div>
              <div>
                <ImageUploadWithPreview
                  value={entry.section_icon ?? undefined}
                  onChange={(file, url) => {
                    if (url !== undefined) setEntry(entry.category_id, { section_icon: url });
                    else if (file === null) setEntry(entry.category_id, { section_icon: undefined });
                  }}
                  onUpload={async (file) => (await uploadSiteMedia(file)).url}
                  label="Section icon (optional)"
                />
              </div>
            </div>
            <GameSelector {...selectorProps} />
          </div>
        );
      })}

      {availableCategories.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Add a category section:</p>
          <div className="flex flex-wrap gap-1.5">
            {availableCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => addCategory(cat.id)}
                className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-0.5 text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Plus className="h-3 w-3" />
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {availableCategories.length === 0 && allCategories.length === 0 && (
        <p className="text-xs text-muted-foreground">No categories available. Create some first.</p>
      )}
    </div>
  );
}
