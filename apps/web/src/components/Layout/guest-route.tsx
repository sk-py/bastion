import { Navigate, Outlet } from "react-router";
import BastionLoader from "./bastion-loader";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";

export function GuestRoute() {
    const { data: user, isPending } = useCurrentUser();

    if (isPending) {
        return <BastionLoader />;
    }

    if (user?.mustChangePassword) {
        return <Navigate to="/setup" replace />;
    }

    if (user) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}