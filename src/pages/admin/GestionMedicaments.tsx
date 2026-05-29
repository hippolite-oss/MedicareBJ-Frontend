/**
 * pages/admin/GestionMedicaments.tsx — Gestion des médicaments (Admin)
 */
import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { useMedicaments } from '@/hooks/useQueries';
import { adminService } from '@/services/adminService';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface Medicament {
  id: string;
  nom: string;
  dosage: string;
  forme: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FormData {
  nom: string;
  dosage: string;
  forme: string;
}

export default function GestionMedicaments() {
  const [searchQuery, setSearchQuery] = useState('');
  const qc = useQueryClient();

  // Charger les médicaments
  const { data, isLoading } = useMedicaments({ limit: 1000, search: searchQuery });
  const medicaments: Medicament[] = data?.medicaments ?? [];
  const total = data?.total ?? 0;

  // Dialog ajout/modification
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMedicament, setEditingMedicament] = useState<Medicament | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    dosage: '',
    forme: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Dialog suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [medicamentToDelete, setMedicamentToDelete] = useState<Medicament | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Ouvrir le dialog d'ajout
  const handleAdd = () => {
    setEditingMedicament(null);
    setFormData({ nom: '', dosage: '', forme: '' });
    setDialogOpen(true);
  };

  // Ouvrir le dialog de modification
  const handleEdit = (medicament: Medicament) => {
    setEditingMedicament(medicament);
    setFormData({
      nom: medicament.nom,
      dosage: medicament.dosage,
      forme: medicament.forme || '',
    });
    setDialogOpen(true);
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.dosage) {
      toast.error('Le nom et le dosage sont obligatoires');
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingMedicament) {
        // Modification
        await adminService.updateMedicament(editingMedicament.id, formData);
        toast.success('Médicament modifié avec succès');
      } else {
        // Création
        await adminService.creerMedicament(formData);
        toast.success('Médicament ajouté avec succès');
      }

      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: ['medicaments'] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  // Ouvrir le dialog de suppression
  const handleDeleteClick = (medicament: Medicament) => {
    setMedicamentToDelete(medicament);
    setDeleteDialogOpen(true);
  };

  // Confirmer la suppression
  const handleDeleteConfirm = async () => {
    if (!medicamentToDelete) return;

    try {
      setDeleting(true);
      await adminService.deleteMedicament(medicamentToDelete.id);
      toast.success('Médicament supprimé avec succès');
      setDeleteDialogOpen(false);
      qc.invalidateQueries({ queryKey: ['medicaments'] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Impossible de supprimer le médicament');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Médicaments"
        subtitle="Gérer le catalogue des médicaments disponibles dans le système"
        actions={
          <Button onClick={handleAdd} className="rounded-full bg-gradient-primary shadow-glow">
            <Plus className="mr-1.5 h-4 w-4" /> Ajouter un médicament
          </Button>
        }
      />

      <Card className="rounded-2xl shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Catalogue des Médicaments</CardTitle>
              <CardDescription>
                {total} médicament{total > 1 ? 's' : ''} au total
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barre de recherche */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un médicament..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : medicaments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-16 text-center">
              <Search className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">
                {searchQuery ? "Aucun résultat pour votre recherche" : "Aucun médicament dans le catalogue"}
              </p>
              {!searchQuery && (
                <Button onClick={handleAdd} className="mt-4 rounded-full" variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Ajouter le premier médicament
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Forme</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicaments.map((medicament) => (
                    <TableRow key={medicament.id}>
                      <TableCell className="font-medium">{medicament.nom}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{medicament.dosage}</Badge>
                      </TableCell>
                      <TableCell>{medicament.forme || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(medicament)}
                            className="h-8 w-8 rounded-full p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(medicament)}
                            className="h-8 w-8 rounded-full p-0 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Ajout/Modification */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingMedicament ? 'Modifier le médicament' : 'Ajouter un médicament'}
            </DialogTitle>
            <DialogDescription>
              {editingMedicament
                ? 'Modifiez les informations du médicament'
                : 'Ajoutez un nouveau médicament au catalogue'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom du médicament *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: Paracétamol"
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="Ex: 500mg"
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="forme">Forme pharmaceutique</Label>
                <Input
                  id="forme"
                  value={formData.forme}
                  onChange={(e) => setFormData({ ...formData, forme: e.target.value })}
                  placeholder="Ex: comprimé, sirop, injection..."
                  className="rounded-xl"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
                className="rounded-full"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-full bg-gradient-primary shadow-glow">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingMedicament ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le médicament{' '}
              <strong>{medicamentToDelete?.nom} {medicamentToDelete?.dosage}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="rounded-full">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
