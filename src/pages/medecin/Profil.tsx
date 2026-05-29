// Profil médecin — infos personnelles + profil public + photo.
import { useRef, useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { Camera, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { getImageUrl } from "@/utils/imageUrl";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { successMessages } from "@/utils/errorMessages";

export default function MedecinProfil() {
  const { user, updateUser, refreshUser } = useAuth();
  const { handleError, handleSuccess } = useErrorHandler();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profilPro, setProfilPro] = useState<any>(null);
  const [loadingPro, setLoadingPro] = useState(true);

  const [form, setForm] = useState({
    prenom: user?.prenom ?? "",
    nom: user?.nom ?? "",
    telephone: (user as any)?.telephone ?? "",
  });
  const [pwForm, setPwForm] = useState({ actuel: "", nouveau: "", confirm: "" });

  // Charger le profil professionnel
  useEffect(() => {
    if (!user?.id) return;
    api.get(`/utilisateurs/${user.id}`)
      .then((res: any) => {
        console.log('Réponse API complète:', res?.data); // Debug
        const pp = res?.data?.user?.professionnel; // Changé de profil_professionnel à professionnel
        console.log('Profil professionnel chargé:', pp); // Debug
        console.log('Champs du profil:', pp ? Object.keys(pp) : 'null'); // Debug - voir les champs disponibles
        setProfilPro(pp ?? null);
      })
      .catch((err) => {
        console.error('Erreur chargement profil:', err); // Debug
      })
      .finally(() => setLoadingPro(false));
  }, [user?.id]);

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Veuillez sélectionner une image."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("L'image ne doit pas dépasser 5 Mo."); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res: any = await api.post("/uploads/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      // Recharger l'utilisateur depuis l'API pour obtenir la nouvelle photo
      await refreshUser();
      
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Photo de profil mise à jour");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res: any = await api.patch(`/utilisateurs/${user?.id}`, form);
      updateUser(res?.data?.user ?? form);
      toast.success("Profil mis à jour");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublic = async (value: boolean) => {
    if (!profilPro?.id_utilisateur) {
      console.error('Profil professionnel non chargé ou invalide:', profilPro);
      toast.error("Profil professionnel non disponible");
      return;
    }
    
    console.log('Toggle profil public:', value); // Debug
    
    try {
      const res: any = await api.patch(`/utilisateurs/${user?.id}/profil-pro`, { profil_public: value });
      console.log('Réponse mise à jour:', res); // Debug
      
      setProfilPro((p: any) => ({ ...p, profil_public: value }));
      toast.success(value ? "Profil rendu public" : "Profil masqué");
    } catch (err: any) {
      console.error('Erreur toggle profil:', err); // Debug
      toast.error(err?.response?.data?.message || err?.message || "Erreur lors de la mise à jour");
    }
  };

  const handleChangePw = async () => {
    if (!pwForm.actuel || !pwForm.nouveau) { toast.error("Remplissez tous les champs."); return; }
    if (pwForm.nouveau !== pwForm.confirm) { toast.error("Les mots de passe ne correspondent pas."); return; }
    if (pwForm.nouveau.length < 8) { toast.error("Minimum 8 caractères."); return; }
    setSaving(true);
    try {
      await api.patch(`/utilisateurs/${user?.id}/password`, {
        mot_de_passe_actuel: pwForm.actuel,
        nouveau_mot_de_passe: pwForm.nouveau,
      });
      toast.success("Mot de passe mis à jour");
      setPwForm({ actuel: "", nouveau: "", confirm: "" });
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const initials = user ? `${user.prenom[0]}${user.nom[0]}`.toUpperCase() : "?";
  // Ajouter un timestamp pour forcer le rechargement de l'image et éviter le cache
  const avatarUrl = user?.photo_profil ? `${getImageUrl(user.photo_profil)}?t=${Date.now()}` : null;

  return (
    <>
      <PageHeader title="Mon profil" subtitle="Gérez vos informations personnelles et votre visibilité." />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar + statut */}
        <Card className="rounded-2xl shadow-card lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user?.fullName} className="h-24 w-24 rounded-full object-cover ring-4 ring-background shadow-card" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary ring-4 ring-background shadow-card">
                  {initials}
                </div>
              )}
              <button onClick={handlePhotoClick} disabled={uploading}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-base hover:scale-110"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{user?.prenom} {user?.nom}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {profilPro?.specialite && (
              <p className="mt-1 text-xs text-muted-foreground">{profilPro.specialite}</p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-secondary" />
              <Badge className="rounded-full bg-secondary/15 text-secondary text-xs capitalize">{user?.role}</Badge>
            </div>

            {/* Statut profil public */}
            {loadingPro ? (
              <div className="mt-5 w-full rounded-xl border border-border p-4">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Chargement...</span>
                </div>
              </div>
            ) : profilPro ? (
              <div className="mt-5 w-full rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      {profilPro.profil_public ? <Eye className="h-4 w-4 text-secondary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      Profil public
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {profilPro.profil_public
                        ? "Visible dans la recherche de médecins"
                        : "Masqué — non visible par les patients"
                      }
                    </p>
                  </div>
                  <Switch
                    checked={!!profilPro.profil_public}
                    onCheckedChange={handleTogglePublic}
                  />
                </div>
                {profilPro.profil_public && (
                  <p className="mt-2 text-[10px] text-success font-medium">
                    ✅ Les patients peuvent vous contacter via la messagerie
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-5 w-full rounded-xl border border-dashed border-border p-4">
                <p className="text-xs text-muted-foreground text-center">
                  Profil professionnel non disponible
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formulaire */}
        <Card className="rounded-2xl shadow-card lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="mb-4 font-display text-base font-semibold">Informations personnelles</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Prénom</Label>
                <Input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Nom</Label>
                <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Téléphone</Label>
                <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="+229 97 XX XX XX" />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Email</Label>
                <Input value={user?.email ?? ""} disabled className="opacity-60" />
              </div>
            </div>

            {/* Infos professionnelles (lecture seule) */}
            {profilPro && (
              <>
                <Separator className="my-5" />
                <h3 className="mb-4 font-display text-base font-semibold">Informations professionnelles</h3>
                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground mb-1">Spécialité</p>
                    <p className="font-medium">{profilPro.specialite}</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground mb-1">N° ordre</p>
                    <p className="font-medium font-mono text-xs">{profilPro.numero_ordre}</p>
                  </div>
                  {profilPro.hopital && (
                    <div className="rounded-xl bg-muted/50 p-3 sm:col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Hôpital d'exercice</p>
                      <p className="font-medium">{profilPro.hopital.nom}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="bg-gradient-primary shadow-glow">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sauvegarder
              </Button>
            </div>

            <Separator className="my-6" />

            <h3 className="mb-4 font-display text-base font-semibold">Changer le mot de passe</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="mb-1.5 block text-sm font-medium">Mot de passe actuel</Label>
                <Input type="password" value={pwForm.actuel} onChange={(e) => setPwForm({ ...pwForm, actuel: e.target.value })} placeholder="••••••••" />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Nouveau mot de passe</Label>
                <Input type="password" value={pwForm.nouveau} onChange={(e) => setPwForm({ ...pwForm, nouveau: e.target.value })} placeholder="••••••••" />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Confirmer</Label>
                <Input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} placeholder="••••••••" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleChangePw} disabled={saving} variant="outline" className="rounded-full">
                Changer le mot de passe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
