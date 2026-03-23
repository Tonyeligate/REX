import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen client-premium-bg text-[#0f172a] flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b border-[#F0E6DA] shadow-[0_2px_12px_rgba(240,112,0,0.06)]">
        <div className="w-[min(1100px,calc(100vw-32px))] mx-auto flex items-center justify-between py-3 px-1">
          <Link href="/client/dashboard" className="flex items-center gap-3">
            <Image
              src="/recs-logo-wide.jpeg"
              alt="Recs Geomatics Consult"
              width={200}
              height={48}
              style={{ width: "auto", height: "auto", maxHeight: "48px" }}
              className="object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-4 text-[13px]">
            <a
              href="mailto:info@recsgeo.com"
              className="text-[#64748b] hover:text-[#F07000] transition-colors hidden sm:inline"
            >
              info@recsgeo.com
            </a>
            <a
              href="tel:+233243671972"
              className="text-[#64748b] hover:text-[#F07000] transition-colors hidden sm:inline"
            >
              +233 243 671 972
            </a>

          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="bg-[#1a1a1a] text-[#a0a0a0] py-8 mt-auto">
        <div className="w-[min(1100px,calc(100vw-32px))] mx-auto px-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-[13px]">
            <div>
              <h4 className="text-white text-[14px] font-bold mb-2">RECS Geomatics Consult</h4>
              <p className="leading-relaxed">
                Professional services in Surveying, Mining, GIS, Environmental &amp; Construction Engineering.
              </p>
            </div>
            <div>
              <h4 className="text-white text-[14px] font-bold mb-2">Contact</h4>
              <p className="leading-relaxed">
                P.O. Box 3355, Osu, Accra<br />
                Kuku Hill Lane, Osu<br />
                <a href="tel:+233243671972" className="text-[#F07000] hover:underline">+233 243 671 972</a>
                {" / "}
                <a href="tel:+233244738529" className="text-[#F07000] hover:underline">+233 244 738 529</a>
              </p>
            </div>
            <div>
              <h4 className="text-white text-[14px] font-bold mb-2">Email</h4>
              <p className="leading-relaxed">
                <a href="mailto:info@recsgeo.com" className="text-[#F07000] hover:underline">info@recsgeo.com</a><br />
                <a href="mailto:ecudjoe@recsgeo.com" className="text-[#F07000] hover:underline">ecudjoe@recsgeo.com</a><br />
                <a href="https://www.recsgeo.com" target="_blank" rel="noopener noreferrer" className="text-[#F07000] hover:underline">www.recsgeo.com</a>
              </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-[#333] text-center text-[12px] text-[#666]">
            &copy; {new Date().getFullYear()} Deem I.T Consult. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
