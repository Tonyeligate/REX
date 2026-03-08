"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, Settings, Moon, Sun, Languages } from "lucide-react";
import { cn } from "@/lib/utils";

const ThemeSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRTL, setIsRTL] = useState(false);
  const [selectedFont, setSelectedFont] = useState("Nunito");

  const fonts = [
    {
      id: "nunito",
      name: "Nunito",
      img: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cd6b25ef-7ef1-4ba0-bd1a-7b7365af46fa-wrraptheme-com/assets/svgs/font-nunito-18.svg",
    },
    {
      id: "opensans",
      name: "Open Sans",
      img: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cd6b25ef-7ef1-4ba0-bd1a-7b7365af46fa-wrraptheme-com/assets/svgs/font-opensans-16.svg",
    },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Settings Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed right-0 top-[20%] z-50 flex h-10 w-10 items-center justify-center rounded-l-md bg-primary text-white shadow-lg transition-all hover:bg-primary/90"
        aria-label="Toggle Theme Settings"
      >
        <Settings className="h-5 w-5 animate-spin-slow" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Off-canvas Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-[70] h-full w-[300px] bg-white shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 p-4">
            <h5 className="m-0 text-lg font-bold text-gray-800">Theme Setting</h5>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {/* Version Toggles */}
            <div className="mb-8 border-b border-gray-100 pb-6">
              <h6 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                More Setting
              </h6>
              <div className="space-y-4">
                {/* Dark Mode Toggle */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Dark Version</span>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={isDarkMode}
                        onChange={() => setIsDarkMode(!isDarkMode)}
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white focus:outline-none"></div>
                    </label>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <Image
                      src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cd6b25ef-7ef1-4ba0-bd1a-7b7365af46fa-wrraptheme-com/assets/svgs/dark-version-12.svg"
                      alt="Dark Mode Preview"
                      width={260}
                      height={140}
                      className="rounded border border-gray-200 shadow-sm"
                    />
                  </div>
                </div>

                {/* RTL Toggle */}
                <div className="flex flex-col gap-3 mt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">RTL Version</span>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={isRTL}
                        onChange={() => setIsRTL(!isRTL)}
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white focus:outline-none"></div>
                    </label>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <Image
                      src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cd6b25ef-7ef1-4ba0-bd1a-7b7365af46fa-wrraptheme-com/assets/svgs/rtl-version-15.svg"
                      alt="RTL Version Preview"
                      width={260}
                      height={140}
                      className="rounded border border-gray-200 shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Font Settings */}
            <div>
              <h6 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Dynamic Font Settings
              </h6>
              <div className="grid grid-cols-2 gap-3">
                {fonts.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => setSelectedFont(font.name)}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-all hover:border-primary/50",
                      selectedFont === font.name
                        ? "border-primary bg-primary/5"
                        : "border-gray-100 bg-white"
                    )}
                  >
                    <div className="mb-2 h-12 w-full">
                      <Image
                        src={font.img}
                        alt={font.name}
                        width={80}
                        height={40}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-600">{font.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4">
            <button className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-primary/90">
              Buy Now
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccced1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8abb1;
        }
      `}</style>
    </>
  );
};

export default ThemeSettings;