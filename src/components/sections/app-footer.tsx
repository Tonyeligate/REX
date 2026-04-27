import React from "react";

export default function AppFooter() {
  return (
    <footer className="px-4 py-3 mt-auto app-content-wrap">
      <div className="app-topbar-shell rounded-xl px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-2">
        <p className="text-muted-foreground text-[13px]">
          © 2026 <span className="text-[#F07000] font-semibold">Deem I.T Consult</span>. All Rights Reserved.
        </p>
        <ul className="flex items-center gap-4 list-none p-0">
          <li><a href="#" className="text-[13px] text-foreground/80 hover:text-[#F07000] font-semibold">Support</a></li>
          <li><a href="#" className="text-[13px] text-foreground/80 hover:text-[#F07000] font-semibold">Docs</a></li>
          <li><a href="#" className="text-[13px] text-foreground/80 hover:text-[#F07000] font-semibold">Contact Us</a></li>
        </ul>
      </div>
    </footer>
  );
}
