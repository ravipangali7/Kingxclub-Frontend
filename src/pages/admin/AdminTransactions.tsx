import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { DataTable } from "@/components/shared/DataTable";
import { getTransactions } from "@/api/admin";

type TxnRow = Record<string, unknown> & { user_username?: string; transaction_type?: string; amount?: string; description?: string; created_at?: string };

const AdminTransactions = () => {
  const { user } = useAuth();
  const role = (user?.role === "powerhouse" || user?.role === "super" || user?.role === "master") ? user.role : "master";
  const { data: transactions = [] } = useQuery({ queryKey: ["admin-transactions", role], queryFn: () => getTransactions(role) });
  const rows = transactions as TxnRow[];

  const columns = [
    { header: "User", accessor: (row: TxnRow) => String(row.user_username ?? row.username ?? "") },
    { header: "Type", accessor: (row: TxnRow) => <span className="capitalize">{String(row.transaction_type ?? row.type ?? "").replace(/_/g, " ")}</span> },
    { header: "Amount", accessor: (row: TxnRow) => `₹${Number(row.amount ?? 0).toLocaleString()}` },
    { header: "Description", accessor: (row: TxnRow) => String(row.description ?? "") },
    { header: "Date", accessor: (row: TxnRow) => row.created_at ? new Date(String(row.created_at)).toLocaleString() : "" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-xl">Transactions</h2>
      <DataTable data={rows} columns={columns} searchKey="user_username" searchPlaceholder="Search transactions..." />
    </div>
  );
};

export default AdminTransactions;
