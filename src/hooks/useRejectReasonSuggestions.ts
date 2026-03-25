import { useQuery } from "@tanstack/react-query";
import { getRejectReasonSuggestions, type AdminRole } from "@/api/admin";

export function useRejectReasonSuggestions(role: AdminRole) {
  return useQuery({
    queryKey: ["reject-reason-suggestions", role],
    queryFn: () => getRejectReasonSuggestions(role),
    staleTime: 60_000,
  });
}
