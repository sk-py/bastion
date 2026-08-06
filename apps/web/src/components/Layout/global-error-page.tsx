import { useMemo, type JSX } from "react";
import {
    isRouteErrorResponse,
    useNavigate,
    useRevalidator,
    useRouteError,
} from "react-router";

type KnownStatus = 400 | 401 | 403 | 404 | 500 | 503;

interface GlobalErrorPageProps {
    status?: number;
    message?: string;
    loginPath?: string;
    dashboardPath?: string;
}

const iconProps = {
    viewBox: "0 0 48 48",
    fill: "none" as const,
    width: 48,
    height: 48,
};

interface ErrorConfig {
    title: string;
    description: string;
    actionLabel: string;
    icon: () => JSX.Element;
}

const ERROR_CONFIG: Record<KnownStatus, ErrorConfig> = {
    400: { title: "Bad Request", description: "The server could not understand your request. Please check the input and try again.", actionLabel: "Go Back", icon: Icon400 },
    401: { title: "Unauthorized", description: "You need to sign in to access this resource.", actionLabel: "Sign In", icon: Icon401 },
    403: { title: "Forbidden", description: "You don't have permission to access this resource.", actionLabel: "Go to Dashboard", icon: Icon403 },
    404: { title: "Not Found", description: "The resource you're looking for doesn't exist or has been removed.", actionLabel: "Go to Dashboard", icon: Icon404 },
    500: { title: "Internal Server Error", description: "Something went wrong on our end. Our team has been notified and is working on a fix.", actionLabel: "Try Again", icon: Icon500 },
    503: { title: "Service Unavailable", description: "The service is temporarily unavailable due to maintenance or high traffic. Please try again later.", actionLabel: "Try Again", icon: Icon503 },
};

function normalizeStatus(raw: unknown): KnownStatus {
    const status = typeof raw === "number" ? raw : Number(raw);
    if (status === 400 || status === 401 || status === 403 || status === 404 || status === 500 || status === 503) return status;
    if (!Number.isNaN(status) && status >= 500) return 500;
    if (!Number.isNaN(status) && status >= 400) return 400;
    return 500;
}

function useResolvedError(statusProp?: number, messageProp?: string) {
    const routeError = useRouteError();

    return useMemo(() => {
        if (statusProp !== undefined) return { status: normalizeStatus(statusProp), message: messageProp };
        if (isRouteErrorResponse(routeError)) return { status: normalizeStatus(routeError.status), message: routeError.statusText || routeError.data };

        if (routeError instanceof Error) {
            const attachedStatus = (routeError as Error & { status?: number; statusCode?: number }).status ?? (routeError as Error & { status?: number; statusCode?: number }).statusCode;
            const looksOffline = typeof navigator !== "undefined" && !navigator.onLine && /fetch|network/i.test(routeError.message);
            return { status: attachedStatus !== undefined ? normalizeStatus(attachedStatus) : looksOffline ? 503 : 500, message: routeError.message };
        }
        return { status: 500 as KnownStatus, message: undefined };
    }, [statusProp, messageProp, routeError]);
}

