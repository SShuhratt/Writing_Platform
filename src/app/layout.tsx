import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IELTS Writing Assistant Platform | Adaptive Real-Time AI Mentor",
  description: "Adaptive real-time writing environment for IELTS Task 1 and Task 2. Socratic mentorship grounded strictly in target band scores (5.0–9.0).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col">
        {children}
      </body>
    </html>
  );
}
