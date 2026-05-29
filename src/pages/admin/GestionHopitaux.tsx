// Gestion des hôpitaux — données réelles via API.
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHopitaux } from "@/hooks/useQueries";
import { adminService } from "@/services/adminService";
import { toast } from "sonner";
import { Search, Plus, Pencil, Power, Trash2, MapPin, Phone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const TYPES = ["CHU", "CHD", "CS", "clinique", "cabinet", "autre"];

const TYPE_COLORS: Record<string, string> = {
  CHU: "bg-primary-soft text-primary",
  CHD: "bg-secondary/15 text-secondary",
  CS:  "bg-info/15 text-info",
  clinique: "bg-accent/20 text-accent-foreground",
  cabinet:  "bg-success/10 text-success",
  autre:    "bg-muted text-muted-foreground",
};

export default function GestionHopitaux() {
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nom: "", type: "CHU", ville: "", adresse: "", telephone: "" });
  
  // Dialog de suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hopitalToDelete, setHopitalToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  
  const qc = useQueryClient();

  const { data, isLoading } = useHopitaux({ limit: 100 });
  const hopitaux: any[] = data?.hopitaux ?? [];

  const filtered = hopitaux.filter((h) =>
    h.nom.toLowerCase().includes(query.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ nom: "", type: "CHU", ville: "", adresse: "", telephone: "" });
    setModalOpen(true);
  };

  const openEdit = (h: any) => {
    setEditing(h);
    setForm({ nom: h.nom, type: h.type, ville: h.ville, adresse: h.adresse ?? "", telephone: h.telephone ?? "" });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.nom || !form.ville) { toast.error("Nom et ville requis."); return; }
    setSaving(true);
    try {
      if (editing) {
        await adminService.updateHopital(editing.id, form);
        toast.success("Hôpital mis à jour");
      } else {
        await adminService.creerHopital(form);
        toast.success("Hôpital ajouté");
      }
      
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ["hopitaux"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatut = async (h: any) => {
    const nouveauStatut = h.statut === "actif" ? "inactif" : "actif";
    try {
      await adminService.updateHopital(h.id, { statut: nouveauStatut });
      qc.invalidateQueries({ queryKey: ["hopitaux"] });
      toast.success(nouveauStatut === "inactif" ? "Hôpital désactivé" : "Hôpital activé");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Erreur");
    }
  };

  const openDeleteDialog = (h: any) => {
    setHopitalToDelete(h);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!hopitalToDelete) return;
    
    setDeleting(true);
    try {
      await adminService.deleteHopital(hopitalToDelete.id);
      toast.success("Hôpital supprimé");
      
      setDeleteDialogOpen(false);
      setHopitalToDelete(null);
      qc.invalidateQueries({ queryKey: ["hopitaux"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Gestion des hôpitaux"
        subtitle="Gérez les établissements de santé partenaires."
        actions={
          <Button onClick={openAdd} className="rounded-full bg-gradient-primary shadow-glow">
            <Plus className="mr-1.5 h-4 w-4" /> Ajouter un hôpital
          </Button>
        }
      />

      <div className="mb-5 relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un hôpital…" className="pl-10 rounded-xl" />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((h: any) => (
            <Card key={h.id} className={cn("rounded-2xl shadow-card transition-base hover:shadow-elevated", h.statut === "inactif" && "opacity-60")}>
              <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", TYPE_COLORS[h.type] ?? "bg-muted text-muted-foreground")}>{h.type}</span>
                    <StatusBadge status={h.statut as any} />
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(h)} className="h-7 w-7 rounded-full p-0">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="sm" onClick={() => toggleStatut(h)}
                      className={cn("h-7 w-7 rounded-full p-0", h.statut === "actif" ? "text-destructive hover:bg-destructive/10" : "text-success hover:bg-success/10")}
                      title={h.statut === "actif" ? "Désactiver" : "Activer"}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="sm" onClick={() => openDeleteDialog(h)}
                      className="h-7 w-7 rounded-full p-0 text-destructive hover:bg-destructive/10"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-display font-semibold">{h.nom}</h3>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {h.ville}{h.adresse ? ` — ${h.adresse}` : ""}</p>
                  {h.telephone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {h.telephone}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal ajout/édition */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Modifier l'hôpital" : "Ajouter un hôpital"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Nom *" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} placeholder="ex. CNHU-HKM Cotonou" />
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Field label="Ville *" value={form.ville} onChange={(v) => setForm({ ...form, ville: v })} placeholder="ex. Cotonou" />
            <Field label="Adresse" value={form.adresse} onChange={(v) => setForm({ ...form, adresse: v })} placeholder="ex. Avenue Jean-Paul II" />
            <Field label="Téléphone" value={form.telephone} onChange={(v) => setForm({ ...form, telephone: v })} placeholder="+229 21 XX XX XX" />
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1 rounded-full">Annuler</Button>
              <Button onClick={save} disabled={saving} className="flex-1 rounded-full bg-gradient-primary shadow-glow">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editing ? "Enregistrer" : "Ajouter"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'hôpital <strong>{hopitalToDelete?.nom}</strong> ?
              Cette action est irréversible et supprimera toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="rounded-full">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm font-medium">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="rounded-xl" />
    </div>
  );
}
