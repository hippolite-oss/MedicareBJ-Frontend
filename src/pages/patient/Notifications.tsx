// Notifications patient — données réelles via API.
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNotifications, useToutLireNotifs, useMarquerNotifLue } from "@/hooks/useQueries";
import {
  CalendarDays,
  FlaskConical,
  Pill,
  Settings,
  MessageSquare,
  CheckCheck,
  Loader2,
  Bell,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import {
  getSignalementCommentFromNotification,
  getSignalementDecisionLabel,
} from "@/utils/notification";

const TYPE_META: Record<string, { icon: any; color: string; label: string }> = {
  rdv:          { icon: CalendarDays,  color: "bg-info/15 text-info",                label: "Rendez-vous" },
  analyse:      { icon: FlaskConical,  color: "bg-secondary/15 text-secondary",      label: "Résultats" },
  prescription: { icon: Pill,          color: "bg-accent/20 text-accent-foreground", label: "Prescriptions" },
  message:      { icon: MessageSquare, color: "bg-primary-soft text-primary",        label: "Messages" },
  systeme:      { icon: Settings,      color: "bg-muted text-muted-foreground",      label: "Système" },
  consultation: { icon: CalendarDays,  color: "bg-primary-soft text-primary",        label: "Consultations" },
  paiement:     { icon: CheckCheck,    color: "bg-success/10 text-success",          label: "Paiements" },
  validation:   { icon: CheckCheck,    color: "bg-success/10 text-success",          label: "Validation" },
  acces:        { icon: Settings,      color: "bg-muted text-muted-foreground",      label: "Accès" },
  signalement:  { icon: Settings,      color: "bg-destructive/10 text-destructive",  label: "Signalement" },
};

const DEFAULT_META = { icon: Bell, color: "bg-muted text-muted-foreground", label: "Notification" };

export default function Notifications() {
  const [filter, setFilter] = useState<string>("all");
  const [detailNotif, setDetailNotif] = useState<any>(null);
  const { data, isLoading, refetch } = useNotifications(filter !== "all" ? { type: filter } : undefined);
  const toutLire = useToutLireNotifs();
  const marquerLue = useMarquerNotifLue();

  const notifications: any[] = data?.notifications ?? [];

  const handleToutLire = async () => {
    await toutLire.mutateAsync();
    toast.success("Toutes les notifications marquées comme lues");
    refetch();
  };

  const handleMarquerLue = async (id: string) => {
    await marquerLue.mutateAsync(id);
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.lu) await handleMarquerLue(n.id);
    if (n.type === "signalement") {
      setDetailNotif(n);
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Restez informé(e) de chaque évolution de votre suivi médical."
        actions={
          <Button
            variant="outline" size="sm" className="rounded-full"
            onClick={handleToutLire}
            disabled={toutLire.isPending}
          >
            {toutLire.isPending
              ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              : <CheckCheck className="mr-1.5 h-4 w-4" />
            }
            Tout marquer comme lu
          </Button>
        }
      />

      {/* Filtres */}
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="Toutes" />
        {Object.entries(TYPE_META).map(([k, v]) => (
          <FilterChip key={k} active={filter === k} onClick={() => setFilter(k)} label={v.label} />
        ))}
      </div>

      <Card className="rounded-2xl shadow-card">
        {isLoading ? (
          <div className="space-y-1 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">Aucune notification</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((n: any) => {
              const meta = TYPE_META[n.type] ?? DEFAULT_META;
              const signalementComment =
                n.type === "signalement"
                  ? getSignalementCommentFromNotification(n)
                  : null;
              return (
                <li
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 p-4 transition-base cursor-pointer hover:bg-muted/30",
                    !n.lu && "bg-primary-soft/30"
                  )}
                  onClick={() => handleNotificationClick(n)}
                >
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", meta.color)}>
                    <meta.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn("text-sm", n.lu ? "font-medium" : "font-semibold")}>{n.titre}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(n.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                      {n.contenu}
                    </p>
                    {n.type === "signalement" && (
                      <p className="mt-1.5 text-xs font-medium text-primary flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {signalementComment
                          ? "Voir le commentaire de l'administration"
                          : "Voir le détail"}
                      </p>
                    )}
                  </div>
                  {!n.lu && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Non lu" />}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Dialog
        open={!!detailNotif}
        onOpenChange={(o) => !o && setDetailNotif(null)}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {detailNotif?.titre ?? "Signalement"}
            </DialogTitle>
          </DialogHeader>
          {detailNotif && (
            <div className="space-y-4 text-sm">
              {getSignalementDecisionLabel(detailNotif) && (
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Décision</p>
                  <p className="font-semibold">
                    {getSignalementDecisionLabel(detailNotif)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Message</p>
                <p className="whitespace-pre-wrap text-foreground">
                  {detailNotif.contenu}
                </p>
              </div>
              {getSignalementCommentFromNotification(detailNotif) ? (
                <div className="rounded-xl bg-destructive/10 p-4 ring-1 ring-destructive/20">
                  <p className="text-xs font-semibold uppercase text-destructive mb-2">
                    Commentaire de l'administration
                  </p>
                  <p className="whitespace-pre-wrap">
                    {getSignalementCommentFromNotification(detailNotif)}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Aucun commentaire administratif joint à cette notification.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-base",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40"
      )}
    >
      {label}
    </button>
  );
}
