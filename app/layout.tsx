import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EmagreSer v2",
  description:
    "Plataforma SaaS de lançamentos, automação e área do aluno gamificada.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
