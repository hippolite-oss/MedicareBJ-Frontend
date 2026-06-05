import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import ToastProvider from "@/components/ToastProvider";

// Layouts
import PatientLayout from "./layouts/PatientLayout";
import MedecinLayout from "./layouts/MedecinLayout";
import AdminLayout from "./layouts/AdminLayout";

// Pages publiques
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterPro from "./pages/RegisterPro";
import NotFound from "./pages/NotFound";
import PaiementRetour from "./pages/PaiementRetour";

// Pages patient
import PatientDashboard from "./pages/patient/Dashboard";
import MonDossier from "./pages/patient/MonDossier";
import CodeQR from "./pages/patient/CodeQR";
import GestionAcces from "./pages/patient/GestionAcces";
import RendezVous from "./pages/patient/RendezVous";
import Paiements from "./pages/patient/Paiements";
import Messagerie from "./pages/patient/Messagerie";
import Notifications from "./pages/patient/Notifications";
import Profil from "./pages/patient/Profil";

// Pages médecin (lazy)
const MedecinDashboard = lazy(() => import("./pages/medecin/Dashboard"));
const RecherchePatient = lazy(() => import("./pages/medecin/RecherchePatient"));
const DossierPatient = lazy(() => import("./pages/medecin/DossierPatient"));
const NouvelleConsultation = lazy(
  () => import("./pages/medecin/NouvelleConsultation"),
);
const MesPatients = lazy(() => import("./pages/medecin/MesPatients"));
const MonAgenda = lazy(() => import("./pages/medecin/MonAgenda"));
const RdvEnAttente = lazy(() => import("./pages/medecin/RdvEnAttente"));
const JournalActivite = lazy(() => import("./pages/medecin/JournalActivite"));
const MedecinMessages = lazy(() => import("./pages/medecin/Messagerie"));
const MedecinNotifications = lazy(
  () => import("./pages/medecin/Notifications"),
);
const MedecinProfil = lazy(() => import("./pages/medecin/Profil"));
// Pages admin (lazy)
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const GestionComptes = lazy(() => import("./pages/admin/GestionComptes"));
const ValidationMedecins = lazy(
  () => import("./pages/admin/ValidationMedecins"),
);
const GestionSignalements = lazy(
  () => import("./pages/admin/GestionSignalements"),
);
const GestionHopitaux = lazy(() => import("./pages/admin/GestionHopitaux"));
const AuditAcces = lazy(() => import("./pages/admin/AuditAcces"));
const SupervisionTransactions = lazy(
  () => import("./pages/admin/SupervisionTransactions"),
);
const GestionDroits = lazy(() => import("./pages/admin/GestionDroits"));
const GestionMedicaments = lazy(
  () => import("./pages/admin/GestionMedicaments"),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Loader minimal pendant le lazy loading
function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ToastProvider />
      <Toaster />
      <Sonner position="top-right" richColors />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ── PUBLIQUES ── */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register/pro" element={<RegisterPro />} />
              <Route path="/paiement/retour" element={<PaiementRetour />} />

              {/* ── PATIENT ── */}
              <Route path="/patient" element={<PatientLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<PatientDashboard />} />
                <Route path="dossier" element={<MonDossier />} />
                <Route path="qr" element={<CodeQR />} />
                <Route path="acces" element={<GestionAcces />} />
                <Route path="rdv" element={<RendezVous />} />
                <Route path="paiements" element={<Paiements />} />
                <Route path="messages" element={<Messagerie />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profil" element={<Profil />} />
              </Route>

              {/* ── MÉDECIN ── */}
              <Route path="/medecin" element={<MedecinLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<MedecinDashboard />} />
                <Route path="recherche" element={<RecherchePatient />} />
                <Route path="patient/:id" element={<DossierPatient />} />
                <Route
                  path="consultations"
                  element={<NouvelleConsultation />}
                />
                <Route path="patients" element={<MesPatients />} />
                <Route path="agenda" element={<MonAgenda />} />
                <Route path="rdv-en-attente" element={<RdvEnAttente />} />
                <Route path="journal" element={<JournalActivite />} />
                <Route path="messages" element={<MedecinMessages />} />
                <Route
                  path="notifications"
                  element={<MedecinNotifications />}
                />
                <Route path="profil" element={<MedecinProfil />} />
              </Route>

              {/* ── ADMIN ── */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="comptes" element={<GestionComptes />} />
                <Route path="validations" element={<ValidationMedecins />} />
                <Route path="signalements" element={<GestionSignalements />} />
                <Route path="hopitaux" element={<GestionHopitaux />} />
                <Route path="medicaments" element={<GestionMedicaments />} />
                <Route path="audit" element={<AuditAcces />} />
                <Route
                  path="transactions"
                  element={<SupervisionTransactions />}
                />
                <Route path="droits" element={<GestionDroits />} />
              </Route>

              {/* ── 404 ── */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
