// Placeholder pour les espaces médecin et admin (à venir).
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Construction, LogOut } from "lucide-react";

export default function ComingSoon({ space }: { space: "Médecin" | "Administrateur" }) {
  const { logout } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-soft p-6">
      <Card className="max-w-md rounded-2xl shadow-elevated">
        <CardContent className="p-8 text-center">
          <Logo className="justify-center" />
          <div className="my-6 flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground">
              <Construction className="h-8 w-8" />
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold">Espace {space}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cette section arrive dans une prochaine itération. L'espace patient est entièrement disponible dès maintenant.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link to="/login"><Button variant="outline" className="w-full" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Changer de compte</Button></Link>
            <Link to="/"><Button variant="ghost" className="w-full">Retour à l'accueil</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
