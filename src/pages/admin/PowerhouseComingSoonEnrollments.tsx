import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { getComingSoonEnrollments } from "@/api/admin";

type EnrollmentRow = {
  id: number;
  game: number;
  game_name: string;
  user: number;
  user_username: string;
  created_at: string;
};

const PowerhouseComingSoonEnrollments = () => {
  const { data: list = [] } = useQuery({
    queryKey: ["admin-coming-soon-enrollments"],
    queryFn: getComingSoonEnrollments,
  });
  const rows = (list as EnrollmentRow[]).map((r) => ({ ...r, id: String(r.id) })) as (EnrollmentRow & { id: string })[];

  const columns = [
    { header: "ID", accessor: (row: EnrollmentRow & { id: string }) => row.id },
    { header: "Game", accessor: (row: EnrollmentRow & { id: string }) => row.game_name ?? "—" },
    { header: "User", accessor: (row: EnrollmentRow & { id: string }) => row.user_username ?? "—" },
    {
      header: "Enrolled",
      accessor: (row: EnrollmentRow & { id: string }) =>
        row.created_at ? new Date(row.created_at).toLocaleString() : "—",
    },
    {
      header: "User detail",
      accessor: (row: EnrollmentRow & { id: string }) =>
        row.user != null ? (
          <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
            <Link to={`/powerhouse/players/${row.user}/report`}>View</Link>
          </Button>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Coming Soon Enrollments</h2>
      <p className="text-sm text-muted-foreground">Users who clicked &quot;Notify Me&quot; on coming-soon games. View only.</p>
      <DataTable
        data={rows}
        columns={columns}
        searchKey="user_username"
        searchPlaceholder="Search by username..."
        pageSize={15}
      />
    </div>
  );
};

export default PowerhouseComingSoonEnrollments;
