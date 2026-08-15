import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import BastionLoader from "./bastion-loader";
import { Navigate, Outlet } from "react-router";

export default function SetupRoute() {
  const { data: user, isPending } = useCurrentUser();

  if (isPending) {
    return <BastionLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.mustChangePassword) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}