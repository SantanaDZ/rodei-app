import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// POST /api/webhook/mercadopago
// Configure esta URL no painel do Mercado Pago (Notificações > Webhooks).
// Doc de referência: https://www.mercadopago.com.br/developers/pt/docs/subscriptions/additional-content/your-integrations/notifications
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ ok: true });
  }

  if (body.type === "subscription_preapproval" && body.data?.id) {
    await handleSubscriptionUpdate(body.data.id);
  }

  return NextResponse.json({ ok: true });
}

async function handleSubscriptionUpdate(mpSubscriptionId: string) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return;

  const res = await fetch(
    `https://api.mercadopago.com/preapproval/${mpSubscriptionId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) return;

  const sub = await res.json();
  const status: string = sub.status; // authorized | paused | cancelled | pending
  const proximaCobranca: string | null = sub.next_payment_date ?? null;

  const { rows } = await pool.query(
    `UPDATE subscriptions
     SET status = $1, proxima_cobranca = $2, updated_at = now()
     WHERE mp_subscription_id = $3
     RETURNING user_id`,
    [status, proximaCobranca, mpSubscriptionId]
  );

  if (!rows.length) return;

  const userStatus = status === "authorized" ? "ativo" : "inadimplente";
  await pool.query(`UPDATE users SET status = $1 WHERE id = $2`, [
    userStatus,
    rows[0].user_id,
  ]);
}
