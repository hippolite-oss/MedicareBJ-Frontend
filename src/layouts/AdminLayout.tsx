// Layout admin — sidebar sombre + header avec nom admin.
import {
  Outlet,
  NavLink,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Flag,
  Building2,
  FileSearch,
  CreditCard,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Bell,
  Pill,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  useValidationsCount,
  useSignalementsEnAttenteCount,
} from "@/hooks/useQueries";

const NAV = [
  { to: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/admin/comptes", label: "Comptes", icon: Users },
  {
    to: "/admin/validations",
    label: "Validations",
    icon: UserCheck,
    showBadge: true,
  },
  {
    to: "/admin/signalements",
    label: "Signalements",
    icon: Flag,
    showSignalementsBadge: true,
  },
  { to: "/admin/hopitaux", label: "Hôpitaux", icon: Building2 },
  { to: "/admin/medicaments", label: "Médicaments", icon: Pill },
  { to: "/admin/audit", label: "Audit", icon: FileSearch },
  { to: "/admin/transactions", label: "Transactions", icon: CreditCard },
  { to: "/admin/droits", label: "Droits d'accès", icon: ShieldCheck },
];

const MOBILE_TAB = [NAV[0], NAV[1], NAV[2], NAV[3], NAV[6]];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Récupérer le nombre de validations en attente
  const { data: validationsCount = 0 } = useValidationsCount();
  const { data: signalementsCount = 0 } = useSignalementsEnAttenteCount();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/login" replace />;

  const handleLogout = () => {
    logout().then(() => navigate("/"));
  };

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* SIDEBAR DESKTOP — fond sombre */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col bg-[hsl(211,35%,12%)] lg:flex">
        <div className="px-6 py-5">
          <Logo />
        </div>

        <div className="mx-4 flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <UserAvatar
            name={user.fullName}
            photoUrl={user.photo_profil}
            size="md"
            online
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user.fullName}
            </p>
            <p className="text-xs text-white/60">Administrateur</p>
          </div>
        </div>

        <nav
          className="mt-6 flex-1 space-y-0.5 px-3"
          aria-label="Navigation admin"
        >
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-base",
                  isActive
                    ? "bg-primary/20 text-primary-glow"
                    : "text-white/60 hover:bg-white/8 hover:text-white",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-glow" />
                  )}
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.showBadge && validationsCount > 0 && (
                    <span
                      className={cn(
                        "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-orange-500 text-white",
                      )}
                    >
                      {validationsCount}
                    </span>
                  )}
                  {"showSignalementsBadge" in item &&
                    item.showSignalementsBadge &&
                    signalementsCount > 0 && (
                      <span
                        className={cn(
                          "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-destructive text-white",
                        )}
                      >
                        {signalementsCount}
                      </span>
                    )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-3 text-white/60 hover:bg-white/8 hover:text-destructive"
          >
            <LogOut className="h-[18px] w-[18px]" /> Se déconnecter
          </Button>
        </div>
      </aside>

      {/* MOBILE TOPBAR */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <Logo size="sm" />
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
            className="rounded-lg p-2 text-foreground/70 hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* HEADER DESKTOP */}
        <div className="hidden lg:flex items-center justify-between border-b border-border bg-background/90 px-10 py-3 backdrop-blur sticky top-0 z-20">
          <p className="text-sm text-muted-foreground">Espace Administrateur</p>
          <div className="flex items-center gap-3">
            <button
              className="relative rounded-lg p-2 hover:bg-muted"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-foreground/70" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <UserAvatar
              name={user.fullName}
              photoUrl={user.photo_profil}
              size="sm"
              online
            />
            <span className="text-sm font-medium">{user.fullName}</span>
          </div>
        </div>

        {/* MOBILE DRAWER */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-foreground/40 animate-fade-in"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-72 bg-[hsl(211,35%,12%)] p-5 shadow-elevated animate-fade-in">
              <div className="mb-5 flex items-center justify-between">
                <Logo size="sm" />
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fermer"
                  className="rounded-lg p-1.5 hover:bg-white/10"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
              <nav className="space-y-1">
                {NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                        isActive
                          ? "bg-primary/20 text-primary-glow"
                          : "text-white/60 hover:bg-white/8 hover:text-white",
                      )
                    }
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    <span className="flex-1">{item.label}</span>
                    {item.showBadge && validationsCount > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
                        {validationsCount}
                      </span>
                    )}
                    {"showSignalementsBadge" in item &&
                      item.showSignalementsBadge &&
                      signalementsCount > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
                          {signalementsCount}
                        </span>
                      )}
                  </NavLink>
                ))}
                <button
                  onClick={handleLogout}
                  className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-[18px] w-[18px]" /> Se déconnecter
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* CONTENU */}
        <main className="flex-1 pb-24 lg:pb-0">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            <Outlet key={location.pathname} />
          </div>
        </main>

        {/* BOTTOM NAV MOBILE */}
        <nav
          aria-label="Navigation rapide"
          className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur lg:hidden"
        >
          <div className="grid grid-cols-5">
            {MOBILE_TAB.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span className="truncate">{item.label.split(" ")[0]}</span>
                {item.showBadge && validationsCount > 0 && (
                  <span className="absolute right-1/4 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white">
                    {validationsCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
