import React from 'react';
import { ChevronRight, MoreHorizontal, Plus, Home, Grid, AppWindow, FileText, User, Lock, Layers, Layout, Maximize, Settings, FileCode, History, Calendar, StickyNote, MessageSquare, Power } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-[#F4F7F6] border-r border-[#E5E7EB] z-[9] flex flex-col p-2 py-4">
      <div className="px-3">
        {/* Sidebar Header: Branding */}
        <div className="flex items-center justify-between mb-6 mt-1 overflow-hidden">
          <h4 className="text-[24px] font-bold text-[#1F2937] leading-tight flex items-center">
            <span className="text-[#F07000]">L</span>
            <span className="ml-1">UNO Admin</span>
          </h4>
          <button className="w-[25.5px] h-[25.5px] inline-flex items-center justify-center bg-[#0d6efd1a] text-[#F07000] rounded-full hover:bg-[#F07000] hover:text-white transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Project Selector */}
        <div className="py-3 mb-4">
          <div className="flex items-center gap-1">
            <div className="relative flex-grow">
              <select className="w-full h-[38px] appearance-none bg-white border border-[#E5E7EB] rounded-full px-4 text-[14px] text-[#4B5563] focus:outline-none focus:ring-1 focus:ring-[#F07000]">
                <option>Select Project</option>
                <option>Luno University</option>
                <option>Book Manager</option>
                <option>Luno Sass App</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <button className="flex-shrink-0 w-[40px] h-[40px] bg-[#F07000] text-white rounded-full flex items-center justify-center hover:bg-[#D06000] transition-colors shadow-sm">
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Menu Scroll Area */}
      <div className="flex-grow overflow-y-auto px-1 custom-scrollbar">
        {/* MAIN CATEGORY */}
        <div className="mb-4">
          <div className="px-3 py-2 leading-tight">
            <span className="text-[12px] font-bold text-[#4B5563] uppercase tracking-wider">Main</span>
            <div className="text-[11px] text-[#9CA3AF]">Unique dashboard designs</div>
          </div>
          <nav className="space-y-1 mt-2">
            <MenuItem icon={<Home size={18} />} label="My Dashboard" hasArrow />
            <MenuItem icon={<Grid size={18} />} label="Unique Dashboard" hasArrow />
            <MenuItem icon={<AppWindow size={18} />} label="Applications" hasArrow />
            <MenuItem icon={<FileText size={18} />} label="Crafted Pages" hasArrow />
            <MenuItem icon={<User size={18} />} label="Account" hasArrow />
            <MenuItem icon={<Lock size={18} />} label="Authentication" hasArrow />
            <MenuItem icon={<Layers size={18} />} label="Menu Level 0" hasArrow />
          </nav>
        </div>

        {/* RESOURCES CATEGORY */}
        <div className="mb-4">
          <div className="px-3 py-2 leading-tight">
            <span className="text-[12px] font-bold text-[#4B5563] uppercase tracking-wider">Resources</span>
            <div className="text-[11px] text-[#9CA3AF]">you need to know about LUNO</div>
          </div>
          <nav className="space-y-1 mt-2">
            <MenuItem icon={<Layout size={18} />} label="Layouts" />
            <MenuItem 
              icon={<Maximize size={18} />} 
              label="Modals Popups" 
              active 
            />
            <MenuItem icon={<Settings size={18} />} label="Widget's" />
            <MenuItem icon={<FileCode size={18} />} label="Documentation" />
            <MenuItem 
              icon={<History size={18} />} 
              label="Changelog" 
              badge="v1.2.7"
            />
          </nav>
        </div>
      </div>

      {/* Sidebar Footer Links */}
      <div className="mt-auto border-t border-[#E5E7EB] pt-2">
        <ul className="flex items-center justify-around w-full py-2">
          <li className="flex-1 text-center">
            <a href="#" className="inline-block p-2 text-[#9CA3AF] hover:text-[#F07000] transition-colors">
              <Calendar size={18} />
            </a>
          </li>
          <li className="flex-1 text-center">
            <a href="#" className="inline-block p-2 text-[#9CA3AF] hover:text-[#F07000] transition-colors">
              <StickyNote size={18} />
            </a>
          </li>
          <li className="flex-1 text-center">
            <a href="#" className="inline-block p-2 text-[#9CA3AF] hover:text-[#F07000] transition-colors">
              <MessageSquare size={18} />
            </a>
          </li>
          <li className="flex-1 text-center">
            <a href="#" className="inline-block p-2 text-[#9CA3AF] hover:text-[#F07000] transition-colors">
              <Power size={18} />
            </a>
          </li>
        </ul>
      </div>
    </aside>
  );
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  hasArrow?: boolean;
  active?: boolean;
  badge?: string;
}

const MenuItem = ({ icon, label, hasArrow, active, badge }: MenuItemProps) => {
  return (
    <a
      href="#"
      className={`group flex items-center px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
        active 
          ? 'bg-[#F07000] text-white' 
          : 'text-[#4B5563] hover:bg-[#F8F9FA] hover:text-[#F07000]'
      }`}
    >
      <span className={`${active ? 'text-white' : 'text-[#4B5563] group-hover:text-[#F07000]'}`}>
        {icon}
      </span>
      <span className="ml-3 truncate">{label}</span>
      {badge && (
        <span className="ml-auto text-[10px] bg-[#F07000] text-white px-1.5 py-0.5 rounded font-bold">
          {badge}
        </span>
      )}
      {hasArrow && (
        <ChevronRight 
          size={14} 
          className={`ml-auto ${active ? 'text-white' : 'text-[#9CA3AF] group-hover:text-[#F07000]'} transition-transform`} 
        />
      )}
    </a>
  );
};

export default Sidebar;
