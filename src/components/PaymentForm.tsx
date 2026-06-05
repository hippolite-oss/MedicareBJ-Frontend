import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone, Loader2, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtFcfa, type PaymentMode } from "@/utils/paymentUtils";
import { isValidTelephoneBJ } from "@/utils/telephone";

interface HopitalInfo {
  nom: string;
  telephone: string;
}

interface PaymentFormProps {
  montant: number;
  hopital?: HopitalInfo | null;
  defaultPhone?: string;
  submitLabel?: string;
  loading?: boolean;
  onSubmit: (mode: PaymentMode, telephone: string) => void | Promise<void>;
}

export function PaymentForm({
  montant,
  hopital,
  defaultPhone = "",
  submitLabel,
  loading = false,
  onSubmit,
}: PaymentFormProps) {
  const [method, setMethod] = useState<PaymentMode>("mtn_money");
  const [phone, setPhone] = useState(defaultPhone);

  const handleSubmit = () => {
    if (!phone) return;
    onSubmit(method, phone);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-primary-soft p-4">
        <p className="text-xs text-muted-foreground">Montant à payer</p>
        <p className="font-display text-2xl font-bold text-primary">{fmtFcfa(montant)}</p>
      </div>

      {hopital && (
        <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="font-medium">Versement à l&apos;établissement</p>
            <p className="text-muted-foreground">{hopital.nom}</p>
            <p className="mt-1 font-mono text-xs text-primary">{hopital.telephone}</p>
          </div>
        </div>
      )}

      <div>
        <Label className="mb-2 block text-sm font-medium">Mode de paiement</Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: "mtn_money" as const, icon: Smartphone, label: "MTN" },
            { v: "moov_money" as const, icon: Smartphone, label: "Moov" },
            { v: "fedapay" as const, icon: CreditCard, label: "Carte" },
          ].map((m) => (
            <button
              key={m.v}
              type="button"
              onClick={() => setMethod(m.v)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-base",
                method === m.v ? "border-primary bg-primary-soft" : "border-border hover:border-primary/40",
              )}
            >
              <m.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-1.5 block text-sm font-medium">
          {method === "fedapay" ? "Téléphone (optionnel)" : "Votre numéro Mobile Money"}
        </Label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+2290194453791"
        />
        {method !== "fedapay" && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            Format Bénin : +22901XXXXXXXX. Vous recevrez une demande de confirmation sur ce numéro.
          </p>
        )}
        {phone && method !== "fedapay" && !isValidTelephoneBJ(phone) && (
          <p className="mt-1 text-xs text-destructive">Numéro invalide — utilisez le format +22901XXXXXXXX</p>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || !phone || (method !== "fedapay" && !isValidTelephoneBJ(phone))}
        className="w-full bg-gradient-primary shadow-glow"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Traitement…
          </>
        ) : (
          submitLabel ?? `Payer ${fmtFcfa(montant)}`
        )}
      </Button>
    </div>
  );
}
