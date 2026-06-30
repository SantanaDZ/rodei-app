"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { DailyRecord, liquido, ganhoPorKm } from "@/lib/types";

type Period = "semana" | "mes" | "ano";

const PERIOD_LABEL: Record<Period, string> = {
  semana: "Semana",
  mes: "Mês",
  ano: "Ano",
};

function startOfPeriod(period: Period, ref: Date) {
  const d = new Date(ref);
  if (period === "semana") {
    const day = d.getDay(); // 0 = domingo
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "mes") {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
  return new Date(d.getFullYear(), 0, 1);
}

function fmtMoney(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDateShort(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function PeriodDashboard({ records }: { records: DailyRecord[] }) {
  const [period, setPeriod] = useState<Period>("semana");

  const filtered = useMemo(() => {
    const start = startOfPeriod(period, new Date());
    return records
      .filter((r) => new Date(r.data + "T00:00:00") >= start)
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [records, period]);

  const summary = useMemo(() => {
    const totalFaturamento = filtered.reduce((s, r) => s + Number(r.faturamento_bruto), 0);
    const totalLiquido = filtered.reduce((s, r) => s + liquido(r), 0);
    const totalKm = filtered.reduce((s, r) => s + Number(r.km_rodado ?? 0), 0);
    const dias = filtered.length;
    const mediaKm = totalKm > 0 ? totalLiquido / totalKm : null;
    return { totalFaturamento, totalLiquido, totalKm, dias, mediaKm };
  }, [filtered]);

  const chartData = filtered.map((r) => ({
    data: fmtDateShort(r.data),
    liquido: Number(liquido(r).toFixed(2)),
  }));

  return (
    <div className="mt-10">
      {/* Tabs */}
      <div className="flex gap-1 rounded-full bg-bg-panel p-1 w-fit border border-hairline">
        {(["semana", "mes", "ano"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              period === p
                ? "bg-odometer text-bg-base"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        <SummaryCard label="Faturado" value={`R$ ${fmtMoney(summary.totalFaturamento)}`} />
        <SummaryCard label="Líquido" value={`R$ ${fmtMoney(summary.totalLiquido)}`} accent />
        <SummaryCard
          label="Km rodado"
          value={summary.totalKm > 0 ? summary.totalKm.toLocaleString("pt-BR") : "—"}
        />
        <SummaryCard
          label="R$/km médio"
          value={summary.mediaKm !== null ? fmtMoney(summary.mediaKm) : "—"}
        />
      </div>

      {/* Chart */}
      <div className="mt-6 rounded-2xl border border-hairline bg-bg-panel p-4 sm:p-6">
        <div className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-4">
          Líquido por dia
        </div>
        {chartData.length > 0 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
                <XAxis
                  dataKey="data"
                  stroke="var(--text-faint)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--text-faint)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-panel-raised)",
                    border: "1px solid var(--hairline)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--text-muted)" }}
                  formatter={(v) => [`R$ ${fmtMoney(Number(v))}`, "Líquido"]}
                />
                <Line
                  type="monotone"
                  dataKey="liquido"
                  stroke="var(--odometer)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--odometer)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState period={period} />
        )}
      </div>

      {/* Ledger */}
      {filtered.length > 0 && (
        <div className="mt-6 rounded-2xl border border-hairline bg-bg-panel overflow-hidden">
          <div className="px-4 sm:px-6 py-3 text-[11px] uppercase tracking-[0.14em] text-text-muted border-b border-hairline">
            Registros do período
          </div>
          <div className="divide-y divide-hairline">
            {[...filtered].reverse().map((r) => {
              const km = ganhoPorKm(r);
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-4 sm:px-6 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted tabular w-12">{fmtDateShort(r.data)}</span>
                    <span
                      className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                        r.origem === "whatsapp"
                          ? "bg-odometer/10 text-odometer-dim"
                          : "bg-text-faint/10 text-text-muted"
                      }`}
                    >
                      {r.origem === "whatsapp" ? "whats" : "form"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 tabular">
                    <span className="text-text-muted">R$ {fmtMoney(Number(r.faturamento_bruto))}</span>
                    <span className="text-text-primary font-medium">
                      R$ {fmtMoney(liquido(r))}
                    </span>
                    {km !== null && (
                      <span className="text-text-faint hidden sm:inline">
                        R$ {fmtMoney(km)}/km
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-bg-panel px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.12em] text-text-muted mb-1">
        {label}
      </div>
      <div
        className={`font-display font-bold tabular text-lg ${
          accent ? "text-odometer" : "text-text-primary"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyState({ period }: { period: Period }) {
  const label = period === "semana" ? "essa semana" : period === "mes" ? "esse mês" : "esse ano";
  return (
    <div className="h-40 flex items-center justify-center text-sm text-text-muted">
      Nenhum registro {label} ainda. Manda um giro pro WhatsApp ou registra ali embaixo.
    </div>
  );
}
