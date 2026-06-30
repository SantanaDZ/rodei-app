export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { pool } from "@/lib/db";
import { User, DailyRecord, liquido } from "@/lib/types";
import InstrumentCluster from "@/components/InstrumentCluster";
import PeriodDashboard from "@/components/PeriodDashboard";

async function getData(token: string) {
  const { rows: users } = await pool.query<User>(
    `SELECT * FROM users WHERE magic_token = $1`,
    [token]
  );
  const user = users[0];
  if (!user) return null;

  const { rows: records } = await pool.query<DailyRecord>(
    `SELECT * FROM daily_records WHERE user_id = $1 ORDER BY data DESC LIMIT 400`,
    [user.id]
  );

  return { user, records };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getData(token);

  if (!data) {
    return (
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-odometer font-display font-bold text-xl mb-2">RODEI</div>
          <p className="text-text-muted text-sm">
            Esse link não é válido ou expirou. Manda uma mensagem pro número do Rodei no
            WhatsApp pra gerar um novo.
          </p>
        </div>
      </main>
    );
  }

  const { user, records } = data;
  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = records.find((r) => r.data === today);

  return (
    <main className="flex-1 px-4 sm:px-8 py-8 max-w-3xl mx-auto w-full">
      <header className="flex items-center justify-between mb-8">
        <div>
          <div className="text-odometer font-display font-bold text-sm tracking-[0.14em]">
            RODEI
          </div>
          <div className="text-text-muted text-sm mt-0.5">
            {user.nome ? `E aí, ${user.nome.split(" ")[0]}` : "Seu painel"}
          </div>
        </div>
        <StatusBadge status={user.status} />
      </header>

      <InstrumentCluster
        faturamento={todayRecord ? Number(todayRecord.faturamento_bruto) : 0}
        km={todayRecord?.km_rodado ? Number(todayRecord.km_rodado) : null}
        liquido={todayRecord ? liquido(todayRecord) : 0}
      />

      <PeriodDashboard records={records} />

      <Link
        href={`/r/${token}/registrar`}
        className="fixed bottom-6 right-6 sm:right-8 bg-odometer text-bg-base font-semibold text-sm px-5 py-3 rounded-full shadow-lg shadow-black/40 hover:brightness-110 transition"
      >
        + Registrar hoje
      </Link>
    </main>
  );
}

function StatusBadge({ status }: { status: User["status"] }) {
  if (status === "inadimplente") {
    return (
      <span className="text-[11px] uppercase tracking-wide px-2 py-1 rounded-full bg-alert/15 text-alert">
        Pagamento pendente
      </span>
    );
  }
  if (status === "onboarding") {
    return (
      <span className="text-[11px] uppercase tracking-wide px-2 py-1 rounded-full bg-text-faint/15 text-text-muted">
        Cadastro incompleto
      </span>
    );
  }
  return null;
}
