import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSiteSettingFieldJson } from "@/hooks/useSiteSettingField";
import { SectionTitleSvg, CategoryGamesEditor, type CategoryGamesEntry } from "@/components/admin/SiteJsonSectionEditor";
import { getCategoriesAdmin, getGamesAdmin } from "@/api/admin";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface SectionJson {
  section_title?: string;
  section_svg?: string;
  categories?: CategoryGamesEntry[];
}

interface GameAdmin {
  id: number;
  name: string;
  category?: number;
  provider_name?: string;
}

export default function PowerhouseSiteHomeCategoryGame() {
  const { value, setValue, save, isLoading, isSaving } = useSiteSettingFieldJson("site_categories_game_json");
  const { data: categoriesRaw = [] } = useQuery({ queryKey: ["admin-categories"], queryFn: getCategoriesAdmin });
  const { data: gamesRaw = [] } = useQuery({ queryKey: ["admin-games"], queryFn: getGamesAdmin });

  const allCategories = (categoriesRaw as { id: number; name: string }[]).map((c) => ({ id: c.id, name: c.name }));
  const allGames = (gamesRaw as GameAdmin[]).map((g) => ({
    id: g.id,
    name: g.name,
    category: g.category,
    provider_name: g.provider_name,
  }));

  const section = (value as SectionJson) || {};
  const handleSave = async () => {
    const ok = await save();
    if (ok) toast({ title: "Saved." });
    else toast({ title: "Failed to save.", variant: "destructive" });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col gap-1">
        <Link to="/powerhouse/site-settings" className="text-sm text-primary hover:underline">
          ← Site Setting
        </Link>
        <h1 className="font-display font-bold text-2xl tracking-tight">Home Category Game</h1>
        <p className="text-sm text-muted-foreground">
          Each category becomes a section with its own game list. When a category is selected, search games by name or provider name.
        </p>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Categories → Game lists</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SectionTitleSvg
            sectionTitle={section.section_title ?? ""}
            sectionSvg={section.section_svg ?? ""}
            onTitleChange={(v) => setValue({ ...section, section_title: v })}
            onSvgChange={(v) => setValue({ ...section, section_svg: v })}
          />
          <CategoryGamesEditor
            allCategories={allCategories}
            allGames={allGames}
            value={section.categories ?? []}
            onChange={(cats) => setValue({ ...section, categories: cats })}
          />
        </CardContent>
      </Card>
      <Button onClick={handleSave} disabled={isLoading || isSaving}>
        {isSaving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
