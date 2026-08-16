import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  KeyRound,
  Loader2,
  User,
} from "lucide-react";

import {
  loginSchema,
  type LoginSchema,
} from "@bastion/schemas";

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
      const user = await login(values);

      if (user.mustChangePassword) {
        navigate("/setup", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Check your credentials.",
      );
    }
  };

  const loading = isSubmitting || isPending;

  return (
    <div
      className="relative flex min-h-screen flex-col bg-background text-foreground"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% -20%, #7D82FB -70%, var(--background) 60%)",
      }}
    >
      {/* Header / Brand */}
      <header className="flex w-full items-center justify-between px-6 py-6 sm:px-8">
        <h1 className="text-base font-bold tracking-tight sm:text-lg">
          Bastion
        </h1>
        <div className="flex items-center gap-3">
          {/* <img
            src="/android-chrome-512x512.png"
            alt="Bastion Logo"
            className="size-9 object-contain sm:size-10"
          /> */}

          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
              Secure. Simple. Seamless.
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[440px]">
          {/* Intro */}
          <div className="mb-7 text-center">
            <div className="mb-5 flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-card/70 text-primary shadow-sm backdrop-blur">
                <img
                  src="/android-chrome-512x512.png"
                  alt="Bastion Logo"
                  className="size-10 object-contain sm:size-12"
                />
              </div>
            </div>

            <h2 className="text-2xl font-semibold tracking-tight">
              Sign in to Bastion
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Enter your credentials to access your workspace.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl p-8 backdrop-blur-xs sm:p-10">
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className=""
            >
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="flex ml-1 items-center gap-2 text-sm font-medium text-muted-foreground"
                >
                  <User
                    className="h-4 w-4"
                    strokeWidth={1.5}
                  />
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="admin@bastion.internal"
                  aria-invalid={!!errors.email}
                  className={cn(
                    "w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground",
                    "placeholder:text-muted-foreground outline-none transition-all",
                    "focus:border-primary focus:ring-2 focus:ring-primary/20",
                    errors.email
                      ? "border-destructive"
                      : "border-border",
                  )}
                  {...register("email")}
                />

                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2 mt-4">
                <label
                  htmlFor="password"
                  className="flex ml-1 mt-4 items-center gap-2 text-sm font-medium text-muted-foreground"
                >
                  <KeyRound
                    className="h-4 w-4"
                    strokeWidth={1.5}
                  />
                  Access Key
                </label>

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••••••••"
                  aria-invalid={!!errors.password}
                  className={cn(
                    "w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground",
                    "placeholder:text-muted-foreground outline-none transition-all",
                    "focus:border-primary focus:ring-2 focus:ring-primary/20",
                    errors.password
                      ? "border-destructive"
                      : "border-border",
                  )}
                  {...register("password")}
                />

                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Server error */}
              {serverError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
                  {serverError}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-full mt-6 py-4",
                  "bg-primary text-primary-foreground font-semibold shadow-md",
                  "transition-all duration-300",
                  "hover:-translate-y-0.5 hover:opacity-90",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {loading ? (
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
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Secure access to your Bastion workspace
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-[13px] text-muted-foreground">
        Self-hosted {APP_VERSION}
      </footer>
    </div>
  );
}