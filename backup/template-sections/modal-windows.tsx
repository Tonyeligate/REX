"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, Check, Search, Upload, Plus, ChevronRight, MapPin, Wind, Droplets } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

export default function ModalWindows() {
  const [openSetup, setOpenSetup] = useState(false);
  const [openUpgrade, setOpenUpgrade] = useState(false);
  const [openWeather, setOpenWeather] = useState(false);

  return (
    <div className="p-4 md:p-6 bg-[#f4f7f6] min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Setup New Project Trigger Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center border border-gray-100">
          <div className="mb-4 h-40 flex items-center justify-center">
            <img src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cd6b25ef-7ef1-4ba0-bd1a-7b7365af46fa-wrraptheme-com/assets/images/in-13.svg" alt="Project Setup" className="max-h-full" />
          </div>
          <h5 className="text-lg font-bold text-[#1f2937] mb-1">Setup new project</h5>
          <p className="text-muted-foreground text-sm mb-4">Click on the below buttons to launch a Setup new project example.</p>
          <button 
            onClick={() => setOpenSetup(true)}
            className="bg-[#F07000] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#D06000] transition-colors uppercase tracking-wider"
          >
            Launch Setup Modal
          </button>
        </div>

        {/* Upgrade Plan Trigger Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center border border-gray-100">
          <div className="mb-4 h-40 flex items-center justify-center text-[#F07000]">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <h5 className="text-lg font-bold text-[#1f2937] mb-1">Upgrade your plan</h5>
          <p className="text-muted-foreground text-sm mb-4">Click on the below buttons to launch a Upgrade plan example.</p>
          <button 
            onClick={() => setOpenUpgrade(true)}
            className="bg-[#F07000] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#D06000] transition-colors uppercase tracking-wider"
          >
            View Plans
          </button>
        </div>

        {/* Weather Report Trigger Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center border border-gray-100">
          <div className="mb-4 h-40 flex items-center justify-center text-orange-400">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </div>
          <h5 className="text-lg font-bold text-[#1f2937] mb-1">Weather Report</h5>
          <p className="text-muted-foreground text-sm mb-4">Click on the below buttons to launch a Weather Report example.</p>
          <button 
            onClick={() => setOpenWeather(true)}
            className="bg-[#F07000] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#D06000] transition-colors uppercase tracking-wider"
          >
            Check Weather
          </button>
        </div>
      </div>

      <SetupProjectModal open={openSetup} onOpenChange={setOpenSetup} />
      <UpgradePlanModal open={openUpgrade} onOpenChange={setOpenUpgrade} />
      <WeatherReportModal open={openWeather} onOpenChange={setOpenWeather} />
    </div>
  );
}

function SetupProjectModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState(1);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[1050] animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-[1060] w-[95%] max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="flex border-b border-gray-100">
            {[1, 2, 3, 4].map((s) => (
              <div 
                key={s} 
                className={`flex-1 py-4 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${step === s ? 'border-[#F07000] text-[#F07000]' : 'border-transparent text-gray-400'}`}
              >
                Step {s}
              </div>
            ))}
            <Dialog.Close className="p-4 hover:text-red-500 transition-colors">
              <X size={20} />
            </Dialog.Close>
          </div>

          <div className="p-6 md:p-8 min-h-[400px]">
            {step === 1 && (
              <div className="animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold mb-2">Project Type</h3>
                <p className="text-sm text-muted-foreground mb-6">If you need more info, please check out FAQ Page</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="border-2 border-[#F07000] p-4 rounded-xl cursor-pointer bg-orange-50/30 flex items-start gap-3">
                    <input type="radio" name="projectType" defaultChecked className="mt-1 accent-[#F07000]" />
                    <div>
                      <div className="font-bold">Personal Account</div>
                      <div className="text-xs text-muted-foreground">For small projects or individual developers</div>
                    </div>
                  </label>
                  <label className="border-2 border-gray-100 p-4 rounded-xl cursor-pointer hover:border-gray-200 flex items-start gap-3">
                    <input type="radio" name="projectType" className="mt-1 accent-[#F07000]" />
                    <div>
                      <div className="font-bold">Team Account</div>
                      <div className="text-xs text-muted-foreground">For corporate projects and larger teams</div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold mb-2">Project Details</h3>
                <p className="text-sm text-muted-foreground mb-6">It is a long established fact that a reader will be distracted by Luno.</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Project Name</label>
                    <input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#F07000]/20" placeholder="Enter project name" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Description</label>
                    <textarea className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#F07000]/20 min-h-[100px]" placeholder="Brief project overview"></textarea>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold mb-2">Build a Team</h3>
                <p className="text-sm text-muted-foreground mb-6">If you need more info, please check out Project Guidelines</p>
                <div className="flex gap-2 mb-6">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="text" className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Search by name or email" />
                  </div>
                  <button className="bg-[#F07000] text-white px-4 py-2 rounded-lg text-sm font-bold">Add</button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cd6b25ef-7ef1-4ba0-bd1a-7b7365af46fa-wrraptheme-com/assets/icons/avatar2-8.jpg" className="w-10 h-10 rounded-full" alt="" />
                      <div>
                        <div className="font-bold text-sm">Orlando Lentz</div>
                        <div className="text-xs text-muted-foreground">orlandolentz@example.com</div>
                      </div>
                    </div>
                    <span className="text-xs bg-orange-100 text-[#F07000] px-2 py-1 rounded font-bold">Admin</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cd6b25ef-7ef1-4ba0-bd1a-7b7365af46fa-wrraptheme-com/assets/icons/avatar7-6.jpg" className="w-10 h-10 rounded-full" alt="" />
                      <div>
                        <div className="font-bold text-sm">Rose Bush</div>
                        <div className="text-xs text-muted-foreground">rosebush@example.com</div>
                      </div>
                    </div>
                    <button className="text-xs text-red-500 font-bold hover:underline">Remove</button>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold mb-2">Upload Files</h3>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center flex flex-col items-center gap-2 mb-6 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="bg-orange-50 text-[#F07000] p-4 rounded-full mb-2">
                    <Upload size={32} />
                  </div>
                  <p className="font-bold">Drop files here or click to upload</p>
                  <p className="text-xs text-muted-foreground">Support PDF, JPG, PNG, DOCX (Max 25MB)</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-50 text-red-500 p-2 rounded">PDF</div>
                      <span className="text-sm font-medium">Annual Sales Report 2018-19.pdf</span>
                    </div>
                    <span className="text-xs text-muted-foreground">1.2 MB</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50 flex justify-between">
            <button 
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-opacity ${step === 1 ? 'opacity-0' : 'text-gray-500 hover:bg-gray-200'}`}
            >
              Previous
            </button>
            <button 
              onClick={() => step < 4 ? setStep(step + 1) : onOpenChange(false)}
              className="bg-[#F07000] text-white px-8 py-2 rounded-lg font-bold text-sm hover:bg-[#D06000] transition-colors"
            >
              {step === 4 ? 'Finish' : 'Next Step'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function UpgradePlanModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[1050] animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-[1060] w-[95%] max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 md:p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-[#1f2937]">Upgrade your plan</h3>
                <p className="text-sm text-muted-foreground">Please make the payment to start enjoying all the features of our premium plan.</p>
              </div>
              <Dialog.Close className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </Dialog.Close>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="border border-gray-200 rounded-xl p-4 relative hover:border-[#F07000] transition-colors cursor-pointer group">
                <div className="bg-orange-50 text-[#F07000] w-10 h-10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#F07000] group-hover:text-white transition-colors">
                  <Check size={20} />
                </div>
                <div className="font-bold text-lg mb-1">Standard Plan</div>
                <div className="text-2xl font-black text-[#1f2937] mb-4">$49<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#F07000]" /> Up to 10 Projects</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#F07000]" /> 5GB Storage</li>
                  <li className="flex items-center gap-2 text-gray-300 line-through">Custom Domains</li>
                </ul>
              </div>
              <div className="border-2 border-[#F07000] rounded-xl p-4 relative bg-orange-50/20">
                <div className="absolute -top-3 right-4 bg-[#F07000] text-white text-[10px] uppercase font-black px-3 py-1 rounded-full">Recommended</div>
                <div className="bg-[#F07000] text-white w-10 h-10 rounded-full flex items-center justify-center mb-4">
                  <Check size={20} />
                </div>
                <div className="font-bold text-lg mb-1">Business Plan</div>
                <div className="text-2xl font-black text-[#1f2937] mb-4">$99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#F07000]" /> Unlimited Projects</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#F07000]" /> 100GB Storage</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[#F07000]" /> Custom Domains</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h6 className="text-xs font-bold uppercase text-gray-500 mb-4">Payment details</h6>
              <div className="flex gap-4 items-center">
                <div className="bg-white border border-[#F07000] rounded-lg p-3 flex-1 flex items-center gap-3">
                  <img src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cd6b25ef-7ef1-4ba0-bd1a-7b7365af46fa-wrraptheme-com/assets/icons/visa-card-12.png" className="h-6" alt="Visa" />
                  <div className="flex-grow">
                    <div className="text-xs font-bold">Visa Ending in 4242</div>
                    <div className="text-[10px] text-muted-foreground">Expires 12/26</div>
                  </div>
                  <Check size={16} className="text-green-500" />
                </div>
                <button className="text-[#F07000] text-xs font-bold hover:underline">Edit</button>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 border-t border-gray-100 flex justify-end gap-3">
            <button className="px-6 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg" onClick={() => onOpenChange(false)}>Cancel</button>
            <button className="bg-[#F07000] text-white px-8 py-2 rounded-lg font-bold text-sm hover:bg-[#D06000] transition-colors shadow-lg shadow-orange-200">Confirm Payment</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function WeatherReportModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[1050] animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F07000] text-white rounded-2xl shadow-2xl z-[1060] w-[350px] overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-8 relative">
            <Dialog.Close className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X size={18} />
            </Dialog.Close>

            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={16} />
                <span className="text-xl font-bold">Delhi, IN</span>
              </div>
              <p className="text-xs opacity-80 mb-8 uppercase tracking-widest">December 04 2021</p>

              <div className="mb-8">
                <div className="relative">
                  <span className="text-8xl font-black">39</span>
                  <span className="absolute -top-2 -right-6 text-4xl font-light">°</span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl w-full p-4 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Droplets size={20} />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] opacity-70 uppercase font-bold">Humidity</div>
                    <div className="font-bold">24%</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Wind size={20} />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] opacity-70 uppercase font-bold">Wind</div>
                    <div className="font-bold">12 km/h</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black uppercase text-[#1f2937]/50 tracking-wider">Forecast</span>
              <button className="text-[10px] font-black uppercase text-[#F07000] hover:underline">View All</button>
            </div>
            <div className="flex justify-between">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                <div key={day} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{day}</span>
                  <div className={`p-1 rounded ${i === 2 ? 'text-[#F07000]' : 'text-orange-400'}`}>
                    {i === 2 ? <Droplets size={14} /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />}
                  </div>
                  <span className="text-xs font-black text-[#1f2937]">{32 + i}°</span>
                </div>
              ))}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
