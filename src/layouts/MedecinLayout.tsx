// Layout médecin — sidebar + topbar avec notifs + messagerie + profil.
import {
  Outlet,
  NavLink,
  useNavigate,
  useLocation,
  Navigate,
  Link,
} from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Search,
  Users,
  CalendarDays,
  FileText,
  BookOpen,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Bell,
  MessageSquare,
  User,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useNotifCount, useMessageCount } from "@/hooks/useQueries";
import { useSocket } from "@/hooks/useSocket";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { useMessageSocket } from "@/hooks/useMessageSocket";
import { useRdvEnAttente } from "@/hooks/useQueries";
import { getImageUrl } from "@/utils/imageUrl";

const NAV = [
  { to: "/medecin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/medecin/recherche", label: "Recherche patient", icon: Search },
  { to: "/medecin/patients", label: "Mes patients", icon: Users },
  { to: "/medecin/agenda", label: "Mon agenda", icon: CalendarDays },
  {
    to: "/medecin/rdv-en-attente",
    label: "RDV en attente",
    icon: Clock,
    badge: true,
  },
  { to: "/medecin/consultations", label: "Mes consultations", icon: FileText },
  { to: "/medecin/messages", label: "Messagerie", icon: MessageSquare },
  { to: "/medecin/notifications", label: "Notifications", icon: Bell },
  { to: "/medecin/profil", label: "Mon profil", icon: User },
  { to: "/medecin/journal", label: "Journal", icon: BookOpen },
];

const MOBILE_TAB = [NAV[0], NAV[1], NAV[2], NAV[3], NAV[8]];

export default function MedecinLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Initialiser Socket.io
  useSocket();

  // Écouter les notifications en temps réel
  useNotificationSocket();

  // Écouter les messages en temps réel
  useMessageSocket();

  const unreadCount = useNotifCount().data ?? 0;
  const unreadMessages = useMessageCount().data ?? 0;
  const rdvEnAttenteData = useRdvEnAttente();
  const rdvEnAttenteCount = rdvEnAttenteData.data?.rdv?.length ?? 0;

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "medecin" && user.role !== "technicien")
    return <Navigate to="/login" replace />;

  const handleLogout = () => {
    logout().then(() => navigate("/"));
  };

  const avatarUrl = getImageUrl(user.photo_profil);

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="px-6 py-5">
          <Logo />
        </div>

        <div className="mx-4 flex items-center gap-3 rounded-2xl bg-gradient-soft p-3 ring-1 ring-border">
          <UserAvatar
            name={user.fullName}
            photoUrl={user.photo_profil}
            size="md"
            online
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.fullName}</p>
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-secondary" />
              <p className="text-xs text-secondary font-medium capitalize">
                {user.role}
              </p>
            </div>
          </div>
        </div>

        <nav
          className="mt-6 flex-1 space-y-0.5 overflow-y-auto px-3"
          aria-label="Navigation médecin"
        >
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-base",
                  isActive
                    ? "bg-primary-soft text-primary"
                    : "text-foreground/70 hover:bg-sidebar-accent hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.to === "/medecin/notifications" && unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {unreadCount}
                    </span>
                  )}
                  {item.to === "/medecin/messages" && unreadMessages > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {unreadMessages}
                    </span>
                  )}
                  {item.to === "/medecin/rdv-en-attente" &&
                    rdvEnAttenteCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
                        {rdvEnAttenteCount}
                      </span>
                    )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-3 text-foreground/70 hover:text-destructive"
          >
            <LogOut className="h-[18px] w-[18px]" /> Se déconnecter
          </Button>
        </div>
      </aside>

      {/* ── ZONE DROITE ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* TOPBAR MOBILE */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <Link
              to="/medecin/notifications"
              className="relative rounded-lg p-2 text-foreground/70 hover:bg-muted"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Menu"
              className="rounded-lg p-2 text-foreground/70 hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* TOPBAR DESKTOP */}
        <header className="sticky top-0 z-20 hidden items-center justify-between border-b border-border bg-background/90 px-10 py-3 backdrop-blur lg:flex">
          <p className="text-sm text-muted-foreground capitalize">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <div className="flex items-center gap-3">
            <Link
              to="/medecin/messages"
              className="relative rounded-lg p-2 text-foreground/70 hover:bg-muted transition-base"
              aria-label="Messagerie"
            >
              <MessageSquare className="h-5 w-5" />
              {unreadMessages > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {unreadMessages}
                </span>
              )}
            </Link>
            <Link
              to="/medecin/notifications"
              className="relative rounded-lg p-2 text-foreground/70 hover:bg-muted transition-base"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link
              to="/medecin/profil"
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted transition-base"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.fullName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <UserAvatar name={user.fullName} size="sm" online />
              )}
              <span className="text-sm font-medium">{user.fullName}</span>
            </Link>
          </div>
        </header>

        {/* MOBILE DRAWER */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-foreground/40 animate-fade-in"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-72 bg-sidebar p-5 shadow-elevated animate-fade-in overflow-y-auto">
              <div className="mb-5 flex items-center justify-between">
                <Logo size="sm" />
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fermer"
                  className="rounded-lg p-1.5 hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-soft p-3 ring-1 ring-border">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user.fullName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <UserAvatar name={user.fullName} size="sm" online />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user.role}
                  </p>
                </div>
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
                          ? "bg-primary-soft text-primary"
                          : "text-foreground/70 hover:bg-sidebar-accent",
                      )
                    }
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    <span className="flex-1">{item.label}</span>
                    {item.to === "/medecin/notifications" &&
                      unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                          {unreadCount}
                        </span>
                      )}
                    {item.to === "/medecin/messages" && unreadMessages > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                        {unreadMessages}
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
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
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
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.to === "/medecin/notifications" && unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span className="truncate">{item.label.split(" ")[0]}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
