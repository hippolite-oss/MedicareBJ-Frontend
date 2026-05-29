// Profil patient — données réelles via API.
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { dossierService } from "@/services/dossierService";
import { Camera, Loader2, Activity } from "lucide-react";
import { getImageUrl } from "@/utils/imageUrl";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { successMessages } from "@/utils/errorMessages";
import { useMonDossier } from "@/hooks/useQueries";
import { useQueryClient } from "@tanstack/react-query";

export default function Profil() {
  const { user, updateUser, refreshUser } = useAuth();
  const { handleError, handleSuccess } = useErrorHandler();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    prenom: user?.prenom ?? "",
    nom: user?.nom ?? "",
    telephone: (user as any)?.telephone ?? "",
  });
  const [pwForm, setPwForm] = useState({
    actuel: "",
    nouveau: "",
    confirm: "",
  });

  const { data: dossierData } = useMonDossier();
  const qc = useQueryClient();
  const dossier = dossierData?.dossier;
  const profilBio = dossier?.patient?.patient;

  const [bioForm, setBioForm] = useState({
    groupe_sanguin: "",
    poids_kg: "",
    taille_cm: "",
  });
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => {
    if (profilBio) {
      setBioForm({
        groupe_sanguin: profilBio.groupe_sanguin ?? "",
        poids_kg: profilBio.poids_kg ? String(profilBio.poids_kg) : "",
        taille_cm: profilBio.taille_cm ? String(profilBio.taille_cm) : "",
      });
    }
  }, [profilBio]);

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      handleError(null, "Veuillez sélectionner une image (JPG, PNG ou WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      handleError(null, "L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      await api.post("/uploads/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refreshUser();
      if (fileInputRef.current) fileInputRef.current.value = "";
      handleSuccess(successMessages.photoUpdated);
    } catch (err: any) {
      handleError(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res: any = await api.patch(`/utilisateurs/${user?.id}`, form);
      updateUser(res?.data?.user ?? form);
      handleSuccess(successMessages.profileUpdated);
    } catch (err: any) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePw = async () => {
    if (!pwForm.actuel || !pwForm.nouveau) {
      handleError(null, "Veuillez remplir tous les champs.");
      return;
    }
    if (pwForm.nouveau !== pwForm.confirm) {
      handleError(null, "Les mots de passe ne correspondent pas.");
      return;
    }
    if (pwForm.nouveau.length < 8) {
      handleError(null, "Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/utilisateurs/${user?.id}/password`, {
        mot_de_passe_actuel: pwForm.actuel,
        nouveau_mot_de_passe: pwForm.nouveau,
      });
      handleSuccess(successMessages.passwordChanged);
      setPwForm({ actuel: "", nouveau: "", confirm: "" });
    } catch (err: any) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBio = async () => {
    if (!dossier?.id) return;
    setSavingBio(true);
    try {
      const payload: Record<string, unknown> = {};
      if (bioForm.groupe_sanguin)
        payload.groupe_sanguin = bioForm.groupe_sanguin;
      if (bioForm.poids_kg) payload.poids_kg = parseFloat(bioForm.poids_kg);
      if (bioForm.taille_cm)
        payload.taille_cm = parseInt(bioForm.taille_cm, 10);
      await dossierService.updateProfilMedical(dossier.id, payload);
      qc.invalidateQueries({ queryKey: ["mon-dossier"] });
      handleSuccess("Informations biométriques enregistrées.");
    } catch (err: any) {
      handleError(err);
    } finally {
      setSavingBio(false);
    }
  };

  const initials = user ? `${user.prenom[0]}${user.nom[0]}`.toUpperCase() : "?";
  // Ajouter un timestamp pour forcer le rechargement de l'image et éviter le cache
  const avatarUrl = user?.photo_profil
    ? `${getImageUrl(user.photo_profil)}?t=${Date.now()}`
    : null;

  return (
    <>
      <PageHeader
        title="Mon profil"
        subtitle="Gérez vos informations personnelles et préférences."
      />

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Avatar */}
          <Card className="rounded-2xl shadow-card lg:col-span-1">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user?.fullName}
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-background shadow-card"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary ring-4 ring-background shadow-card">
                    {initials}
                  </div>
                )}
                <button
                  onClick={handlePhotoClick}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-base hover:scale-110"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">
                {user?.prenom} {user?.nom}
              </h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="mt-1 text-xs text-muted-foreground capitalize">
                {user?.role}
              </p>
            </CardContent>
          </Card>

          {/* Formulaire */}
          <Card className="rounded-2xl shadow-card lg:col-span-2">
            <CardContent className="p-6">
              <h3 className="mb-4 font-display text-base font-semibold">
                Informations personnelles
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">
                    Prénom
                  </Label>
                  <Input
                    value={form.prenom}
                    onChange={(e) =>
                      setForm({ ...form, prenom: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">
                    Nom
                  </Label>
                  <Input
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">
                    Téléphone
                  </Label>
                  <Input
                    value={form.telephone}
                    onChange={(e) =>
                      setForm({ ...form, telephone: e.target.value })
                    }
                    placeholder="+229 97 XX XX XX"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    value={user?.email ?? ""}
                    disabled
                    className="opacity-60"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-primary shadow-glow"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Sauvegarder
                </Button>
              </div>

              <Separator className="my-6" />

              <h3 className="mb-4 font-display text-base font-semibold">
                Changer le mot de passe
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label className="mb-1.5 block text-sm font-medium">
                    Mot de passe actuel
                  </Label>
                  <Input
                    type="password"
                    value={pwForm.actuel}
                    onChange={(e) =>
                      setPwForm({ ...pwForm, actuel: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">
                    Nouveau mot de passe
                  </Label>
                  <Input
                    type="password"
                    value={pwForm.nouveau}
                    onChange={(e) =>
                      setPwForm({ ...pwForm, nouveau: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">
                    Confirmer
                  </Label>
                  <Input
                    type="password"
                    value={pwForm.confirm}
                    onChange={(e) =>
                      setPwForm({ ...pwForm, confirm: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleChangePw}
                  disabled={saving}
                  variant="outline"
                  className="rounded-full"
                >
                  Changer le mot de passe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Biométrie — pleine largeur */}
        <Card className="rounded-2xl shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="font-display text-base font-semibold">
                Informations biométriques
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Groupe sanguin
                </Label>
                <Select
                  value={bioForm.groupe_sanguin}
                  onValueChange={(v) =>
                    setBioForm({ ...bioForm, groupe_sanguin: v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                      (g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Poids (kg)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  step={0.1}
                  value={bioForm.poids_kg}
                  onChange={(e) =>
                    setBioForm({ ...bioForm, poids_kg: e.target.value })
                  }
                  placeholder="ex. 65"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Taille (cm)
                </Label>
                <Input
                  type="number"
                  min={30}
                  max={250}
                  value={bioForm.taille_cm}
                  onChange={(e) =>
                    setBioForm({ ...bioForm, taille_cm: e.target.value })
                  }
                  placeholder="ex. 170"
                />
              </div>
            </div>

            {/* Affichage IMC en temps réel si poids et taille sont renseignés */}
            {bioForm.poids_kg && bioForm.taille_cm && (
              <div className="mt-4 rounded-xl bg-primary-soft p-3 flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">IMC calculé</p>
                  <p className="font-display font-bold text-primary">
                    {(
                      parseFloat(bioForm.poids_kg) /
                      Math.pow(parseFloat(bioForm.taille_cm) / 100, 2)
                    ).toFixed(1)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      {(() => {
                        const v =
                          parseFloat(bioForm.poids_kg) /
                          Math.pow(parseFloat(bioForm.taille_cm) / 100, 2);
                        return v < 18.5
                          ? "— Insuffisance pondérale"
                          : v < 25
                            ? "— Normal"
                            : v < 30
                              ? "— Surpoids"
                              : "— Obésité";
                      })()}
                    </span>
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleSaveBio}
                disabled={savingBio || !dossier?.id}
                className="bg-gradient-primary shadow-glow"
              >
                {savingBio ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Enregistrer les données biométriques
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
