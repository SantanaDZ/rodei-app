"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Field = {
  key: "faturamento_bruto" | "km_rodado" | "horas_trabalhadas" | "gasto_combustivel" | "gasto_outros";
  label: string;
  placeholder: string;
  required?: boolean;
  suffix?: string;
};

const FIELDS: Field[] = [
  { key: "faturamento_bruto", label: "Faturamento bruto", placeholder: "0,00", required: true, suffix: "R$" },
  { key: "km_rodado", label: "Km rodado", placeholder: "0", suffix: "km" },
  { key: "horas_trabalhadas", label: "Horas trabalhadas", placeholder: "0", suffix: "h" },
  { key: "gasto_combustivel", label: "Gasto com combustível", placeholder: "0,00", suffix: "R$" },
  { key: "gasto_outros", label: "Outros gastos", placeholder: "0,00", suffix: "R$" },
];

export default function RegistrarPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!values.faturamento_bruto) {
      setError("Preenche pelo menos o faturamento do dia.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: params.token,
          origem: "formulario",
          faturamento_bruto: parseFloat(values.faturamento_bruto.replace(",", ".")) || 0,
          km_rodado: values.km_rodado ? parseFloat(values.km_rodado.replace(",", ".")) : null,
          horas_trabalhadas: values.horas_trabalhadas
            ? parseFloat(values.horas_trabalhadas.replace(",", "."))
            : null,
          gasto_combustivel: values.gasto_combustivel
            ? parseFloat(values.gasto_combustivel.replace(",", "."))
            : 0,
          gasto_outros: values.gasto_outros ? parseFloat(values.gasto_outros.replace(",", ".")) : 0,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Não deu pra salvar o registro.");
      }

      router.push(`/r/${params.token}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 px-4 sm:px-8 py-8 max-w-md mx-auto w-full">
      <div className="text-odometer font-display font-bold text-sm tracking-[0.14em] mb-1">
        RODEI
      </div>
      <h1 className="text-lg font-semibold mb-6">Registrar o dia de hoje</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label className="block text-[11px] uppercase tracking-[0.1em] text-text-muted mb-1.5">
              {field.label}
              {field.required && <span className="text-odometer ml-1">*</span>}
            </label>
            <div className="flex items-center rounded-xl border border-hairline bg-bg-panel focus-within:border-odometer transition-colors">
              {field.suffix === "R$" && (
                <span className="pl-4 text-text-faint text-sm">R$</span>
              )}
              <input
                inputMode="decimal"
                placeholder={field.placeholder}
                value={values[field.key] ?? ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [field.key]: e.target.value }))
                }
                className="w-full bg-transparent px-4 py-3 font-display tabular text-lg outline-none placeholder:text-text-faint"
              />
              {field.suffix && field.suffix !== "R$" && (
                <span className="pr-4 text-text-faint text-sm">{field.suffix}</span>
              )}
            </div>
          </div>
        ))}

        {error && <p className="text-danger text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-odometer text-bg-base font-semibold py-3.5 rounded-xl hover:brightness-110 transition disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar registro"}
        </button>
      </form>
    </main>
  );
}
