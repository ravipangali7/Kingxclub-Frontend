import type { PublicPaymentMethod } from "@/api/site";
import { getMediaUrl } from "@/lib/api";
import { CreditCard } from "lucide-react";

function sectionIconSrc(value: string): string {
  return value.trim().startsWith("http") ? value.trim() : getMediaUrl(value.trim());
}

interface SecondHomePaymentsAcceptedProps {
  paymentMethods: PublicPaymentMethod[];
  sectionTitle?: string;
  sectionSvg?: string;
}

export function SecondHomePaymentsAccepted({ paymentMethods, sectionTitle, sectionSvg }: SecondHomePaymentsAcceptedProps) {
  if (!paymentMethods || paymentMethods.length === 0) return null;

  return (
    <section className="container px-4 py-6">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        {sectionSvg?.trim() ? (
          <img src={sectionIconSrc(sectionSvg)} alt="" className="h-5 w-5 object-contain" />
        ) : (
          <CreditCard className="h-5 w-5 text-primary" />
        )}
        <h2 className="font-display font-bold text-lg text-foreground">
          {sectionTitle || "Payments Accepted"}
        </h2>
      </div>

      {/* Payment method images row */}
      <div className="flex flex-wrap gap-3 items-center">
        {paymentMethods.map((pm) => {
          const imgSrc = pm.image_url ? getMediaUrl(pm.image_url) : undefined;
          return imgSrc ? (
            <div
              key={pm.id}
              className="h-10 px-3 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center hover:border-white/20 transition-colors"
              title={pm.name}
            >
              <img
                src={imgSrc}
                alt={pm.name}
                className="h-6 w-auto max-w-[72px] object-contain opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>
          ) : (
            <div
              key={pm.id}
              className="h-10 px-3 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center"
              title={pm.name}
            >
              <span className="text-xs font-medium text-muted-foreground">{pm.name}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
