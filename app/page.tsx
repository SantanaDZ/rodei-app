import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="text-odometer font-display font-bold text-2xl tracking-[0.14em] mb-3">
        RODEI
      </div>
      <h1 className="text-2xl sm:text-3xl font-semibold max-w-md leading-snug">
        Quanto você ganhou de verdade hoje?
      </h1>
      <p className="text-text-muted text-sm mt-3 max-w-sm">
        Manda o faturamento e o km do dia pro WhatsApp do Rodei. A gente calcula
        seu ganho líquido e te mostra o relatório da semana, do mês e do ano.
      </p>
      <a
        href="https://wa.me/SEUNUMEROAQUI"
        className="mt-7 bg-odometer text-bg-base font-semibold text-sm px-6 py-3 rounded-full hover:brightness-110 transition"
      >
        Começar pelo WhatsApp
      </a>
      <p className="text-text-faint text-xs mt-10">
        Já tem cadastro? Acesse pelo link que o bot te mandou no WhatsApp.
      </p>
    </main>
  );
}
