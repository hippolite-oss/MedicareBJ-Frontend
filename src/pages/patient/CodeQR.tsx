// Code QR d'accès au dossier — génération, téléchargement, envoi messagerie.
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getImageUrl } from "@/utils/imageUrl";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import {
  QrCode as QrIcon,
  RefreshCw,
  Copy,
  Ban,
  ShieldCheck,
  Loader2,
  Download,
  Send,
  Eye,
  Trash2,
  Users,
  Search,
} from "lucide-react";
import {
  useMesCodesQR,
  useGenererQR,
  useRevoquerQR,
  useSupprimerQR,
  useHistoriqueScansQR,
} from "@/hooks/useQueries";
import { messageService } from "@/services/messageService";
import api from "@/services/api";

const DURATIONS = [
  { value: "1", label: "1 heure" },
  { value: "6", label: "6 heures" },
  { value: "24", label: "24 heures" },
  { value: "48", label: "48 heures" },
  { value: "168", label: "1 semaine" }, // 7 jours * 24h
  { value: "720", label: "1 mois" }, // 30 jours * 24h
];

export default function CodeQR() {
  const [duration, setDuration] = useState("24");
  const [level, setLevel] = useState<"lecture" | "ecriture">("lecture");
  const [activeQR, setActiveQR] = useState<any>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [publicDoctors, setPublicDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [viewQROpen, setViewQROpen] = useState(false);
  const [selectedQR, setSelectedQR] = useState<any>(null);

  const queryClient = useQueryClient();
  const { data, isLoading: loadingCodes } = useMesCodesQR();
  const { data: historiqueData, isLoading: loadingHistorique } =
    useHistoriqueScansQR(selectedQR?.id || "");
  const generer = useGenererQR();
  const revoquer = useRevoquerQR();
  const supprimer = useSupprimerQR();

  const codes: any[] = data?.codes ?? [];

  // Charger tous les médecins au profil public à l'ouverture du modal d'envoi
  useEffect(() => {
    if (!sendOpen) return;
    const timer = window.setTimeout(() => {
      setLoadingDoctors(true);
      api
        .get("/utilisateurs/medecins/publics", {
          params: { search: doctorSearch.trim() || undefined },
        })
        .then((res: any) => {
          const list = res?.data?.medecins ?? res?.medecins ?? [];
          setPublicDoctors(Array.isArray(list) ? list : []);
        })
        .catch(() => setPublicDoctors([]))
        .finally(() => setLoadingDoctors(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [sendOpen, doctorSearch]);

  const handleGenerate = async () => {
    try {
      const payload: any = {
        type_acces: level,
        duree_heures: Number(duration),
      };

      const res: any = await generer.mutateAsync(payload);
      setActiveQR(res?.data);

      // Afficher un message adapté selon la durée
      const durationLabel =
        DURATIONS.find((d) => d.value === duration)?.label || `${duration}h`;
      toast.success("QR code généré", {
        description: `Valide ${durationLabel} en ${level}.`,
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de la génération");
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revoquer.mutateAsync(id);
      if (activeQR?.id === id) setActiveQR(null);
      toast("QR révoqué");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce code QR ?")) return;
    try {
      await supprimer.mutateAsync(id);
      if (activeQR?.id === id) setActiveQR(null);
      toast.success("Code QR supprimé");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de la suppression");
    }
  };

  const handleViewQR = (qr: any) => {
    setSelectedQR(qr);
    setViewQROpen(true);
  };

  const handleOpenSendModal = (qr: any) => {
    setActiveQR(qr);
    setDoctorSearch("");
    setSendOpen(true);
  };

  const handleDownloadQR = (qr: any) => {
    if (!qr?.token) return;
    // Ouvrir le modal de visualisation d'abord
    handleViewQR(qr);
    // Informer l'utilisateur
    toast.info(
      "Utilisez le bouton 'Télécharger' dans le modal pour sauvegarder le QR",
    );
  };

  const downloadQRFromModal = () => {
    if (!selectedQR) return;
    const svg = document.querySelector("#modal-qr-svg svg") as SVGElement;
    if (!svg) {
      toast.error("QR non disponible");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d")!;
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(img, 0, 0, 300, 300);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `qr-medicarebi-${selectedQR.id}.png`;
      a.click();
      toast.success("QR code téléchargé");
    };

    img.onerror = () => {
      toast.error("Erreur lors du téléchargement");
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopyToken = () => {
    if (!activeQR?.token) return;
    navigator.clipboard.writeText(activeQR.token);
    toast.success("Token copié dans le presse-papier");
  };

  // Télécharger le QR en PNG
  const handleDownload = () => {
    if (!activeQR) return;
    // Utiliser l'image base64 si disponible, sinon générer depuis le canvas SVG
    if (activeQR.qrImage) {
      const a = document.createElement("a");
      a.href = activeQR.qrImage;
      a.download = `qr-medicarebi-${Date.now()}.png`;
      a.click();
      toast.success("QR code téléchargé");
      return;
    }
    // Fallback : convertir le SVG en canvas puis en PNG
    const svg = document.querySelector("#qr-svg-active svg") as SVGElement;
    if (!svg) {
      toast.error("QR non disponible");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svg);
    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(img, 0, 0, 300, 300);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `qr-medicarebi-${Date.now()}.png`;
      a.click();
      toast.success("QR code téléchargé");
    };
    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  // Envoyer le QR via messagerie
  const handleSendToDoctor = async (doctorId: string, doctorName: string) => {
    if (!activeQR?.token) return;
    setSending(true);
    try {
      const expiryText = `Expire le : ${new Date(activeQR.date_expiration).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`;
      const sendRes: any = await messageService.envoyer({
        id_destinataire: doctorId,
        contenu: `🔐 Code QR d'accès à mon dossier médical\n\nNiveau : ${activeQR.type_acces}\n${expiryText}\n\nToken :\n${activeQR.token}`,
        type_message: "qr",
      });

      const sentMessage = sendRes?.data?.message || sendRes?.message;
      if (sentMessage) {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }

      toast.success(`QR envoyé à ${doctorName}`);
      setSendOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur envoi");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Code QR d'accès"
        subtitle="Partagez votre dossier médical en toute sécurité avec un professionnel de santé."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* PARAMÉTRAGE */}
        <div className="lg:col-span-3">
          <Card className="rounded-2xl shadow-card">
            <CardContent className="p-6 sm:p-8">
              <h2 className="mb-1 font-display text-lg font-semibold">
                Paramètres du code
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Définissez la durée et le niveau d'accès avant génération.
              </p>

              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    Durée de validité
                  </Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    Niveau d'accès
                  </Label>
                  <RadioGroup
                    value={level}
                    onValueChange={(v) => setLevel(v as any)}
                    className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                  >
                    {[
                      {
                        v: "lecture",
                        t: "Lecture seule",
                        d: "Le médecin peut consulter votre dossier.",
                      },
                      {
                        v: "ecriture",
                        t: "Lecture + Écriture",
                        d: "Le médecin peut ajouter des données.",
                      },
                    ].map((opt) => (
                      <label
                        key={opt.v}
                        htmlFor={`lvl-${opt.v}`}
                        className={`cursor-pointer rounded-xl border-2 p-3 transition-base ${
                          level === opt.v
                            ? "border-primary bg-primary-soft"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <RadioGroupItem
                            id={`lvl-${opt.v}`}
                            value={opt.v}
                            className="mt-0.5"
                          />
                          <div>
                            <p className="text-sm font-semibold">{opt.t}</p>
                            <p className="text-xs text-muted-foreground">
                              {opt.d}
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    onClick={handleGenerate}
                    disabled={generer.isPending}
                    className="bg-gradient-primary shadow-glow"
                  >
                    {generer.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Génération…
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {activeQR ? "Régénérer" : "Générer le QR"}
                      </>
                    )}
                  </Button>
                  {activeQR && (
                    <>
                      <Button variant="outline" onClick={handleDownload}>
                        <Download className="mr-2 h-4 w-4" /> Télécharger
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSendOpen(true)}
                      >
                        <Send className="mr-2 h-4 w-4" /> Envoyer
                      </Button>
                      <Button variant="outline" onClick={handleCopyToken}>
                        <Copy className="mr-2 h-4 w-4" /> Copier token
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleRevoke(activeQR.id)}
                        className="text-destructive hover:bg-destructive/10"
                        disabled={revoquer.isPending}
                      >
                        <Ban className="mr-2 h-4 w-4" /> Révoquer
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QR CARD */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="overflow-hidden rounded-2xl shadow-elevated ring-1 ring-accent/30">
              <div className="bg-gradient-soft p-6 text-center">
                <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full bg-card px-3 py-1 ring-1 ring-border">
                  <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
                  <span className="text-xs font-medium">Accès sécurisé</span>
                </div>
                <div
                  id="qr-svg-active"
                  className="mx-auto flex w-fit items-center justify-center rounded-2xl bg-card p-5 ring-4 ring-accent/40"
                >
                  {activeQR?.qrImage ? (
                    <img
                      src={activeQR.qrImage}
                      alt="QR Code"
                      className="h-[180px] w-[180px]"
                    />
                  ) : activeQR?.token ? (
                    <QRCodeSVG
                      value={activeQR.token}
                      size={180}
                      level="H"
                      fgColor="hsl(196, 69%, 25%)"
                    />
                  ) : (
                    <div className="flex h-[180px] w-[180px] flex-col items-center justify-center text-muted-foreground">
                      <QrIcon className="h-16 w-16 opacity-30" />
                      <p className="mt-2 text-xs">Aucun QR actif</p>
                    </div>
                  )}
                </div>
                {activeQR && (
                  <div className="mt-4 space-y-2">
                    <p className="font-display text-sm font-semibold">
                      Expire le{" "}
                      {new Date(activeQR.date_expiration).toLocaleString(
                        "fr-FR",
                        { dateStyle: "short", timeStyle: "short" },
                      )}
                    </p>
                    <StatusBadge status="actif" />
                    <div className="flex justify-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDownload}
                        className="rounded-full text-xs gap-1"
                      >
                        <Download className="h-3.5 w-3.5" /> Télécharger
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSendOpen(true)}
                        className="rounded-full text-xs gap-1"
                      >
                        <Send className="h-3.5 w-3.5" /> Envoyer
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* HISTORIQUE */}
      <Card className="mt-6 overflow-hidden rounded-2xl shadow-card">
        <CardContent className="p-5 sm:p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">
            Historique des QR générés
          </h2>
          {loadingCodes ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : codes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun code QR généré.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Créé le</th>
                    <th className="px-3 py-2 font-medium">Expiration</th>
                    <th className="px-3 py-2 font-medium">Niveau</th>
                    <th className="px-3 py-2 font-medium">Statut</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((e: any) => (
                    <tr key={e.id} className="border-t border-border">
                      <td className="px-3 py-3">
                        {new Date(e.createdAt).toLocaleString("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-3 py-3">
                        {new Date(e.date_expiration).toLocaleString("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={e.type_acces} />
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={e.statut} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewQR(e)}
                            className="h-8 w-8 p-0"
                            title="Voir le QR"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadQR(e)}
                            className="h-8 w-8 p-0"
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (!e.token) return;
                              navigator.clipboard.writeText(e.token);
                              toast.success("Token copié");
                            }}
                            className="h-8 w-8 p-0"
                            title="Copier le token"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenSendModal(e)}
                            className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                            title="Envoyer"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          {e.statut === "actif" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevoke(e.id)}
                              disabled={revoquer.isPending}
                              className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                              title="Révoquer"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(e.id)}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal envoi via messagerie */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> Envoyer le QR à un
              médecin
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choisissez un médecin au profil public pour lui envoyer le code QR
              :
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                placeholder="Rechercher un médecin…"
                className="pl-9 rounded-xl"
              />
            </div>
            {loadingDoctors ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : publicDoctors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun médecin au profil public trouvé.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {publicDoctors.map((doc: any) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() =>
                      handleSendToDoctor(
                        doc.id,
                        `Dr. ${doc.prenom} ${doc.nom}`,
                      )
                    }
                    disabled={sending}
                    className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left hover:border-primary/40 hover:bg-primary-soft/20 transition-base"
                  >
                    {doc.photo_profil ? (
                      <img
                        src={getImageUrl(doc.photo_profil) || ""}
                        alt={`Dr. ${doc.prenom} ${doc.nom}`}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary font-bold text-sm">
                        {doc.prenom?.[0]}
                        {doc.nom?.[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        Dr. {doc.prenom} {doc.nom}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {doc.role}
                        {doc.professionnel?.specialite
                          ? ` · ${doc.professionnel.specialite}`
                          : ""}
                      </p>
                    </div>
                    {sending && (
                      <Loader2 className="ml-auto h-4 w-4 shrink-0 animate-spin text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => setSendOpen(false)}
              className="w-full rounded-full"
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal visualisation QR */}
      <Dialog open={viewQROpen} onOpenChange={setViewQROpen}>
        <DialogContent className="rounded-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> Visualiser le code QR
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedQR && (
              <>
                <div className="flex justify-center p-6 bg-gradient-soft rounded-xl">
                  <div
                    id="modal-qr-svg"
                    className="bg-white p-4 rounded-xl ring-4 ring-accent/40"
                  >
                    <QRCodeSVG
                      value={selectedQR.token}
                      size={200}
                      level="H"
                      fgColor="hsl(196, 69%, 25%)"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Créé le :</span>
                    <span className="font-medium">
                      {new Date(selectedQR.createdAt).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expiration :</span>
                    <span className="font-medium">
                      {new Date(selectedQR.date_expiration).toLocaleString(
                        "fr-FR",
                        {
                          dateStyle: "short",
                          timeStyle: "short",
                        },
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Niveau d'accès :
                    </span>
                    <span className="font-medium capitalize">
                      {selectedQR.type_acces}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut :</span>
                    <StatusBadge status={selectedQR.statut} />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={downloadQRFromModal}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" /> Télécharger
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedQR.token);
                      toast.success("Token copié");
                    }}
                    className="flex-1"
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copier token
                  </Button>
                </div>

                {/* Historique des scans */}
                <div className="mt-6 border-t pt-4">
                  <h3 className="font-display text-sm font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Historique des accès ({historiqueData?.total_scans || 0})
                  </h3>
                  {loadingHistorique ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-16 animate-pulse rounded-lg bg-muted"
                        />
                      ))}
                    </div>
                  ) : historiqueData?.scans?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun professionnel n'a encore scanné ce code QR
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {historiqueData?.scans?.map((scan: any) => (
                        <div
                          key={scan.id}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary font-bold text-sm flex-shrink-0">
                            {scan.professionnel?.prenom?.[0]}
                            {scan.professionnel?.nom?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">
                              Dr. {scan.professionnel?.prenom}{" "}
                              {scan.professionnel?.nom}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {scan.professionnel?.role}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                Scanné le{" "}
                                {new Date(scan.createdAt).toLocaleString(
                                  "fr-FR",
                                  {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  },
                                )}
                              </span>
                              <StatusBadge status={scan.statut} />
                            </div>
                            {scan.date_fin && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Accès jusqu'au{" "}
                                {new Date(scan.date_fin).toLocaleString(
                                  "fr-FR",
                                  {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  },
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
