import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { ArrowRight, KeyRound, Loader2, Server, User } from "lucide-react";
import { loginSchema, type LoginSchema } from "@bastion/schemas";
import { cn } from "@/lib/utils";
import { useLogin } from "./hooks/use-login";
import { Button } from "@/components/ui/button";

const APP_VERSION = "v2.4.0";

export default function LoginPage() {
  const navigate = useNavigate();
  const { mutateAsync: login, isPending } = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginSchema) => {
    setServerError(null);
    try {
      await login(values);
      navigate("/");
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Check your credentials.",
      );
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Brand mark */}
      <div className="mb-10 flex flex-col items-center gap-3 text-center">
        <img src="/bastion-logo-cropped.png" className="size-16 object-contain" />
        <div>
          {/* <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Bastion
          </h1> */}
          <p className="mt-1 text-sm text-foreground-muted">
            Log in to Bastion
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-lg p-8">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="flex items-center gap-2 text-sm text-foreground-secondary"
            >
              <User className="h-4 w-4" strokeWidth={1.5} />
              Identity / Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="admin@bastion.internal"
              aria-invalid={!!errors.email}
              className={cn(
                "w-full rounded-md border bg-surface px-4 py-2.5 text-sm text-foreground",
                "placeholder:text-foreground-disabled outline-none transition-colors",
                "focus:border-primary focus:ring-1 focus:ring-primary",
                errors.email ? "border-error" : "border-border",
              )}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-error">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="flex items-center gap-2 text-sm text-foreground-secondary"
            >
              <KeyRound className="h-4 w-4" strokeWidth={1.5} />
              Access Key
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••••••"
              aria-invalid={!!errors.password}
              className={cn(
                "w-full rounded-md border bg-surface px-4 py-2.5 text-sm text-foreground",
                "placeholder:text-foreground-disabled outline-none transition-colors",
                "focus:border-primary focus:ring-1 focus:ring-primary",
                errors.password ? "border-error" : "border-border",
              )}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-error">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <p className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-xs text-error">
              {serverError}
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md py-2.5",
              "bg-foreground text-sm text-white dark:text-black dark:hover:text-white font-medium transition-opacity",
              "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer",
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                Initialize Session
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* <div className="mt-6 flex items-center justify-between border-t border-border-subtle pt-6 text-sm text-foreground-muted">
          <span>Forgot Password</span>
        
          <span className="cursor-not-allowed opacity-70" title="Coming soon">
            Recover
          </span>
        </div> */}
      </div>

      <p className="absolute bottom-10 text-xs text-foreground-disabled/70">
        Self-hosted {APP_VERSION}
      </p>
    </div>
  );
}