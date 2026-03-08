import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSiteSettingFieldJson } from "@/hooks/useSiteSettingField";
import { SectionTitleSvg } from "@/components/admin/SiteJsonSectionEditor";
import { toast } from "@/hooks/use-toast";

interface SectionJson {
  section_title?: string;
  section_svg?: string;
  description?: string;
  cta?: string;
  href?: string;
}

export default function PowerhouseSiteHomeReferBonus() {
  const { value, setValue, save, isLoading, isSaving } = useSiteSettingFieldJson("site_refer_bonus_json");
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
        <h1 className="font-display font-bold text-2xl tracking-tight">Home Refer Bonus</h1>
        <p className="text-sm text-muted-foreground">Referral bonus section on the home page.</p>
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
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Description</label>
            <Textarea
              value={section.description ?? ""}
              onChange={(e) => setValue({ ...section, description: e.target.value })}
              placeholder="Short description for the refer bonus block"
              rows={3}
              className="resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">CTA label</label>
            <Input
              value={section.cta ?? ""}
              onChange={(e) => setValue({ ...section, cta: e.target.value })}
              placeholder="e.g. Refer & Earn"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">CTA link (href)</label>
            <Input
              value={section.href ?? ""}
              onChange={(e) => setValue({ ...section, href: e.target.value })}
              placeholder="e.g. /player/referral"
            />
          </div>
        </CardContent>
      </Card>
      <Button onClick={handleSave} disabled={isLoading || isSaving}>
        {isSaving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
