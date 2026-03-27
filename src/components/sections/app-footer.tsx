import React from "react";

export default function AppFooter() {
  return (
    <footer className="px-4 py-3 mt-auto">
      <div className="flex flex-col md:flex-row items-center justify-between border-t border-border pt-3">
        <p className="text-muted-foreground text-[13px]">
          © 2026 <span className="text-[#F07000] font-semibold">Deem I.T Consult</span>. All Rights Reserved.
        </p>
        <ul className="flex items-center gap-4 list-none p-0">
          <li><a href="#" className="text-[13px] text-foreground/80 hover:text-[#F07000]">Support</a></li>
          <li><a href="#" className="text-[13px] text-foreground/80 hover:text-[#F07000]">Docs</a></li>
          <li><a href="#" className="text-[13px] text-foreground/80 hover:text-[#F07000]">Contact Us</a></li>
        </ul>
      </div>
    </footer>
  );
}
