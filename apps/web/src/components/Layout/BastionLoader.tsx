import { useEffect, useState } from 'react';

const DEFAULT_PHRASES = [
  'Resolving host…',
  'Verifying host key…',
  'Opening secure tunnel…',
  'Authenticating session…',
];

interface loaderProps {
  phrases?: string[];
  label?: string;
  fullScreen?: boolean;
  size?: number
}

export default function BastionLoader({
  phrases = DEFAULT_PHRASES,
  label,
  fullScreen = true,
  size = 128,
}: loaderProps) {
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
      className={`bastion-loader ${fullScreen ? 'bastion-loader--full' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={currentText}
    >
      <style>{`
        .bastion-loader {
          --bl-void: #0A0B14;
          --bl-ink: #14151F;
          --bl-lavender: #C9D2FA;
          --bl-indigo: #6E78EA;
          --bl-indigo-deep: #454EC2;
          --bl-mist: #8993C9;
          --bl-white: #F2F3FC;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0px;
          font-family: ui-monospace, "JetBrains Mono", "Fira Code", "SFMono-Regular", Menlo, Consolas, monospace;
        }
 
        .bastion-loader--full {
          position: fixed;
          inset: 0;
          background: var(--bl-void);
          justify-content: center;
          z-index: 999;
        }
 
        .bastion-loader__mark {
          position: relative;
        }
 
        .bastion-loader__svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }
 
        .bastion-loader__glow {
          transform-box: fill-box;
          transform-origin: center;
          animation: bl-pulse 4s ease-in-out infinite;
        }
 
        .bastion-loader__fill {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation: bl-materialize 900ms ease-out forwards;
        }
        .bastion-loader__fill--left { animation-delay: 120ms; }
        .bastion-loader__fill--right { animation-delay: 220ms; }
 
        .bastion-loader__seam {
          opacity: 0.5;
        }
 
        .bastion-loader__door {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation:
            bl-materialize 900ms ease-out forwards,
            bl-door-pulse 2.6s ease-in-out 900ms infinite;
        }
 
        .bastion-loader__outline {
          fill: none;
          stroke: var(--bl-white);
          stroke-width: 12;
          stroke-linejoin: round;
          stroke-linecap: round;
          stroke-dasharray: 2200;
          animation: bl-draw 2s ease-in-out infinite;
        }
 
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
 
        .bastion-loader__status {
          display: flex;
          align-items: baseline;
          gap: 2px;
          color: var(--bl-mist);
          font-size: 13px;
          letter-spacing: 0.02em;
          min-height: 18px;
        }
 
        .bastion-loader__text {
          animation: bl-fade-in 300ms ease-out;
        }
 
        @keyframes bl-fade-in {
          from { opacity: 0; transform: translateY(2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
 
        .bastion-loader__cursor {
          width: 6px;
          height: 13px;
          margin-left: 2px;
          background: var(--bl-indigo);
          display: inline-block;
          animation: bl-blink 1s steps(1) infinite;
        }
 
        @keyframes bl-blink {
          0%, 49%  { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
 
        .bastion-loader__bar {
          width: 160px;
          height: 2px;
          background: rgba(137, 147, 201, 0.15);
          overflow: hidden;
          border-radius: 2px;
        }
        .bastion-loader__bar span {
          display: block;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, var(--bl-indigo), transparent);
          animation: bl-sweep 2s linear infinite;
        }
 
        @keyframes bl-sweep {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(340%); }
        }
 
        @media (prefers-reduced-motion: reduce) {
          .bastion-loader__glow,
          .bastion-loader__door,
          .bastion-loader__outline,
          .bastion-loader__fill,
          .bastion-loader__cursor,
          .bastion-loader__bar span {
            animation: none !important;
          }
          .bastion-loader__fill,
          .bastion-loader__door { opacity: 1; }
          .bastion-loader__outline { display: none; }
        }
      `}</style>
 
      <div className="bastion-loader__mark" style={{ width: size, height: size }}>
        <svg viewBox="0 0 1024 1024" className="bastion-loader__svg" aria-hidden="true">
          <defs>
            {/* Colors and every vertex below were sampled/traced directly off the source mark */}
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
            className="bastion-loader__glow"
            cx="511" cy="610" rx="230" ry="230"
            fill="url(#bastionGlow)"
          />
 
          <polygon
            className="bastion-loader__fill bastion-loader__fill--left"
            points="511,196 444,234 444,287 407,308 407,256 361,283 361,337 327,355 327,303 286,327 286,654 511,789"
            fill="url(#bastionLeftGrad)"
          />
          <polygon
            className="bastion-loader__fill bastion-loader__fill--right"
            points="511,196 578,234 578,287 615,308 615,256 661,283 661,337 695,355 695,303 736,327 736,654 511,789"
            fill="url(#bastionRightGrad)"
          />
 
          <line
            className="bastion-loader__seam"
            x1="511" y1="196" x2="511" y2="789"
            stroke="#F3F6FF" strokeWidth="3"
          />
 
          <polygon
            className="bastion-loader__door"
            points="510,432 427,481 427,740 512,789 595,739 595,481"
            fill="url(#bastionDoorGrad)"
          />
 
          <path
            className="bastion-loader__outline"
            d="M511,196 L444,234 L444,287 L407,308 L407,256 L361,283 L361,337 L327,355 L327,303 L286,327 L286,654 L511,789 L736,654 L736,327 L695,303 L695,355 L661,337 L661,283 L615,256 L615,308 L578,287 L578,234 Z"
          />
        </svg>
      </div>
 
      <div className="bastion-loader__status">
        <span key={currentText} className="bastion-loader__text">{currentText}</span>
        <span className="bastion-loader__cursor" aria-hidden="true" />
      </div>
 
      {/* <div className="bastion-loader__bar"><span /></div> */}
    </div>
  );
}
 