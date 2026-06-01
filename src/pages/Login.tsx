// Page de connexion — formulaire connecté à l'API backend.
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowRight, Stethoscope, ShieldCheck, User, Loader2 } from "lucide-react";

const ROLE_ROUTES: Record<string, string> = {
  patient:    '/patient/dashboard',
  usager:     '/patient/dashboard',
  medecin:    '/medecin/dashboard',
  technicien: '/medecin/dashboard',
  admin:      '/admin/dashboard',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Bienvenue ${user.prenom} !`);
      navigate(ROLE_ROUTES[user.role] || '/patient/dashboard');
    } catch (err: any) {
      toast.error(err?.message || "Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  };

  // Comptes de démo (utilise les seeders backend)
  const fillDemo = (role: "patient" | "medecin" | "admin") => {
    const demos: Record<string, { email: string; password: string }> = {
      patient: { email: "patient@medicarebi.bj", password: "Password123!" },
      medecin: { email: "medecin@medicarebi.bj", password: "Password123!" },
      admin:   { email: "admin@medicarebi.bj",   password: "Password123!" },
    };
    setEmail(demos[role].email);
    setPassword(demos[role].password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted/30 via-background to-muted/20 p-6 lg:p-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl shadow-2xl lg:grid-cols-2">
        {/* Colonne formulaire */}
        <div className="flex items-center justify-center bg-background p-6 sm:p-10">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-8 inline-block"><Logo /></Link>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Bienvenue</h1>
            <p className="mt-1 text-sm text-muted-foreground">Connectez-vous à votre carnet de soins.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@email.com"
                type="email"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="text-sm font-medium">Mot de passe</Label>
                <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                  Oublié ?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary shadow-glow" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connexion…</>
              ) : (
                <>Se connecter <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link to="/register" className="font-semibold text-primary hover:underline">S'inscrire</Link>
            </p>

          <Card className="mt-6 rounded-2xl border-dashed">
            <CardContent className="p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"></p>
              <div className="grid grid-cols-3 gap-2">
                <DemoBtn icon={User} label="Patient" onClick={() => fillDemo("patient")} />
                <DemoBtn icon={Stethoscope} label="Médecin" onClick={() => fillDemo("medecin")} />
                <DemoBtn icon={ShieldCheck} label="Admin" onClick={() => fillDemo("admin")} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

         {/* Colonne illustration */}
        <div className="relative hidden overflow-hidden bg-white lg:flex lg:items-center lg:justify-center">
          {/* Image médicale en arrière-plan */}
          <div className="absolute inset-0">
            <img 
              src="/doctor-patitent.jpg" 
              alt="Doctor and patient consultation" 
              className="h-full w-full object-cover object-center"
              style={{ objectPosition: 'center 23%' }}
            />
            {/* Overlay noir semi-transparent pour améliorer la lisibilité */}
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* Contenu centré */}
          <div className="relative z-10 max-w-xl px-10 text-center text-primary-foreground">
            {/* Image médicale illustrative - centrée */}
            <div className="mb-8 relative mx-auto w-fit">
              {/* Cercles décoratifs en arrière-plan */}
              <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
              
              {/* Illustration SVG médicale moderne */}
              <svg viewBox="0 0 400 400" className="relative h-56 w-56 drop-shadow-2xl">
                {/* Cercles de fond */}
                <circle cx="200" cy="200" r="180" fill="white" opacity="0.1" />
                <circle cx="200" cy="200" r="140" fill="white" opacity="0.15" />
                
                {/* Croix médicale centrale */}
                <g transform="translate(200, 200)">
                  <rect x="-15" y="-60" width="30" height="120" rx="8" fill="white" />
                  <rect x="-60" y="-15" width="120" height="30" rx="8" fill="white" />
                  <circle cx="0" cy="0" r="28" fill="hsl(var(--primary))" />
                  <path d="M-10 0 L-4 6 L10 -10" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                
                {/* Éléments décoratifs - molécules/atomes */}
                <circle cx="80" cy="100" r="10" fill="white" opacity="0.4" />
                <circle cx="320" cy="120" r="8" fill="white" opacity="0.4" />
                <circle cx="100" cy="300" r="9" fill="white" opacity="0.4" />
                <circle cx="300" cy="280" r="11" fill="white" opacity="0.4" />
                
                {/* Lignes de connexion */}
                <line x1="80" y1="100" x2="140" y2="140" stroke="white" strokeWidth="2" opacity="0.2" strokeDasharray="4 4" />
                <line x1="320" y1="120" x2="260" y2="160" stroke="white" strokeWidth="2" opacity="0.2" strokeDasharray="4 4" />
              </svg>
            </div>

            {/* Texte */}
            <h2 className="font-display text-3xl font-bold">
              Votre santé, simplifiée.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm opacity-90 leading-relaxed">
              Un dossier médical sécurisé, accessible partout, partagé en un scan.
            </p>
            
            {/* Badges de fonctionnalités */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                Sécurisé
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-medium">
                <Stethoscope className="h-3.5 w-3.5" />
                Professionnel
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-medium">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Mobile
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoBtn({ icon: Icon, label, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-xl border border-border p-2.5 text-xs font-medium hover:border-primary/40 hover:bg-primary-soft"
    >
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </button>
  );
}
