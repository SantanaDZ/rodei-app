export type DailyRecord = {
  id: string;
  user_id: string;
  data: string; // ISO date
  faturamento_bruto: number;
  km_rodado: number | null;
  horas_trabalhadas: number | null;
  gasto_combustivel: number;
  gasto_outros: number;
  origem: "whatsapp" | "formulario";
  created_at: string;
};

export type User = {
  id: string;
  telefone: string;
  nome: string | null;
  veiculo: string | null;
  placa: string | null;
  magic_token: string;
  status: "onboarding" | "ativo" | "inadimplente";
  created_at: string;
};

export function liquido(r: Pick<DailyRecord, "faturamento_bruto" | "gasto_combustivel" | "gasto_outros">) {
  return Number(r.faturamento_bruto) - Number(r.gasto_combustivel) - Number(r.gasto_outros);
}

export function ganhoPorKm(r: Pick<DailyRecord, "km_rodado" | "faturamento_bruto" | "gasto_combustivel" | "gasto_outros">) {
  if (!r.km_rodado || Number(r.km_rodado) === 0) return null;
  return liquido(r) / Number(r.km_rodado);
}

export function ganhoPorHora(r: Pick<DailyRecord, "horas_trabalhadas" | "faturamento_bruto" | "gasto_combustivel" | "gasto_outros">) {
  if (!r.horas_trabalhadas || Number(r.horas_trabalhadas) === 0) return null;
  return liquido(r) / Number(r.horas_trabalhadas);
}
