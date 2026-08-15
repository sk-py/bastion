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
  initialSetupSchema,
  type InitialSetupSchema,
} from "@bastion/schemas";

import { cn } from "@/lib/utils";
import { useInitialSetup } from "./hooks/use-initial-setup";
import { Button } from "@/components/ui/button";

const APP_VERSION = "v2.4.0";

export default function SetupPage() {
  const navigate = useNavigate();
  const { mutateAsync: completeSetup, isPending } = useInitialSetup();

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InitialSetupSchema>({
    resolver: zodResolver(initialSetupSchema),
  });

  const onSubmit = async (values: InitialSetupSchema) => {
    setServerError(null);

    try {
      await completeSetup(values);

      navigate("/", { replace: true });
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : "Unable to complete setup. Please try again.",
      );
    }
  };

  const loading = isSubmitting || isPending;

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% -20%, #7D82FB -70%, var(--background) 60%)",
      }}
    >
      {/* Brand */}
      <div className="mb-10 flex flex-col items-center gap-3 text-center">
        <img
          src="/android-chrome-512x512.png"
          alt="Bastion Logo"
          className="size-16 object-contain"
        />

        <div>
          <h2 className="mt-1 text-lg font-semibold text-primary-foreground">
            Welcome to Bastion
          </h2>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-[440px] rounded-3xl border border-border bg-linear-to-b from-card/5 to-card/60  p-8 shadow-2xl backdrop-blur-3xl sm:p-10">
        <div className="mb-8 text-center">

          <p className="text-sm leading-relaxed text-muted-foreground">
            This account was created with temporary credentials. Please set your personal details and a new password before continuing.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-5"
        >
          {/* Name */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <User
                className="h-4 w-4"
                strokeWidth={1.5}
              />
              <span>
                Name <span className="text-red-500">*</span>
              </span>
            </label>

            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              aria-invalid={!!errors.name}
              className={cn(
                "w-full rounded-md border bg-background px-4 py-2.5 text-sm text-foreground",
                "placeholder:text-muted-foreground outline-none transition-colors",
                "focus:border-primary focus:ring-1 focus:ring-primary",
                errors.name
                  ? "border-destructive"
                  : "border-border",
              )}
              {...register("name")}
            />

            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <KeyRound
                className="h-4 w-4"
                strokeWidth={1.5}
              />
              <span>
                New Password <span className="text-red-500">*</span>
              </span>
            </label>

            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Create a new password"
              aria-invalid={!!errors.password}
              className={cn(
                "w-full rounded-md border bg-background px-4 py-2.5 text-sm text-foreground",
                "placeholder:text-muted-foreground outline-none transition-colors",
                "focus:border-primary focus:ring-1 focus:ring-primary",
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

          {serverError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full py-2.5",
              "bg-primary text-primary-foreground font-medium transition-opacity",
              "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Complete Setup
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>

      <p className="absolute bottom-10 text-xs text-muted-foreground/70">
        Self-hosted {APP_VERSION}
      </p>
    </div>
  );
}