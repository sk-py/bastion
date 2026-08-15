import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { Navigate, Outlet } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import BastionLoader from "./bastion-loader";
import { useMinimumLoadingDuration } from "@/hooks/use-minimum-loading-duration";

const Protected = () => {
  const { data: user, isPending } = useCurrentUser();
  const showLoader = useMinimumLoadingDuration(isPending, 3000);

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