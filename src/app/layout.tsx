import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Match Analyzer — RAG + LLM",
  description: "AI-powered job match analysis using RAG and LLaMA 3 via Groq",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
