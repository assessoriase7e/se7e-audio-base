import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pick Date AI",
  description: "Sistema de agendamento via agentes de IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ClerkProvider localization={ptBR}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Toaster duration={3000} position="top-center" />
            {children}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
