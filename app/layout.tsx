import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({
  variable: "--font-mono-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Rodei — controle de faturamento pro motorista de app",
  description:
    "Registre seu faturamento e km rodado pelo WhatsApp e acompanhe seu ganho real por semana, mês e ano.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${mono.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-bg-base text-text-primary">
        {children}
      </body>
    </html>
  );
}
