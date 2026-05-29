// Recherche patient — par nom, ID dossier ou scan QR.
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { qrcodeService } from "@/services/qrcodeService";
import api from "@/services/api";
import { toast } from "sonner";
import {
  Search,
  ScanLine,
  AlertCircle,
  Loader2,
  User,
  Camera,
  X,
  FlipHorizontal,
  Zap,
  ZapOff,
  CheckCircle2,
} from "lucide-react";
import { getImageUrl } from "@/utils/imageUrl";
import { cn } from "@/lib/utils";
import type QrScannerType from "qr-scanner";

/** UUID du dossier (id technique), pas le numéro affiché type DMB-2026-XXXX */
const DOSSIER_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function RecherchePatient() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  // ── État modal scan ──────────────────────────────────────
  const [scanOpen, setScanOpen] = useState(false);
  const [scanToken, setScanToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  // ── État caméra ──────────────────────────────────────────
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasMultipleCams, setHasMultipleCams] = useState(false);
  const [currentFacing, setCurrentFacing] = useState<"environment" | "user">(
    "environment",
  );
  const [qrDetected, setQrDetected] = useState(false);

  // Ref vers l'instance QrScanner
  const qrScannerRef = useRef<QrScannerType | null>(null);

  // ── Ref callback : fiable même avec rendu conditionnel ───
  // Quand l'élément <video> est monté dans le DOM, videoEl est mis à jour.
  // useEffect attend les deux conditions (cameraMode=true ET videoEl≠null)
  // avant de démarrer le scanner → aucun problème de timing.
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const videoRefCallback = useCallback((el: HTMLVideoElement | null) => {
    setVideoEl(el);
  }, []);

  // ── Démarrer le scanner dès que la caméra est activée ET la vidéo montée ──
  useEffect(() => {
    if (!cameraMode || !videoEl) {
      if (!cameraMode) stopCamera();
      return;
    }

    let active = true;
    let scannerInstance: QrScannerType | null = null;

    const init = async () => {
      try {
        const { default: QrScanner } = await import("qr-scanner");
        if (!active || !videoEl) return;

        scannerInstance = new QrScanner(
          videoEl,
          (result) => {
            if (!active) return;
            const token = result.data.trim();
            if (!token) return;

            // Flash de succès avant de fermer
            setQrDetected(true);
            setTimeout(() => {
              scannerInstance?.stop();
              scannerInstance?.destroy();
              qrScannerRef.current = null;
              if (active) {
                setCameraMode(false);
                setQrDetected(false);
                handleCameraDetected(token);
              }
            }, 350);
          },
          {
            preferredCamera: currentFacing,
            highlightScanRegion: true, // overlay semi-transparent autour de la zone
            highlightCodeOutline: true, // contour coloré sur le QR détecté
            maxScansPerSecond: 25, // scan haute fréquence (WASM)
            returnDetailedScanResult: true,
          },
        );

        qrScannerRef.current = scannerInstance;
        await scannerInstance.start();

        // Vérifier le flash/torche
        const flashAvailable = await scannerInstance.hasFlash();
        if (active) setHasTorch(flashAvailable);

        // Lister les caméras disponibles
        const cams = await QrScanner.listCameras(false);
        if (active) setHasMultipleCams(cams.length > 1);
      } catch {
        if (active) {
          setCameraError(
            "Impossible d'accéder à la caméra. Vérifiez les permissions du navigateur.",
          );
          setCameraMode(false);
        }
      }
    };

    init();

    return () => {
      active = false;
      scannerInstance?.stop();
      scannerInstance?.destroy();
      qrScannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraMode, videoEl]);

  // ── Utilitaires caméra ───────────────────────────────────
  const stopCamera = () => {
    qrScannerRef.current?.stop();
    qrScannerRef.current?.destroy();
    qrScannerRef.current = null;
    setTorchOn(false);
    setHasTorch(false);
    setHasMultipleCams(false);
    setCameraError(null);
    setQrDetected(false);
  };

  const handleToggleTorch = async () => {
    if (!qrScannerRef.current) return;
    try {
      await qrScannerRef.current.toggleFlash();
      setTorchOn((v) => !v);
    } catch {}
  };

  const handleFlipCamera = async () => {
    if (!qrScannerRef.current) return;
    try {
      const next = currentFacing === "environment" ? "user" : "environment";
      await qrScannerRef.current.setCamera(next);
      setCurrentFacing(next);
    } catch {}
  };

  // ── Validation via caméra (indépendante du token manuel) ─
  const handleCameraDetected = async (token: string) => {
    if (!token) return;
    setScanning(true);
    try {
      const res: any = await qrcodeService.scanner(token);
      setScanResult(res?.data);
      toast.success("QR scanné — accès accordé");
    } catch (err: any) {
      toast.error(err?.message ?? "QR invalide ou expiré");
    } finally {
      setScanning(false);
    }
  };

  // ── Fermeture propre du modal ────────────────────────────
  const handleModalClose = (open: boolean) => {
    if (!open) {
      stopCamera();
      setCameraMode(false);
      setScanOpen(false);
      setScanToken("");
      setScanResult(null);
    }
  };

  // ── Recherche par nom / UUID dossier ─────────────────────
  const handleSearch = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    setSearched(true);
    try {
      const trimmed = query.trim();
      if (DOSSIER_UUID_REGEX.test(trimmed)) {
        navigate(`/medecin/patient/${trimmed}`);
        return;
      }
      const res: any = await api.get("/utilisateurs/patients/recherche", {
        params: { search: trimmed },
      });
      const patients = res?.data?.patients ?? res?.patients ?? [];
      setResults(Array.isArray(patients) ? patients : []);
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur de recherche");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleOpenDossierByUser = async (userId: string) => {
    try {
      const patient = results.find((p) => p.id === userId);
      if (patient?.id_dossier) {
        navigate(`/medecin/patient/${patient.id_dossier}`);
      } else {
        toast.error("Dossier introuvable pour ce patient");
      }
    } catch {
      toast.error("Impossible d'accéder au dossier");
    }
  };

  // ── Validation via token manuel (inchangée) ──────────────
  const handleScan = async () => {
    if (!scanToken.trim()) {
      toast.error("Collez le token QR du patient.");
      return;
    }
    setScanning(true);
    try {
      const res: any = await qrcodeService.scanner(scanToken.trim());
      setScanResult(res?.data);
      toast.success("QR validé — accès accordé");
    } catch (err: any) {
      toast.error(err?.message ?? "QR invalide ou expiré");
    } finally {
      setScanning(false);
    }
  };

  const handleOpenDossier = () => {
    if (scanResult?.id_dossier) {
      navigate(`/medecin/patient/${scanResult.id_dossier}`);
      setScanOpen(false);
    }
  };

  // ────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        title="Recherche patient"
        subtitle="Trouvez un patient par nom, numéro de dossier ou scannez son QR code."
      />

      <Card className="mb-6 rounded-2xl shadow-card">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Nom du patient ou n° de dossier (ex. DMB-2026-…)"
                className="pl-10 rounded-xl h-12 text-base"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={query.trim().length < 2 || searching}
              className="h-12 rounded-xl bg-gradient-primary shadow-glow"
            >
              {searching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Rechercher
            </Button>
            <Button
              onClick={() => setScanOpen(true)}
              variant="outline"
              className="h-12 rounded-xl gap-2 shrink-0"
            >
              <ScanLine className="h-4 w-4" /> Scanner QR
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Recherchez uniquement parmi les patients auxquels vous avez déjà
            accès, ou scannez un QR code patient pour obtenir un accès.
          </p>
        </CardContent>
      </Card>

      {/* Résultats */}
      {searching && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!searching && searched && results.length === 0 && (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">Aucun patient trouvé</p>
            <p className="text-sm text-muted-foreground">
              Vérifiez l'orthographe ou demandez au patient de générer un QR
              code.
            </p>
          </CardContent>
        </Card>
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-3">
          {results.map((p: any, i: number) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="rounded-2xl shadow-card transition-base hover:shadow-elevated">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    {p.photo_profil ? (
                      <img
                        src={getImageUrl(p.photo_profil) || ""}
                        alt={`${p.prenom} ${p.nom}`}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <UserAvatar name={`${p.prenom} ${p.nom}`} size="lg" />
                    )}
                    <div>
                      <h3 className="font-display text-lg font-semibold">
                        {p.prenom} {p.nom}
                      </h3>
                      <p className="text-sm text-muted-foreground">{p.email}</p>
                      {p.numero_dossier && (
                        <p className="text-xs font-medium text-primary">
                          Dossier : {p.numero_dossier}
                        </p>
                      )}
                      {p.telephone && (
                        <p className="text-xs text-muted-foreground">
                          {p.telephone}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleOpenDossierByUser(p.id)}
                    className="rounded-full bg-gradient-primary shadow-glow"
                  >
                    <User className="mr-1.5 h-4 w-4" /> Accéder au dossier
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!searched && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">
            Saisissez au moins 2 caractères pour rechercher
          </p>
        </div>
      )}

      {/* ── Modal scan QR ─────────────────────────────────── */}
      <Dialog open={scanOpen} onOpenChange={handleModalClose}>
        <DialogContent className="rounded-2xl sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="font-display flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-primary" />
              Scanner le QR code patient
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            {/* Indicateur de validation en cours */}
            <AnimatePresence>
              {scanning && !scanResult && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary-soft p-3 text-sm text-primary"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validation du QR code…
                </motion.div>
              )}
            </AnimatePresence>

            {!scanResult ? (
              <>
                {/* ── Zone caméra ─────────────────────────── */}
                {cameraMode ? (
                  /* Conteneur caméra actif */
                  <div
                    className={cn(
                      "relative rounded-2xl overflow-hidden bg-black transition-all duration-300",
                      qrDetected && "ring-4 ring-success",
                    )}
                    style={{ height: 300 }}
                  >
                    {/* Élément vidéo — ref callback = montage fiable */}
                    <video
                      ref={videoRefCallback}
                      className="absolute inset-0 w-full h-full object-cover"
                      playsInline
                      muted
                    />

                    {/* Marqueurs de coins sur la zone de scan */}
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      style={{ zIndex: 10 }}
                    >
                      <div
                        className="relative"
                        style={{ width: 200, height: 200 }}
                      >
                        {/* Coin haut-gauche */}
                        <span className="absolute top-0 left-0 block w-7 h-7 border-t-[3px] border-l-[3px] border-primary rounded-tl" />
                        {/* Coin haut-droit */}
                        <span className="absolute top-0 right-0 block w-7 h-7 border-t-[3px] border-r-[3px] border-primary rounded-tr" />
                        {/* Coin bas-gauche */}
                        <span className="absolute bottom-0 left-0 block w-7 h-7 border-b-[3px] border-l-[3px] border-primary rounded-bl" />
                        {/* Coin bas-droit */}
                        <span className="absolute bottom-0 right-0 block w-7 h-7 border-b-[3px] border-r-[3px] border-primary rounded-br" />

                        {/* Ligne de scan animée */}
                        <motion.div
                          className="absolute left-1 right-1 h-[2px] rounded-full"
                          style={{
                            background:
                              "linear-gradient(to right, transparent, hsl(var(--primary)), transparent)",
                            opacity: 0.9,
                          }}
                          animate={{ top: ["8%", "92%", "8%"] }}
                          transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      </div>
                    </div>

                    {/* Flash de succès */}
                    <AnimatePresence>
                      {qrDetected && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-success/25 backdrop-blur-sm"
                          style={{ zIndex: 30 }}
                        >
                          <CheckCircle2 className="h-14 w-14 text-success drop-shadow-lg" />
                          <p className="text-sm font-semibold text-success drop-shadow">
                            QR code détecté !
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Boutons de contrôle (torch / flip / stop) */}
                    <div
                      className="absolute top-2 right-2 flex items-center gap-1.5"
                      style={{ zIndex: 20 }}
                    >
                      {hasTorch && (
                        <button
                          onClick={handleToggleTorch}
                          title={
                            torchOn ? "Éteindre la lampe" : "Allumer la lampe"
                          }
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-colors",
                            torchOn
                              ? "bg-yellow-400 text-yellow-900"
                              : "bg-black/60 text-white hover:bg-black/80",
                          )}
                        >
                          {torchOn ? (
                            <ZapOff className="h-4 w-4" />
                          ) : (
                            <Zap className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      {hasMultipleCams && (
                        <button
                          onClick={handleFlipCamera}
                          title="Retourner la caméra"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 transition-colors"
                        >
                          <FlipHorizontal className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          stopCamera();
                          setCameraMode(false);
                        }}
                        title="Fermer la caméra"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Hint bas */}
                    <div
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white/80 backdrop-blur-sm whitespace-nowrap"
                      style={{ zIndex: 20 }}
                    >
                      Cadrez le QR code dans le viseur
                    </div>
                  </div>
                ) : (
                  /* Placeholder — caméra inactive */
                  <div className="relative flex h-44 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[hsl(211,35%,10%)]">
                    <div className="absolute inset-6 rounded-xl border-2 border-primary/40 animate-pulse" />
                    <ScanLine className="relative z-10 h-9 w-9 text-primary/60 animate-pulse" />
                    <button
                      onClick={() => {
                        setCameraError(null);
                        setCameraMode(true);
                      }}
                      className="relative z-10 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
                    >
                      <Camera className="h-4 w-4" />
                      Activer la caméra
                    </button>
                    {cameraError && (
                      <p className="relative z-10 max-w-[260px] text-center text-xs text-destructive">
                        {cameraError}
                      </p>
                    )}
                  </div>
                )}

                {/* ── Séparateur ──────────────────────────── */}
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">
                    ou saisir manuellement
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* ── Token manuel (inchangé) ──────────────── */}
                <p className="text-sm text-muted-foreground text-center">
                  Collez le token JWT du QR code ci-dessous :
                </p>
                <Input
                  value={scanToken}
                  onChange={(e) => setScanToken(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
                  className="font-mono text-xs"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleModalClose(false)}
                    className="flex-1 rounded-full"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleScan}
                    disabled={scanning || !scanToken.trim()}
                    className="flex-1 rounded-full bg-gradient-primary shadow-glow"
                  >
                    {scanning ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Valider
                  </Button>
                </div>
              </>
            ) : (
              /* ── Résultat du scan ─────────────────────── */
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="rounded-xl bg-success/10 p-4 ring-1 ring-success/20"
                >
                  <p className="font-semibold text-success flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" /> Accès accordé
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Patient : {scanResult.patient_info?.prenom}{" "}
                    {scanResult.patient_info?.nom}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Accès : {scanResult.type_acces}
                  </p>
                </motion.div>
                <Button
                  onClick={handleOpenDossier}
                  className="w-full rounded-full bg-gradient-primary shadow-glow"
                >
                  Ouvrir le dossier
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
