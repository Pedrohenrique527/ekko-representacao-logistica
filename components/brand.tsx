import Image from "next/image";

type EkkoBrandProps = {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
  subtitle?: boolean;
};

export function EkkoBrand({
  compact = false,
  inverse = false,
  className = "",
  subtitle = true,
}: EkkoBrandProps) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <div
        className={`relative shrink-0 overflow-hidden rounded-[10px] border shadow-sm ${
          compact ? "h-9 w-9" : "h-11 w-11"
        } ${inverse ? "border-white/12 bg-[#071014]" : "border-[var(--border)] bg-white"}`}
      >
        <Image
          src="/ekko-logo.png"
          alt="Ekko Revestimentos"
          fill
          priority
          sizes={compact ? "36px" : "44px"}
          className={`object-cover ${inverse ? "ekko-logo-image--inverse" : "ekko-logo-image"}`}
        />
      </div>

      {!compact && (
        <div className="min-w-0 leading-none">
          <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-[var(--text)]">Ekko Representação</p>
          <p className="mt-1 truncate text-[13px] font-semibold tracking-[-0.01em] text-[var(--text)]">Logística</p>
          {subtitle && (
            <p className="mt-1.5 truncate text-[8px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Business Intelligence</p>
          )}
        </div>
      )}
    </div>
  );
}

export function DeveloperSignature({
  inverse = false,
  className = "",
}: {
  inverse?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 text-[9px] text-[var(--muted)] ${className}`}>
      <span className="whitespace-nowrap">Desenvolvido por</span>
      <span className={`relative block h-5 w-[76px] overflow-hidden rounded-[5px] border ${inverse ? "border-white/10 bg-black/35" : "border-[var(--border)] bg-[#071014]"}`}>
        <Image src="/pedro-mariniello-logo.png" alt="Pedro Mariniello" fill sizes="76px" className="object-contain px-1.5" />
      </span>
    </div>
  );
}
