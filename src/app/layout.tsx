import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IELTS Writing Assistant Platform | Adaptive Real-Time AI Mentor",
  description: "Adaptive real-time writing environment for IELTS Task 1 and Task 2. Socratic mentorship grounded strictly in target band scores (5.0–9.0).",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/brand-logo.png', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('ielts_theme');
                if (savedTheme === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-background text-foreground flex flex-col">
        {children}
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </body>
    </html>
  );
}
