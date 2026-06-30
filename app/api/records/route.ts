import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserByToken, getUserByPhone, isInternalCall } from "@/lib/auth";
import { DailyRecord } from "@/lib/types";

// GET /api/records?token=...&from=2026-06-01&to=2026-06-30
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  if (!token) {
    return NextResponse.json({ error: "token é obrigatório" }, { status: 400 });
  }

  const user = await getUserByToken(token);
  if (!user) {
    return NextResponse.json({ error: "link inválido" }, { status: 404 });
  }

  const params: (string | undefined)[] = [user.id];
  let where = "user_id = $1";
  if (from) {
    params.push(from);
    where += ` AND data >= $${params.length}`;
  }
  if (to) {
    params.push(to);
    where += ` AND data <= $${params.length}`;
  }

  const { rows } = await pool.query<DailyRecord>(
    `SELECT * FROM daily_records WHERE ${where} ORDER BY data DESC`,
    params
  );

  return NextResponse.json({ user, records: rows });
}

type RecordPayload = {
  token?: string; // identifica via formulário web
  telefone?: string; // identifica via n8n (chamada interna)
  data?: string; // default: hoje
  faturamento_bruto: number;
  km_rodado?: number | null;
  horas_trabalhadas?: number | null;
  gasto_combustivel?: number;
  gasto_outros?: number;
  origem?: "whatsapp" | "formulario";
};

// POST /api/records — cria ou atualiza (upsert) o registro do dia
export async function POST(req: NextRequest) {
  const body: RecordPayload = await req.json();

  let userId: string;
  let origem: "whatsapp" | "formulario" = body.origem ?? "formulario";

  if (body.token) {
    const user = await getUserByToken(body.token);
    if (!user) {
      return NextResponse.json({ error: "link inválido" }, { status: 404 });
    }
    userId = user.id;
  } else if (body.telefone && isInternalCall(req)) {
    const user = await getUserByPhone(body.telefone);
    if (!user) {
      return NextResponse.json({ error: "usuário não cadastrado" }, { status: 404 });
    }
    userId = user.id;
    origem = "whatsapp";
  } else {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  if (body.faturamento_bruto === undefined || body.faturamento_bruto === null) {
    return NextResponse.json(
      { error: "faturamento_bruto é obrigatório" },
      { status: 422 }
    );
  }

  const data = body.data ?? new Date().toISOString().slice(0, 10);

  const { rows } = await pool.query<DailyRecord>(
    `INSERT INTO daily_records
      (user_id, data, faturamento_bruto, km_rodado, horas_trabalhadas, gasto_combustivel, gasto_outros, origem)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (user_id, data) DO UPDATE SET
       faturamento_bruto = EXCLUDED.faturamento_bruto,
       km_rodado = COALESCE(EXCLUDED.km_rodado, daily_records.km_rodado),
       horas_trabalhadas = COALESCE(EXCLUDED.horas_trabalhadas, daily_records.horas_trabalhadas),
       gasto_combustivel = EXCLUDED.gasto_combustivel,
       gasto_outros = EXCLUDED.gasto_outros
     RETURNING *`,
    [
      userId,
      data,
      body.faturamento_bruto,
      body.km_rodado ?? null,
      body.horas_trabalhadas ?? null,
      body.gasto_combustivel ?? 0,
      body.gasto_outros ?? 0,
      origem,
    ]
  );

  return NextResponse.json({ record: rows[0] }, { status: 201 });
}
