import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { Navigate, Outlet, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import BastionLoader from "./bastion-loader";
import { useMinimumLoadingDuration } from "@/hooks/use-minimum-loading-duration";
import { appRoutes } from "../sidebar/sidebar-routes";

const Protected = () => {
  const { data: user, isPending } = useCurrentUser();
  const location = useLocation();

  const showLoader = useMinimumLoadingDuration(isPending, 3000);

  const currentRoute = appRoutes.find((route) => {
    if (route.link === location.pathname) {
      return true;
    }

    return route.subs?.some(
      (subRoute) => subRoute.link === location.pathname,
    );
  });

  const currentSubRoute = currentRoute?.subs?.find(
    (subRoute) => subRoute.link === location.pathname,
  );

  const allowed =
    !currentRoute ||
    currentSubRoute?.roles.includes(user?.role ?? "member") ||
    currentRoute.roles.includes(user?.role ?? "member");

  return (
    <AnimatePresence mode="wait">
      {showLoader ? (
        <motion.div
          key="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <BastionLoader />
        </motion.div>
      ) : !user ? (
        <Navigate to="/login" replace />
      ) : user.mustChangePassword ? (
        <Navigate to="/setup" replace />
      ) : !allowed ? (
        <Navigate to="/" replace />
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <Outlet />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Protected;