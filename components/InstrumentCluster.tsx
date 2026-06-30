type Props = {
  faturamento: number;
  km: number | null;
  liquido: number;
};

function fmtMoney(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function InstrumentCluster({ faturamento, km, liquido }: Props) {
  return (
    <div className="grid grid-cols-3 rounded-2xl border border-hairline bg-bg-panel overflow-hidden">
      <Gauge label="Faturado hoje" value={`R$ ${fmtMoney(faturamento)}`} />
      <Gauge
        label="Km rodado"
        value={km !== null ? km.toLocaleString("pt-BR") : "—"}
        suffix={km !== null ? "km" : undefined}
        border
      />
      <Gauge label="Líquido hoje" value={`R$ ${fmtMoney(liquido)}`} accent border />
    </div>
  );
}

function Gauge({
  label,
  value,
  suffix,
  accent,
  border,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
  border?: boolean;
}) {
  return (
    <div
      className={`px-4 py-6 sm:px-6 sm:py-8 ${
        border ? "border-l border-hairline" : ""
      }`}
    >
      <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2">
        {label}
      </div>
      <div
        className={`font-display font-bold tabular leading-none text-2xl sm:text-4xl ${
          accent ? "text-odometer" : "text-text-primary"
        }`}
      >
        {value}
        {suffix && (
          <span className="text-xs sm:text-sm font-sans font-medium text-text-muted ml-1">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
