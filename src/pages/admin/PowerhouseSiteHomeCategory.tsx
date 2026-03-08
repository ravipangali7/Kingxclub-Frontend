import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSiteSettingFieldJson } from "@/hooks/useSiteSettingField";
import { SectionTitleSvg, OrderedIdSelector } from "@/components/admin/SiteJsonSectionEditor";
import { getCategoriesAdmin } from "@/api/admin";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface SectionJson {
  section_title?: string;
  section_svg?: string;
  category_ids?: number[];
}

export default function PowerhouseSiteHomeCategory() {
  const { value, setValue, save, isLoading, isSaving } = useSiteSettingFieldJson("site_categories_json");
  const { data: categoriesRaw = [] } = useQuery({ queryKey: ["admin-categories"], queryFn: getCategoriesAdmin });
  const allCategories = (categoriesRaw as { id: number; name: string }[]).map((c) => ({ id: c.id, name: c.name }));

  const section = (value as SectionJson) || {};
  const handleSave = async () => {
    const ok = await save();
    if (ok) toast({ title: "Saved." });
    else toast({ title: "Failed to save.", variant: "destructive" });
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col gap-1">
        <Link to="/powerhouse/site-settings" className="text-sm text-primary hover:underline">
          ← Site Setting
        </Link>
        <h1 className="font-display font-bold text-2xl tracking-tight">Home Category</h1>
        <p className="text-sm text-muted-foreground">Categories shown as horizontal slides on the home page.</p>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SectionTitleSvg
            sectionTitle={section.section_title ?? ""}
            sectionSvg={section.section_svg ?? ""}
            onTitleChange={(v) => setValue({ ...section, section_title: v })}
            onSvgChange={(v) => setValue({ ...section, section_svg: v })}
          />
          <OrderedIdSelector
            label="categories"
            allItems={allCategories}
            selectedIds={section.category_ids ?? []}
            onChange={(ids) => setValue({ ...section, category_ids: ids })}
          />
        </CardContent>
      </Card>
      <Button onClick={handleSave} disabled={isLoading || isSaving}>
        {isSaving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
