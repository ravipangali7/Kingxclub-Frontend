import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPlayerReferralDetail } from "@/api/player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User } from "lucide-react";

const PlayerReferralDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["player-referral-detail", id],
    queryFn: () => getPlayerReferralDetail(id!),
    enabled: !!id,
  });

  if (isLoading || (!data && !error)) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <p className="text-muted-foreground">{isLoading ? "Loading…" : "No data."}</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <p className="text-destructive">Failed to load referral details.</p>
        <Button variant="outline" size="sm" className="mt-2" asChild>
          <Link to="/player/referral">
            <ArrowLeft className="h-3 w-3 mr-1" /> Back to Refer & Earn
          </Link>
        </Button>
      </div>
    );
  }
  if (!data) {
    return null;
  }

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between py-2 border-b border-border/50 last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/player/referral" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Refer & Earn
          </Link>
        </Button>
      </div>

      <Card className="gaming-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-gaming">
            <User className="h-5 w-5 text-primary" />
            Referred friend details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {row("Name", data.name || "—")}
          {row("Username", data.username ? `@${data.username}` : "—")}
          {row(
            "Joined",
            data.created_at ? new Date(data.created_at).toLocaleString() : "—"
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerReferralDetailPage;
