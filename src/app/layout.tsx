import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ThemeBootstrap from "@/components/theme/theme-bootstrap";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Recs Geomatics Consult — Job Certification & Approval System",
  description: "Recs Geomatics Consult Admin Portal — Job tracking, membership management, and SMS broadcast",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: ["/favicon.ico?v=2"],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeInitScript = `
    (function () {
      try {
        var key = "theme";
        var saved = localStorage.getItem(key);
        var preference = saved === "dark" || saved === "light" || saved === "system" ? saved : "system";
        var resolved = preference === "system"
          ? (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
          : preference;
        var root = document.documentElement;
        root.classList.toggle("dark", resolved === "dark");
        root.style.colorScheme = resolved;
      } catch (_error) {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${plusJakartaSans.variable} font-sans antialiased`}>
        <ThemeBootstrap />
        {children}
      </body>
    </html>
  );
}
