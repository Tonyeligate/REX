import type { Metadata } from "next";
import "./globals.css";

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
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
