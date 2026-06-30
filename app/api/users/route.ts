import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { isInternalCall, getUserByPhone } from "@/lib/auth";
import { User } from "@/lib/types";

// POST /api/users — cria o motorista no onboarding (chamado pelo n8n)
// body: { telefone, nome?, veiculo?, placa? }
export async function POST(req: NextRequest) {
  if (!isInternalCall(req)) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.telefone) {
    return NextResponse.json({ error: "telefone é obrigatório" }, { status: 422 });
  }

  const existing = await getUserByPhone(body.telefone);
  if (existing) {
    return NextResponse.json({ user: existing }, { status: 200 });
  }

  const { rows } = await pool.query<User>(
    `INSERT INTO users (telefone, nome, veiculo, placa, status)
     VALUES ($1, $2, $3, $4, 'ativo')
     RETURNING *`,
    [body.telefone, body.nome ?? null, body.veiculo ?? null, body.placa ?? null]
  );

  return NextResponse.json({ user: rows[0] }, { status: 201 });
}
