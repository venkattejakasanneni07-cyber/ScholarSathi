import React, { useState } from 'react';
import { useApp } from '../../store/context';
import { t } from '../i18n';
import {
  GraduationCap,
  Globe,
  RotateCcw,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  History,
  Info,
  Clock,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const Header: React.FC = () => {
  const {
    state,
    isOnline,
    currentProfile,
    setCurrentProfileId,
    setLanguage,
    resetDemoData,
  } = useApp();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Filter profiles based on showTestProfiles flag
  const visibleProfiles = state.profiles.filter(
    (p) => state.showTestProfiles || ['P1', 'P2', 'P3'].includes(p.id)
  );

  return (
    <header className="bg-[#14213D] text-[#FBFAF6] sticky top-0 z-30 shadow-md">
      {/* Top compact utility bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-white/10 text-xs">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#12706F] flex items-center justify-center text-white shadow-inner font-black text-sm">
              SS
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">
                  ScholarSathi
                </span>
                <span className="bg-[#2A9D8F]/20 text-[#2A9D8F] border border-[#2A9D8F]/40 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider">
                  NSP Prototype
                </span>
              </div>
              <p className="text-[10px] text-gray-300 leading-none mt-0.5">
                Independent Scholarship Decision Assistant
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-white/20 text-gray-300 text-[11px]">
            <span>{t(state.language, 'demoYear')}</span>
            <span className="text-gray-500">•</span>
            <span className="text-teal-300 font-mono">Date: {state.todayStr}</span>
          </div>
        </div>

        {/* Right: Selectors & Status */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Active Profile Selector */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white transition-all border border-white/15"
              aria-label="Select student profile"
            >
              <GraduationCap size={14} className="text-[#2A9D8F]" />
              <span className="font-semibold max-w-[110px] sm:max-w-[160px] truncate">
                {currentProfile.label}
              </span>
              <ChevronDown size={12} className="text-gray-400" />
            </button>

            {profileDropdownOpen && (
              <div
                className="absolute right-0 mt-1 w-56 bg-[#FBFAF6] text-[#14213D] rounded-xl shadow-xl border border-[#DDD8CB] py-1 z-50 text-xs"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 font-bold text-[10px] text-[#718096] uppercase tracking-wider border-b border-[#DDD8CB]/50">
                  Select Demo Student
                </div>
                {visibleProfiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setCurrentProfileId(p.id)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#F6F3EC] transition-all ${
                      p.id === currentProfile.id ? 'bg-[#E6F4F1] font-bold text-[#12706F]' : ''
                    }`}
                  >
                    <span>{p.label}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{p.district}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white transition-all border border-white/15"
              aria-label="Language switcher"
            >
              <Globe size={13} className="text-teal-300" />
              <span className="uppercase font-bold">{state.language}</span>
              <ChevronDown size={11} className="text-gray-400" />
            </button>

            {langDropdownOpen && (
              <div
                className="absolute right-0 mt-1 w-32 bg-[#FBFAF6] text-[#14213D] rounded-xl shadow-xl border border-[#DDD8CB] py-1 z-50 text-xs"
                onClick={() => setLangDropdownOpen(false)}
              >
                <button
                  onClick={() => setLanguage('en')}
                  className={`w-full text-left px-3 py-1.5 hover:bg-[#F6F3EC] ${
                    state.language === 'en' ? 'font-bold text-[#12706F] bg-[#E6F4F1]' : ''
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('hi')}
                  className={`w-full text-left px-3 py-1.5 hover:bg-[#F6F3EC] ${
                    state.language === 'hi' ? 'font-bold text-[#12706F] bg-[#E6F4F1]' : ''
                  }`}
                >
                  हिन्दी (Hindi)
                </button>
                <button
                  onClick={() => setLanguage('te')}
                  className={`w-full text-left px-3 py-1.5 hover:bg-[#F6F3EC] ${
                    state.language === 'te' ? 'font-bold text-[#12706F] bg-[#E6F4F1]' : ''
                  }`}
                >
                  తెలుగు (Telugu)
                </button>
              </div>
            )}
          </div>

          {/* Network Connection Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              isOnline
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
            }`}
          >
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Storage Save State */}
          <div className="hidden md:flex items-center text-[11px] text-gray-300">
            {state.saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 size={12} />
                <span>Saved locally</span>
              </span>
            )}
            {state.saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-teal-300 animate-pulse">
                <Clock size={12} />
                <span>Saving...</span>
              </span>
            )}
            {state.saveStatus === 'offline' && (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle size={12} />
                <span>Paused (offline)</span>
              </span>
            )}
          </div>

          {/* Reset Demo */}
          <button
            onClick={() => {
              if (confirm('Reset demo state to initial defaults?')) {
                resetDemoData();
              }
            }}
            title="Reset Demo Data"
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Mandatory Permanent Synthetic Banner (Hard Rule 1) */}
      <div className="bg-[#F2B84B] text-[#5C3600] px-4 py-1.5 text-center text-xs font-black tracking-wide flex items-center justify-center gap-2 border-b border-[#9A5A00]/20 shadow-inner">
        <AlertTriangle size={14} className="stroke-[2.5]" />
        <span>SYNTHETIC DEMO DATA. Not real schemes.</span>
        <span className="hidden sm:inline font-normal text-[11px] text-[#5C3600]/80">
          • Decision planning assistant inspired by NSP information architecture
        </span>
      </div>
    </header>
  );
};
