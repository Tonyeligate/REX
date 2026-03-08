"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Maximize2,
  Languages,
  LayoutGrid,
  Moon,
  Settings,
  Bell,
  ChevronDown,
} from "lucide-react";

const Header = () => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header className="page-header sticky top-0 z-40 w-full header-blur border-b border-border px-xl-4 px-sm-2 px-0 py-lg-2 py-1">
      <div className="container-fluid flex items-center justify-between w-full px-4">
        <nav className="navbar flex items-center justify-between w-full">
          {/* start: toggle btn & brand */}
          <div className="flex items-center">
            <button className="btn btn-link hidden xl:block p-0 text-primary mr-2">
              <div className="flex flex-col gap-[3px] w-[22px] cursor-pointer">
                <span className="h-[2px] w-full bg-primary rounded-full"></span>
                <span className="h-[2px] w-[60%] bg-primary rounded-full"></span>
                <span className="h-[2px] w-full bg-primary rounded-full"></span>
              </div>
            </button>
            <button className="btn btn-link block xl:hidden p-0 text-primary mr-2">
              <div className="flex flex-col gap-[3px] w-[22px] cursor-pointer">
                <span className="h-[2px] w-full bg-primary rounded-full"></span>
                <span className="h-[2px] w-full bg-primary rounded-full"></span>
                <span className="h-[2px] w-full bg-primary rounded-full"></span>
              </div>
            </button>
            <Link href="/" className="brand-icon flex items-center mx-2 sm:mx-3 text-primary">
              <svg height="22" viewBox="0 0 85 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 0V22H0V0H10Z" fill="#9CA3AF" />
                <path d="M25 0V22H15V0H25Z" fill="#9CA3AF" />
                <path d="M40 0L49 22H31L40 0Z" fill="#F07000" />
                <path d="M64 0V22H54V0H64Z" fill="#9CA3AF" />
              </svg>
              <span className="ml-2 font-bold text-[20px] text-foreground hidden sm:inline">LUNO</span>
            </Link>
          </div>

          {/* start: search area */}
          <div className="header-left flex-grow hidden md:block max-w-[500px] mx-4">
            <div className="relative main-search flex-fill">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={16} className="text-muted-foreground" />
              </div>
              <input
                type="text"
                className="form-control w-full bg-white border border-border rounded-full py-2 pl-10 pr-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Enter your search key word"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              />
              
              {isSearchFocused && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-border rounded-[0.75rem] shadow-lg p-4 animate-in fade-in slide-in-from-top-2">
                  <small className="text-uppercase text-muted-foreground text-[10px] font-bold tracking-wider">RECENT SEARCHES</small>
                  <div className="flex flex-wrap gap-2 mt-2 mb-4">
                    <span className="text-[12px] rounded py-1 px-2 bg-primary text-white cursor-pointer hover:opacity-90">HRMS Admin</span>
                    <span className="text-[12px] rounded py-1 px-2 bg-slate-500 text-white cursor-pointer hover:opacity-90">Hospital Admin</span>
                    <span className="text-[12px] rounded py-1 px-2 bg-info bg-cyan-500 text-white cursor-pointer hover:opacity-90">Project</span>
                  </div>
                  <small className="text-uppercase text-muted-foreground text-[10px] font-bold tracking-wider">SUGGESTIONS</small>
                  <div className="mt-2 space-y-2">
                    <div className="p-2 hover:bg-muted rounded cursor-pointer transition-colors">
                      <div className="font-bold text-[13px]">Helper Class</div>
                      <div className="text-[11px] text-muted-foreground truncate">Commonly used utility classes for layout.</div>
                    </div>
                    <div className="p-2 hover:bg-muted rounded cursor-pointer transition-colors">
                      <div className="font-bold text-[13px]">Date Range Picker</div>
                      <div className="text-[11px] text-muted-foreground truncate">Choose ranges for reporting.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* start: right utility links */}
          <ul className="header-right flex items-center gap-1 sm:gap-3 mb-0 list-none">
            <li className="hidden xl:block">
              <button className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-primary transition-colors">
                <span>Notification</span>
                <Bell size={16} />
              </button>
            </li>
            
            <li className="xl:hidden">
              <button className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors relative">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-white"></span>
              </button>
            </li>

            <li className="hidden sm:block">
              <button className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                <Maximize2 size={18} />
              </button>
            </li>

            <li className="hidden sm:block">
              <button className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                <Languages size={18} />
              </button>
            </li>

            <li className="hidden sm:block">
              <button className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                <LayoutGrid size={18} />
              </button>
            </li>

            <li>
              <button className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                <Moon size={18} />
              </button>
            </li>

            {/* Profile Section */}
            <li className="ml-1 sm:ml-2">
              <div className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <Image
                    src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cd6b25ef-7ef1-4ba0-bd1a-7b7365af46fa-wrraptheme-com/assets/icons/profile_av-7.png"
                    alt="User"
                    width={32}
                    height={32}
                    className="rounded-full border border-border"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-white"></span>
                </div>
                <div className="hidden lg:flex flex-col leading-none">
                  <span className="text-[13px] font-bold text-foreground">Allie Grater</span>
                  <span className="text-[11px] text-muted-foreground">Admin Portal</span>
                </div>
                <ChevronDown size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </li>

            <li>
              <button className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                <Settings size={18} />
              </button>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Sub-Header: Income/Revenue Stats (Breadcrumb row) */}
      <div className="container-fluid px-4 py-2 mt-1 flex items-center justify-between border-t border-border/40 md:border-none">
        <div className="flex items-center text-[13px] text-muted-foreground">
          <span className="text-primary hover:underline cursor-pointer">Home</span>
          <span className="mx-2">/</span>
          <span className="font-semibold text-foreground">Modals</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-[13px] font-bold">
              8.18K <span className="text-success text-[11px]">+1.3%</span>
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Income</div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-[13px] font-bold">
              1.11K <span className="text-primary text-[11px]">^ 4.1%</span>
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Expense</div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-[13px] font-bold">
              3.66K <span className="text-destructive text-[11px]">v 7.5%</span>
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Revenue</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;