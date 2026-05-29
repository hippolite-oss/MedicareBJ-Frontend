// Messagerie — conversations existantes + démarrer avec un médecin public.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { PageHeader } from "@/components/PageHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useConversations } from "@/hooks/useQueries";
import { useQueryClient } from "@tanstack/react-query";
import { messageService } from "@/services/messageService";
import { signalementService } from "@/services/signalementService";
import { qrcodeService } from "@/services/qrcodeService";
import { connectSocket } from "@/services/socket";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import {
  Send,
  Search,
  Loader2,
  MessageSquare,
  Plus,
  X,
  Trash2,
  Flag,
  Check,
  CheckCheck,
  Copy,
  ScanLine,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getImageUrl } from "@/utils/imageUrl";
import {
  extractQrTokenFromMessage,
  getQrMessagePreview,
  isQrMessage,
} from "@/utils/qrMessage";

function isMediaMessage(message: any) {
  return ["image", "fichier", "qr"].includes(message?.type_message);
}

export default function Messagerie() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPro = user?.role === "medecin" || user?.role === "technicien";
  const conversationsKey = useMemo(
    () => ["conversations", user?.id],
    [user?.id],
  );
  const messageCountKey = useMemo(
    () => ["message-count", user?.id],
    [user?.id],
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeName, setActiveName] = useState<string>("");
  const [activeRole, setActiveRole] = useState<string>("");
  const [activePhoto, setActivePhoto] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    message: any;
  } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [scanningQrId, setScanningQrId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch } = useConversations();
  const queryClient = useQueryClient();
  const conversations: any[] = data?.conversations ?? [];

  const filtered = conversations.filter((c: any) => {
    const name =
      `${c.interlocuteur?.prenom ?? ""} ${c.interlocuteur?.nom ?? ""}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  // IDs des personnes avec qui une conversation existe déjà (au moins un message échangé)
  const existingInterlocutorIds = useMemo(
    () =>
      new Set(
        conversations.map((c: any) => c.interlocuteur?.id).filter(Boolean),
      ),
    [conversations],
  );

  // Nouveau message : uniquement les contacts sans conversation existante
  const newChatContacts = useMemo(() => {
    const q = doctorSearch.trim().toLowerCase();
    return doctors.filter((d: any) => {
      if (!d?.id || d.id === user?.id) return false;
      if (existingInterlocutorIds.has(d.id)) return false;
      if (!q) return true;
      const name = `${d.prenom ?? ""} ${d.nom ?? ""}`.toLowerCase();
      return name.includes(q);
    });
  }, [doctors, existingInterlocutorIds, doctorSearch, user?.id]);

  // Charger les médecins publics quand on ouvre "Nouveau message"
  useEffect(() => {
    if (!showNewChat) return;
    const timer = window.setTimeout(() => {
      setLoadingDoctors(true);
      api
        .get("/utilisateurs/medecins/publics", {
          params: { search: doctorSearch || undefined },
        })
        .then((res: any) => setDoctors(res?.data?.medecins ?? []))
        .catch(() => setDoctors([]))
        .finally(() => setLoadingDoctors(false));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [showNewChat, doctorSearch]);

  // Charger les messages de la conversation active
  useEffect(() => {
    if (!activeId) return;

    // Vider les messages immédiatement quand on change de conversation
    setMessages([]);
    setLoadingMsgs(true);

    messageService
      .getConversation(activeId, { limit: 50 })
      .then((res: any) => {
        setMessages((res?.data?.messages ?? []).reverse());

        // Compter les messages non lus de cette conversation
        const unreadCount = (res?.data?.messages ?? []).filter(
          (m: any) => !m.lu && m.id_destinataire === user?.id,
        ).length;

        // Marquer les messages comme lus
        if (unreadCount > 0) {
          messageService
            .marquerLu(activeId)
            .then(() => {
              // Décrémenter le compteur immédiatement
              queryClient.setQueryData(messageCountKey, (old: any) => {
                const currentCount =
                  typeof old === "number" ? old : (old?.data?.count ?? 0);
                return Math.max(0, currentCount - unreadCount);
              });

              // Mettre à jour les conversations pour enlever le badge
              queryClient.setQueryData(conversationsKey, (old: any) => {
                if (!old?.conversations) return old;

                const conversations = old.conversations;
                const convIndex = conversations.findIndex(
                  (c: any) => c.interlocuteur?.id === activeId,
                );

                if (convIndex !== -1) {
                  const updatedConversations = [...conversations];
                  updatedConversations[convIndex] = {
                    ...updatedConversations[convIndex],
                    non_lus: 0,
                  };
                  return { ...old, conversations: updatedConversations };
                }

                return old;
              });

              refetch(); // Rafraîchir les conversations
            })
            .catch(() => {});
        }
      })
      .catch((err: any) => {
        console.error("Erreur chargement conversation:", err);
        if (err?.response?.status === 403) {
          toast.error("Vous n'êtes pas autorisé à contacter ce professionnel");
          setActiveId(null);
          setActiveName("");
          setActiveRole("");
        } else {
          toast.error("Erreur chargement messages");
        }
      })
      .finally(() => setLoadingMsgs(false));
  }, [activeId, queryClient, refetch, user, conversationsKey, messageCountKey]);

  // Socket.io
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token || !user) return;
    const socket = connectSocket(token);
    socket.on("new_message", (data: any) => {
      if (
        data.message.id_expediteur === activeId ||
        data.message.id_destinataire === activeId
      ) {
        setMessages((prev) => [...prev, data.message]);
        // Si c'est un message reçu dans la conversation active, le marquer comme lu
        if (
          data.message.id_destinataire === user.id &&
          data.message.id_expediteur === activeId
        ) {
          messageService
            .marquerLu(activeId)
            .then(() => {
              // Décrémenter le compteur immédiatement
              queryClient.setQueryData(messageCountKey, (old: any) => {
                const currentCount =
                  typeof old === "number" ? old : (old?.data?.count ?? 0);
                return Math.max(0, currentCount - 1);
              });

              // Mettre à jour les conversations pour enlever le badge
              queryClient.setQueryData(conversationsKey, (old: any) => {
                if (!old?.conversations) return old;

                const conversations = old.conversations;
                const convIndex = conversations.findIndex(
                  (c: any) => c.interlocuteur?.id === activeId,
                );

                if (convIndex !== -1) {
                  const updatedConversations = [...conversations];
                  updatedConversations[convIndex] = {
                    ...updatedConversations[convIndex],
                    non_lus: 0,
                  };
                  return { ...old, conversations: updatedConversations };
                }

                return old;
              });
            })
            .catch(() => {});
        }
      }
      refetch(); // Rafraîchir la liste des conversations
    });
    return () => {
      socket.off("new_message");
    };
  }, [activeId, user, refetch, queryClient, conversationsKey, messageCountKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversation = (
    id: string,
    prenom: string,
    nom: string,
    role: string,
    photo_profil?: string,
    profil_professionnel?: any,
  ) => {
    setActiveId(id);
    setActiveName(
      `${role === "medecin" || role === "technicien" ? "Dr. " : ""}${prenom} ${nom}`,
    );
    setActiveRole(role);
    setActivePhoto(photo_profil || "");
    setShowNewChat(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await messageService.supprimer(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      refetch();
      toast.success("Message supprimé");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de la suppression");
    } finally {
      setMenu(null);
    }
  };

  const handleCopyQrToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("Token copié — collez-le dans Recherche patient si besoin");
    setMenu(null);
  };

  const handleAccessDossierFromQr = async (
    token: string,
    messageId?: string,
  ) => {
    if (!isPro) return;
    setScanningQrId(messageId ?? "pending");
    setMenu(null);
    try {
      const res: any = await qrcodeService.scanner(token.trim());
      const idDossier = res?.data?.id_dossier ?? res?.id_dossier;
      if (!idDossier) {
        toast.error("Dossier introuvable après validation du QR");
        return;
      }
      toast.success("QR validé — accès accordé");
      navigate(`/medecin/patient/${idDossier}`);
    } catch (err: any) {
      toast.error(err?.message ?? "QR invalide ou expiré");
    } finally {
      setScanningQrId(null);
    }
  };

  const handleReportUser = async () => {
    if (!activeId || !reportReason.trim()) return;
    setReporting(true);
    try {
      await signalementService.creer({
        id_cible: activeId,
        motif: reportReason.trim(),
      });
      toast.success("Signalement envoyé");
      setReportReason("");
      setReportOpen(false);
      setMenu(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors du signalement");
    } finally {
      setReporting(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || !activeId) return;
    setSending(true);
    try {
      const res: any = await messageService.envoyer({
        id_destinataire: activeId,
        contenu: text,
      });
      const newMessage = res?.data?.message;
      setMessages((prev) => [...prev, newMessage]);
      setText("");

      // Mettre à jour la conversation dans le cache avec le dernier message
      queryClient.setQueryData(conversationsKey, (old: any) => {
        if (!old?.conversations) return old;

        const conversations = old.conversations;
        const convIndex = conversations.findIndex(
          (c: any) => c.interlocuteur?.id === activeId,
        );

        if (convIndex !== -1) {
          const updatedConversations = [...conversations];
          updatedConversations[convIndex] = {
            ...updatedConversations[convIndex],
            dernier_message: newMessage,
          };

          // Déplacer en haut de la liste
          const [conv] = updatedConversations.splice(convIndex, 1);
          updatedConversations.unshift(conv);

          return { ...old, conversations: updatedConversations };
        }

        return old;
      });

      refetch(); // Rafraîchir les conversations
    } catch (err: any) {
      console.error("Erreur envoi message:", err);
      if (err?.response?.status === 403) {
        toast.error("Vous n'êtes pas autorisé à contacter ce professionnel");
        setActiveId(null);
        setActiveName("");
        setActiveRole("");
      } else {
        toast.error(
          err?.response?.data?.message ?? err?.message ?? "Erreur envoi",
        );
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Messagerie"
        subtitle="Communiquez en toute confidentialité avec vos médecins."
      />

      <Card className="overflow-hidden rounded-2xl shadow-card">
        <div className="grid h-[75vh] grid-cols-1 lg:grid-cols-[320px_1fr]">
          {/* ── SIDEBAR CONVERSATIONS ── */}
          <aside className="flex flex-col border-r border-border">
            {/* Barre de recherche + bouton nouveau */}
            <div className="border-b border-border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9 h-9"
                    placeholder="Rechercher…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  variant={showNewChat ? "default" : "outline"}
                  onClick={() => setShowNewChat(!showNewChat)}
                  className="h-9 w-9 rounded-full p-0 shrink-0"
                  title="Nouveau message"
                >
                  {showNewChat ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Panel "Nouveau message" (style WhatsApp): au-dessus, sans masquer les conversations */}
            {showNewChat && (
              <div className="border-b border-border">
                <div className="p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Nouvelle conversation
                  </p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-8 h-8 text-xs"
                      placeholder="Filtrer par nom…"
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                    />
                  </div>
                </div>
                <ul className="max-h-56 overflow-y-auto border-t border-border/60">
                  {loadingDoctors ? (
                    <div className="p-3 space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-10 animate-pulse rounded-xl bg-muted"
                        />
                      ))}
                    </div>
                  ) : newChatContacts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      {doctors.length === 0
                        ? "Aucun contact disponible"
                        : "Vous avez déjà une conversation avec tous les contacts disponibles"}
                    </div>
                  ) : (
                    newChatContacts.map((d: any) => (
                      <li key={d.id}>
                        <button
                          onClick={() =>
                            openConversation(
                              d.id,
                              d.prenom,
                              d.nom,
                              d.role,
                              d.photo_profil,
                              d.profil_professionnel,
                            )
                          }
                          className={cn(
                            "flex w-full items-center gap-3 border-b border-border/60 p-3 text-left transition-base hover:bg-muted/40",
                            activeId === d.id && "bg-primary-soft",
                          )}
                        >
                          <UserAvatar
                            name={`${d.prenom} ${d.nom}`}
                            photoUrl={d.photo_profil}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              Dr. {d.prenom} {d.nom}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {d.profil_professionnel?.specialite ?? d.role}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}

            {/* Liste des conversations existantes (toujours visible) */}
            <ul className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse rounded-xl bg-muted"
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                  <MessageSquare className="mb-2 h-8 w-8 opacity-30" />
                  <p className="text-sm">Aucune conversation</p>
                  <p className="text-xs mt-1">
                    Cliquez sur <strong>+</strong> pour écrire à un médecin
                  </p>
                </div>
              ) : (
                filtered.map((c: any) => {
                  const inter = c.interlocuteur;
                  const isActive = inter?.id === activeId;
                  const displayName = `${inter?.role === "medecin" || inter?.role === "technicien" ? "Dr. " : ""}${inter?.prenom} ${inter?.nom}`;
                  return (
                    <li key={inter?.id}>
                      <button
                        onClick={() =>
                          openConversation(
                            inter?.id,
                            inter?.prenom,
                            inter?.nom,
                            inter?.role,
                            inter?.photo_profil,
                            inter?.profil_professionnel,
                          )
                        }
                        className={cn(
                          "flex w-full items-start gap-3 border-b border-border/60 p-3 text-left transition-base",
                          isActive ? "bg-primary-soft" : "hover:bg-muted/40",
                        )}
                      >
                        <UserAvatar
                          name={`${inter?.prenom} ${inter?.nom}`}
                          photoUrl={inter?.photo_profil}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="truncate text-sm font-semibold">
                              {displayName}
                            </p>
                            <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                              {c.dernier_message?.createdAt
                                ? new Date(
                                    c.dernier_message.createdAt,
                                  ).toLocaleDateString("fr-FR", {
                                    day: "numeric",
                                    month: "short",
                                  })
                                : ""}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {c.dernier_message?.contenu ?? (
                              <span className="italic text-muted-foreground/60">
                                Nouvelle conversation
                              </span>
                            )}
                          </p>
                        </div>
                        {c.non_lus > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shrink-0">
                            {c.non_lus}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </aside>

          {/* ── ZONE DE CHAT ── */}
          {!activeId ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="mb-3 h-12 w-12 opacity-20" />
              <p className="text-sm">Sélectionnez une conversation</p>
              <p className="text-xs mt-1">
                ou cliquez sur <strong>+</strong> pour écrire à un médecin
              </p>
            </div>
          ) : (
            <section className="flex flex-col min-h-0">
              {/* Header conversation */}
              <header className="flex items-center justify-between gap-3 border-b border-border p-4 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    name={activeName}
                    photoUrl={activePhoto}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {activeName}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {activeRole}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReportOpen(true)}
                  className="shrink-0 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Signaler cet utilisateur"
                >
                  <Flag className="h-4 w-4" />
                </Button>
              </header>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-gradient-soft p-4 space-y-3">
                {loadingMsgs ? (
                  <div className="flex justify-center pt-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageSquare className="mb-2 h-8 w-8 opacity-20" />
                    <p className="text-sm">Démarrez la conversation</p>
                  </div>
                ) : (
                  messages.map((m: any) => {
                    const mine = m.id_expediteur === user?.id;
                    const mediaUrl = getImageUrl(m.media_url);
                    const hasMedia =
                      isMediaMessage(m) &&
                      mediaUrl &&
                      m.type_message !== "qr";
                    const qrToken = isQrMessage(m)
                      ? extractQrTokenFromMessage(m.contenu)
                      : null;
                    const qrPreview = qrToken
                      ? getQrMessagePreview(m.contenu)
                      : null;
                    const isScanningThis = scanningQrId === m.id;
                    const showQrActions = !!qrToken;
                    const canAccessDossier = isPro && showQrActions && !mine;
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "flex",
                          mine ? "justify-end" : "justify-start",
                        )}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setMenu({ x: e.clientX, y: e.clientY, message: m });
                        }}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                            mine
                              ? "rounded-br-sm bg-primary text-primary-foreground"
                              : "rounded-bl-sm bg-card text-foreground",
                          )}
                        >
                          {hasMedia ? (
                            <a
                              href={mediaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block"
                            >
                              <img
                                src={mediaUrl}
                                alt={m.nom_fichier || "Média"}
                                className="mb-2 max-h-64 w-full rounded-xl object-contain bg-white/80"
                              />
                            </a>
                          ) : qrToken ? (
                            <div className="mb-2 rounded-xl bg-white p-3 inline-block">
                              <QRCodeSVG
                                value={qrToken}
                                size={180}
                                level="H"
                                bgColor="#FFFFFF"
                                fgColor="#0F5C73"
                                includeMargin
                              />
                            </div>
                          ) : null}
                          {qrPreview ? (
                            <p className="whitespace-pre-wrap break-words">
                              {qrPreview}
                            </p>
                          ) : m.contenu && !qrToken ? (
                            <p className="whitespace-pre-wrap break-words">
                              {m.contenu}
                            </p>
                          ) : null}
                          {showQrActions && (
                            <div
                              className={cn(
                                "mt-2 flex flex-wrap gap-1.5",
                                mine && "justify-end",
                              )}
                            >
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className={cn(
                                  "h-7 rounded-full text-xs gap-1",
                                  mine &&
                                    "border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20",
                                )}
                                onClick={() => handleCopyQrToken(qrToken)}
                              >
                                <Copy className="h-3 w-3" />
                                Copier le token
                              </Button>
                              {canAccessDossier && (
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-7 rounded-full text-xs gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                  disabled={isScanningThis}
                                  onClick={() =>
                                    handleAccessDossierFromQr(qrToken, m.id)
                                  }
                                >
                                  {isScanningThis ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <FolderOpen className="h-3 w-3" />
                                  )}
                                  Accéder au dossier
                                </Button>
                              )}
                            </div>
                          )}
                          <div
                            className={cn(
                              "mt-1 flex items-center justify-end gap-1 text-[10px]",
                              mine
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground",
                            )}
                          >
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString(
                                "fr-FR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                            {mine ? (
                              m.lu ? (
                                <CheckCheck className="h-3.5 w-3.5" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2 border-t border-border p-3 shrink-0"
              >
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Écrire un message…"
                  className="flex-1 rounded-full"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={sending || !text.trim()}
                  className="h-10 w-10 shrink-0 rounded-full bg-gradient-primary shadow-glow"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </section>
          )}
        </div>
      </Card>

      {menu && (
        <div className="fixed inset-0 z-50" onClick={() => setMenu(null)}>
          <div
            className="absolute min-w-[200px] rounded-xl border border-border bg-background p-1 shadow-elevated"
            style={{ left: menu.x, top: menu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const menuQrToken = extractQrTokenFromMessage(
                menu.message.contenu,
              );
              const menuMine =
                menu.message.id_expediteur === user?.id;
              const canDeleteMessage =
                menu.message.id_expediteur === user?.id ||
                menu.message.id_destinataire === user?.id;
              return (
                <>
                  {menuQrToken && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCopyQrToken(menuQrToken)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                      >
                        <Copy className="h-4 w-4" /> Copier le token
                      </button>
                      {isPro && !menuMine && (
                        <button
                          type="button"
                          onClick={() =>
                            handleAccessDossierFromQr(
                              menuQrToken,
                              menu.message.id,
                            )
                          }
                          disabled={scanningQrId === menu.message.id}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted text-secondary"
                        >
                          {scanningQrId === menu.message.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ScanLine className="h-4 w-4" />
                          )}
                          Analyser le QR et accéder au dossier
                        </button>
                      )}
                    </>
                  )}
                  {canDeleteMessage && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(menu.message.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted text-destructive"
                    >
                      <Trash2 className="h-4 w-4" /> Supprimer le message
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Signaler cet utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Décrivez brièvement le problème rencontré dans cette conversation.
            </p>
            <Textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Exemple : propos inappropriés, harcèlement, tentative d'arnaque..."
              rows={5}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setReportOpen(false)}
                className="flex-1 rounded-full"
              >
                Annuler
              </Button>
              <Button
                onClick={handleReportUser}
                disabled={reporting || !reportReason.trim()}
                className="flex-1 rounded-full"
              >
                {reporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Flag className="mr-2 h-4 w-4" />
                )}
                Signaler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
