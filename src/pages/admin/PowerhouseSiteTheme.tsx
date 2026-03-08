import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSiteSettingFieldTheme } from "@/hooks/useSiteSettingField";
import { SITE_THEME_KEYS } from "@/lib/siteThemeKeys";
import { toast } from "@/hooks/use-toast";

export default function PowerhouseSiteTheme() {
  const { value, setValue, save, isLoading, isSaving } = useSiteSettingFieldTheme();

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
        <h1 className="font-display font-bold text-2xl tracking-tight">Site Theme</h1>
        <p className="text-sm text-muted-foreground">Color overrides for website and player. Supports hex, rgb, hsl, cmyk, hsv. Leave empty for default.</p>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Theme / Colors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SITE_THEME_KEYS.map((key) => (
              <div key={key}>
                <label className="text-sm font-medium mb-1.5 block">{key.replace(/_/g, " ")}</label>
                <Input
                  value={value[key] ?? ""}
                  onChange={(e) => setValue({ ...value, [key]: e.target.value })}
                  placeholder="e.g. #c00 or 220 90% 56%"
                  className="font-mono text-sm"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Button onClick={handleSave} disabled={isLoading || isSaving}>
        {isSaving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
