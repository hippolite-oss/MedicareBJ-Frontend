// Composant Avatar utilisateur avec photo de profil ou initiales en fallback.
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/utils/imageUrl";

const PALETTE = [
  "bg-primary/15 text-primary",
  "bg-secondary/15 text-secondary",
  "bg-accent/20 text-accent-foreground",
  "bg-info/15 text-info",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

interface UserAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  online?: boolean;
  className?: string;
}

export function UserAvatar({
  name,
  photoUrl,
  size = "md",
  online,
  className,
}: UserAvatarProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const sizes = {
    xs: "h-7 w-7 text-[10px]",
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-24 w-24 text-2xl",
  };
  const palette = PALETTE[hash(name) % PALETTE.length];
  const avatarSrc = getImageUrl(photoUrl);

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt={name}
          className={cn(
            "rounded-full object-cover ring-2 ring-background",
            sizes[size],
          )}
        />
      ) : (
        <span
          className={cn(
            "flex items-center justify-center rounded-full font-semibold ring-2 ring-background",
            sizes[size],
            palette,
          )}
          aria-label={name}
        >
          {initials}
        </span>
      )}
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-background",
            online ? "bg-secondary" : "bg-muted-foreground/40",
          )}
          aria-label={online ? "En ligne" : "Hors ligne"}
        />
      )}
    </div>
  );
}
