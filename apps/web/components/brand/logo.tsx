import { siteConfig } from "@/lib/site";
import Image from "next/image";

interface LogoProps {
  showText?: boolean;
  iconSize?: number;
  className?: string;
}

export function Logo({ showText = true, iconSize = 20, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Logo Wrapper */}
      <div className="flex items-center justify-center rounded-xl border border-border bg-card p-2 shadow-sm transition-transform">
        <div className="relative flex items-center justify-center">
          {/* 1. The Ambient Glow Layer */}
          <Image
            src="/favicon.ico"
            alt=""
            width={iconSize}
            height={iconSize}
            className="absolute inset-0 animate-pulse opacity-60 blur-[6px] mix-blend-screen"
            unoptimized
            aria-hidden="true"
            priority // <-- Added this
          />

          {/* 2. The Sharp Foreground Logo */}
          <Image
            src="/favicon.ico"
            alt={`${siteConfig.name} Logo`}
            width={iconSize}
            height={iconSize}
            className="relative z-10 drop-shadow-md"
            unoptimized
            priority // <-- Added this
          />
        </div>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <h1 className="text-xl font-black uppercase tracking-tighter leading-none text-foreground">
            {siteConfig.name}
          </h1>
        </div>
      )}
    </div>
  );
}
