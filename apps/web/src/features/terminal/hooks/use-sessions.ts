import { useQuery } from "@tanstack/react-query";
import { getSessions } from "@/api/sessions";

export const useSessions = (serverId?: string) => {
  return useQuery({
    queryKey: ["sessions", serverId ?? "all"],
    queryFn: () => getSessions(serverId),
    refetchOnWindowFocus: false,
  });
};