import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { StudyProvider } from "@/lib/study/provider";
import "./globals.css";

/**
 * Fraunces para títulos: um serif com eixo óptico (`opsz`), que engrossa as
 * hastes em tamanhos grandes e afina nos pequenos — é o que dá o ar de livro
 * de teoria. Inter para a interface, onde clareza importa mais que caráter.
 */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Caderno Musical",
    template: "%s · Caderno Musical",
  },
  description:
    "Caderno digital de teoria musical: leitura de notas, escalas maiores, tom e semitom, com correção explicada e revisão dos próprios erros.",
  applicationName: "Caderno Musical",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#16130f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <StudyProvider>
          <AppShell>{children}</AppShell>
        </StudyProvider>
      </body>
    </html>
  );
}
