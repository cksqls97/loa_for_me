import type { Metadata } from "next";
import React from 'react';
import { ThemeProvider } from "../contexts/ThemeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "재료 제작 및 저장 계산기",
  description: "로스트아크 재료 계산 및 저장 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className="antialiased min-h-screen flex items-center justify-center p-4 bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-500"
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
