import { useEffect, useState, type JSX } from 'react';

const DEFAULT_PHRASES = [
    'Authenticating session…',
    'Resolving host…',
    'Verifying host key…',
    'Opening secure tunnel…',
];

interface BastionLoaderProps {
    phrases?: string[];
    label?: string;
    fullScreen?: boolean;
    size?: number;
}

export default function BastionLoader({
    phrases = DEFAULT_PHRASES,
    label,
    fullScreen = true,
    size = 128,
}: BastionLoaderProps): JSX.Element {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (label) return;
        const id = setInterval(() => {
            setIndex((i) => (i + 1) % phrases.length);
        }, 2000);
        return () => clearInterval(id);
    }, [phrases, label]);

    const currentText = label || phrases[index];

    return (
        <div
            className={`min-h-[160px] flex flex-col items-center justify-center font-mono ${
                fullScreen ? 'fixed inset-0 bg-[#0A0B14] z-[999]' : ''
            }`}
            style={{
                backgroundImage: fullScreen
                    ? 'radial-gradient(circle at 50% 30%, rgba(110, 120, 234, 0.08) 0%, transparent 70%)'
                    : undefined,
            }}
            role="status"
            aria-live="polite"
            aria-label={currentText}
        >
            <div className="relative flex items-center justify-center mb-6" style={{ width: size, height: size }}>
                <svg
                    viewBox="0 0 1024 1024"
                    className="w-full h-full overflow-visible"
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient id="bastionLeftGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#AECCFF" />
                            <stop offset="100%" stopColor="#B1B8FF" />
                        </linearGradient>
                        <linearGradient id="bastionRightGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#828AFF" />
                            <stop offset="100%" stopColor="#8282FF" />
                        </linearGradient>
                        <linearGradient id="bastionDoorGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#181A22" />
                            <stop offset="100%" stopColor="#0C0D13" />
                        </linearGradient>
                        <radialGradient id="bastionGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#6E78EA" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#6E78EA" stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    <ellipse
                        className="[transform-box:fill-box] [transform-origin:center] animate-[bl-pulse_4s_ease-in-out_infinite]"
                        cx="511"
                        cy="610"
                        rx="230"
                        ry="230"
                        fill="url(#bastionGlow)"
                    />

                    <polygon
                        className="opacity-0 [transform-box:fill-box] [transform-origin:center] animate-[bl-materialize_900ms_ease-out_forwards] [animation-delay:120ms]"
                        points="511,196 444,234 444,287 407,308 407,256 361,283 361,337 327,355 327,303 286,327 286,654 511,789"
                        fill="url(#bastionLeftGrad)"
                    />
                    <polygon
                        className="opacity-0 [transform-box:fill-box] [transform-origin:center] animate-[bl-materialize_900ms_ease-out_forwards] [animation-delay:220ms]"
                        points="511,196 578,234 578,287 615,308 615,256 661,283 661,337 695,355 695,303 736,327 736,654 511,789"
                        fill="url(#bastionRightGrad)"
                    />

                    <line
                        className="opacity-50"
                        x1="511"
                        y1="196"
                        x2="511"
                        y2="789"
                        stroke="#F3F6FF"
                        strokeWidth="3"
                    />

                    <polygon
                        className="opacity-0 [transform-box:fill-box] [transform-origin:center] animate-[bl-materialize_900ms_ease-out_forwards,bl-door-pulse_2.6s_ease-in-out_900ms_infinite]"
                        points="510,432 427,481 427,740 512,789 595,739 595,481"
                        fill="url(#bastionDoorGrad)"
                    />

                    <path
                        className="fill-none stroke-[#F2F3FC] [stroke-width:12] [stroke-linejoin:round] [stroke-linecap:round] [stroke-dasharray:2200] animate-[bl-draw_2s_ease-in-out_infinite]"
                        d="M511,196 L444,234 L444,287 L407,308 L407,256 L361,283 L361,337 L327,355 L327,303 L286,327 L286,654 L511,789 L736,654 L736,327 L695,303 L695,355 L661,337 L661,283 L615,256 L615,308 L578,287 L578,234 Z"
                    />
                </svg>
            </div>

            <div className="flex items-baseline gap-0.5 text-[#8993C9] text-[13px] tracking-[0.02em] min-h-[18px]">
                <span key={currentText} className="animate-[bl-fade-in_300ms_ease-out]">
                    {currentText}
                </span>
                <span className="w-1.5 h-[13px] ml-0.5 bg-[#6E78EA] inline-block animate-[bl-blink_1s_steps(1)_infinite]" aria-hidden="true" />
            </div>

            <style>{`
                @keyframes bl-draw {
                    0%   { stroke-dashoffset: 2200; opacity: 0; }
                    8%   { opacity: 1; }
                    50%  { stroke-dashoffset: 0;    opacity: 1; }
                    72%  { stroke-dashoffset: 0;    opacity: 0; }
                    100% { stroke-dashoffset: 2200; opacity: 0; }
                }

                @keyframes bl-materialize {
                    0%   { opacity: 0; transform: scale(0.94); }
                    100% { opacity: 1; transform: scale(1); }
                }

                @keyframes bl-pulse {
                    0%, 100% { opacity: 0.35; transform: scale(0.92); }
                    50%      { opacity: 0.85; transform: scale(1.08); }
                }

                @keyframes bl-door-pulse {
                    0%, 100% { filter: brightness(1); }
                    50%      { filter: brightness(1.35); }
                }

                @keyframes bl-fade-in {
                    from { opacity: 0; transform: translateY(2px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                @keyframes bl-blink {
                    0%, 49%  { opacity: 1; }
                    50%, 100% { opacity: 0; }
                }

                @media (prefers-reduced-motion: reduce) {
                    .animate-\\[bl-pulse\\],
                    .animate-\\[bl-door-pulse\\],
                    .animate-\\[bl-draw\\],
                    .animate-\\[bl-materialize\\],
                    .animate-\\[bl-blink\\] {
                        animation: none !important;
                    }
                    polygon[fill^="url"] { opacity: 1; }
                    path.stroke-\\[\\#F2F3FC\\] { display: none; }
                }
            `}</style>
        </div>
    );
}