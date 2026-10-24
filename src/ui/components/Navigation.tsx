import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../store/context';
import { t } from '../i18n';
import {
  User,
  CheckSquare,
  Sliders,
  CalendarDays,
  ShieldAlert,
  BarChart3,
  ExternalLink,
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { state } = useApp();
  const lang = state.language;

  const navItems = [
    { to: '/profile', label: t(lang, 'nav.profile'), icon: User },
    { to: '/eligibility', label: t(lang, 'nav.eligibility'), icon: CheckSquare },
    { to: '/planner', label: t(lang, 'nav.planner'), icon: Sliders },
    { to: '/timeline', label: t(lang, 'nav.timeline'), icon: CalendarDays },
    { to: '/checks', label: t(lang, 'nav.checks'), icon: ShieldAlert },
    { to: '/evaluation', label: t(lang, 'nav.evaluation'), icon: BarChart3 },
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#FBFAF6] border-r border-[#DDD8CB] min-h-[calc(100vh-80px)] p-4 justify-between">
        <div className="space-y-6">
          {/* Institutional Welcome Card */}
          <div className="bg-[#E6F4F1] border border-[#12706F]/20 rounded-xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#12706F] block">
              Planning Portal
            </span>
            <h4 className="text-sm font-bold text-[#14213D] mt-0.5">
              Decision Workspace
            </h4>
            <p className="text-xs text-[#4A5568] mt-1 leading-relaxed">
              Synthetically planning eligibility and paperwork feasibility this week.
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#12706F] text-white font-semibold shadow-sm'
                        : 'text-[#14213D] hover:bg-[#F6F3EC] hover:text-[#12706F]'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info note */}
        <div className="pt-4 border-t border-[#DDD8CB] text-[11px] text-[#718096] space-y-2">
          <div className="flex items-center justify-between">
            <span>Rules:</span>
            <span className="font-bold text-[#14213D] uppercase">{state.schemeVersion}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Hours budget:</span>
            <span className="font-bold text-[#14213D]">
              {state.profiles.find((p) => p.id === state.currentProfileId)?.freeHoursThisWeek || 0} h/wk
            </span>
          </div>
          <p className="text-[10px] text-[#718096] italic leading-tight pt-1">
            Independent demonstration prototype. No actual government portal ties.
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FBFAF6] border-t border-[#DDD8CB] z-30 flex items-center justify-around py-1.5 px-2 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-all ${
                  isActive
                    ? 'text-[#12706F] font-bold'
                    : 'text-[#4A5568] hover:text-[#14213D]'
                }`
              }
            >
              <Icon size={18} />
              <span className="mt-0.5 max-w-[50px] truncate text-center">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
