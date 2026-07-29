import { useCurrentUser } from "@/features/auth/hooks/use-current-user"
import { Navigate, Outlet } from "react-router"
import BastionLoader from "./BastionLoader"

const Protected = () => {
    const { data: user, isPending } = useCurrentUser()

    if (isPending) {
        return <BastionLoader  />
    }

    if (!user) {
        return <Navigate to={"/login"} replace />
    }

    return <Outlet />
}

export default Protected