export default function GlobalErrorPage({
    status: statusProp,
    message: messageProp,
    loginPath = "/login",
    dashboardPath = "/",
}: GlobalErrorPageProps = {}) {
    const navigate = useNavigate();
    const revalidator = useRevalidator();
    const { status, message } = useResolvedError(statusProp, messageProp);
    const config = ERROR_CONFIG[status];
    const Icon = config.icon;

    const handleAction = () => {
        switch (status) {
            case 400: navigate(-1); return;
            case 401: navigate(loginPath); return;
            case 403:
            case 404: navigate(dashboardPath); return;
            case 500:
            case 503:
                if (revalidator.state === "idle") revalidator.revalidate();
                else window.location.reload();
                return;
        }
    };

    return (
        <div 
            className="min-h-screen bg-background text-foreground font-sans flex flex-col animate-[fadeIn_0.4s_ease-out_forwards]" 
            style={{ backgroundImage: "radial-gradient(circle at 50% -20%, var(--primary) 0%, var(--background) 60%)" }}
            role="alert"
        >
            <header className="flex items-center justify-between px-2 sm:px-8 py-6">
                <div className="flex items-center gap-2 sm:gap-3">
                    <img src="/android-chrome-512x512.png" alt="Bastion Logo" className="size-8 sm:size-10" />
                    <div>
                        <h1 className="m-0 text-[16px] sm:text-[20px] font-bold tracking-[-0.02em]">Bastion</h1>
                        <p className="sm:mt-px mb-0 text-[9px] sm:text-[10px] text-muted-foreground tracking-wider uppercase">Secure. Simple. Seamless.</p>
                    </div>
                </div>
                <button
                    type="button"
                    className="inline-flex items-center text-muted-foreground hover:text-foreground no-underline text-xs sm:text-sm font-medium bg-transparent border border-border rounded-full px-3 py-1.5 sm:pb-2 cursor-pointer transition-all duration-200 hover:border-ring"
                    onClick={() => navigate(dashboardPath)}
                >
                    Back to Dashboard
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-[440px] bg-card/80 backdrop-blur-[12px] [-webkit-backdrop-filter:blur(12px)] border border-border rounded-3xl p-10 flex flex-col items-center text-center shadow-2xl animate-[slideUp_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
                    <div className="text-primary mb-6 drop-shadow-md">
                        <Icon />
                    </div>
                    <p className="m-0 font-mono text-[56px] font-extrabold text-primary tracking-[-0.05em] leading-none animate-[pulseGlow_4s_infinite]" style={{ animationName: 'pulseGlow' }}>
                        {status}
                    </p>
                    <h3 className="my-4 text-[22px] font-semibold text-card-foreground">{config.title}</h3>
                    <p className="mt-0 mb-8 text-[15px] leading-relaxed text-muted-foreground">{config.description}</p>
                    <button
                        type="button"
                        className="w-full px-6 py-3 rounded-full border border-primary bg-primary text-primary-foreground font-semibold cursor-pointer transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5 shadow-md"
                        onClick={handleAction}
                    >
                        {config.actionLabel}
                    </button>
                </div>

                {import.meta.env.DEV && message && (
                    <details className="w-full max-w-[440px] mt-6 text-left">
                        <summary className="cursor-pointer text-[13px] text-muted-foreground py-2 transition-colors duration-200 hover:text-foreground">
                            Error details (dev only)
                        </summary>
                        <pre className="mt-3 p-4 bg-muted/50 border border-border rounded-xl font-mono text-[12px] text-muted-foreground overflow-x-auto whitespace-pre-wrap break-words">
                            {String(message)}
                        </pre>
                    </details>
                )}
            </main>

            <footer className="text-center p-6 text-[13px] text-muted-foreground">
                Check your application logs for stack traces.<br />
                Verify your server configurations and network access.
            </footer>
        </div>
    );
}

function Icon400() {
    return (
        <svg {...iconProps}>
            <rect x="12" y="22" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
            <path d="M17 22v-6a7 7 0 0 1 14 0v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="24" cy="30" r="2.2" fill="currentColor" />
            <circle cx="36" cy="38" r="7" className="fill-card" stroke="currentColor" strokeWidth="2" />
            <path d="M33.5 35.5l5 5M38.5 35.5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function Icon401() {
    return (
        <svg {...iconProps}>
            <path d="M8 16a3 3 0 0 1 3-3h9l4 4h15a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3V16z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="30" cy="30" r="6" className="fill-card" stroke="currentColor" strokeWidth="2" />
            <path d="M34.5 34.5l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function Icon403() {
    return (
        <svg {...iconProps}>
            <path d="M24 6l14 5v11c0 10-6 17.5-14 20-8-2.5-14-10-14-20V11l14-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="24" cy="23" r="7" stroke="currentColor" strokeWidth="2" />
            <line x1="19.5" y1="27.5" x2="28.5" y2="18.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function Icon404() {
    return (
        <svg {...iconProps}>
            <path d="M14 6h13l7 7v27a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M27 6v7h7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <line x1="17" y1="24" x2="27" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="34" cy="36" r="7" className="fill-card" stroke="currentColor" strokeWidth="2" />
            <circle cx="31.3" cy="34.5" r="1" fill="currentColor" />
            <circle cx="36.7" cy="34.5" r="1" fill="currentColor" />
            <path d="M31 39c1-1.3 5-1.3 6 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </svg>
    );
}

function Icon500() {
    return (
        <svg {...iconProps}>
            <rect x="9" y="8" width="24" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
            <rect x="9" y="20" width="24" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
            <circle cx="14" cy="13" r="1.3" fill="currentColor" />
            <circle cx="14" cy="25" r="1.3" fill="currentColor" />
            <circle cx="36" cy="34" r="7" className="fill-card" stroke="currentColor" strokeWidth="2" />
            <line x1="36" y1="30.5" x2="36" y2="34.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="36" cy="37.5" r="1.1" fill="currentColor" />
        </svg>
    );
}

function Icon503() {
    return (
        <svg {...iconProps}>
            <rect x="7" y="10" width="30" height="22" rx="3" stroke="currentColor" strokeWidth="2" />
            <line x1="7" y1="16" x2="37" y2="16" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="13" r="1" fill="currentColor" />
            <circle cx="16" cy="13" r="1" fill="currentColor" />
            <circle cx="20" cy="13" r="1" fill="currentColor" />
            <circle cx="34" cy="30" r="9" className="fill-card" stroke="currentColor" strokeWidth="2" />
            <path d="M34 25.5v5l3.5 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}