import { NextRequest, NextResponse } from "next/server";
import { getUserByPhone, isInternalCall } from "@/lib/auth";

// GET /api/users/lookup?telefone=5531999999999 — usado pelo n8n
export async function GET(req: NextRequest) {
  if (!isInternalCall(req)) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const telefone = req.nextUrl.searchParams.get("telefone");
  if (!telefone) {
    return NextResponse.json({ error: "telefone é obrigatório" }, { status: 422 });
  }

  const user = await getUserByPhone(telefone);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({ user }, { status: 200 });
}
