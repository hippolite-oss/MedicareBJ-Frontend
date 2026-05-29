// Composant Logo MediCare BJ — croix médicale stylisée + wordmark.
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const sizes = {
    sm: { box: "h-8 w-8", text: "text-base" },
    md: { box: "h-10 w-10", text: "text-lg" },
    lg: { box: "h-12 w-12", text: "text-2xl" },
  };
  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-gradient-primary shadow-glow",
          s.box
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="h-1/2 w-1/2 text-primary-foreground" fill="currentColor">
          <path d="M14 3a1 1 0 0 1 1 1v5h5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-5v5a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-5H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h5V4a1 1 0 0 1 1-1z" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn("font-display font-bold text-foreground", s.text)}>
            MediCare<span className="text-primary"> BJ</span>
          </span>
        </div>
      )}
    </div>
  );
}
