import React, { useState } from 'react';
import { useApp } from '../../store/context';
import {
  Wrench,
  Wifi,
  WifiOff,
  UserCheck,
  RefreshCw,
  Database,
  Calendar,
  X,
  FileCheck,
} from 'lucide-react';

export const DeveloperDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    state,
    isOnline,
    setSimulatedOffline,
    setShowTestProfiles,
    setTodayStr,
    resetDemoData,
    applySchemesV2,
    revertSchemesV1,
  } = useApp();

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 z-40 bg-[#14213D] text-[#FBFAF6] px-3.5 py-2 rounded-full shadow-lg border border-[#DDD8CB] flex items-center gap-2 hover:bg-[#12706F] transition-all text-xs font-semibold"
        aria-label="Open Developer & Judge Controls"
      >
        <Wrench size={14} />
        <span>Dev & Judge Controls</span>
        {state.simulatedOffline && (
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        )}
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-sm bg-[#FBFAF6] h-full shadow-2xl border-l border-[#DDD8CB] p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#DDD8CB]">
                <div className="flex items-center gap-2 text-[#14213D]">
                  <Wrench size={18} className="text-[#12706F]" />
                  <h3 className="font-bold text-base">Developer & Judge Controls</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-[#F6F3EC] rounded-lg text-gray-500 hover:text-black"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Offline Connection Simulation */}
              <div className="space-y-3 bg-[#F6F3EC] p-4 rounded-xl border border-[#DDD8CB]">
                <label className="text-xs font-bold text-[#14213D] uppercase tracking-wider block">
                  Network Simulation
                </label>
                <div className="flex items-center justify-between text-xs text-[#4A5568]">
                  <span>Status:</span>
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      isOnline ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                    {isOnline ? 'Online' : 'Offline (Simulated)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setSimulatedOffline(true)}
                    disabled={state.simulatedOffline}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all ${
                      state.simulatedOffline
                        ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                        : 'bg-white border-[#DDD8CB] hover:bg-gray-50 text-[#14213D]'
                    }`}
                  >
                    Drop Connection
                  </button>
                  <button
                    onClick={() => setSimulatedOffline(false)}
                    disabled={!state.simulatedOffline}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all ${
                      !state.simulatedOffline
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
                        : 'bg-white border-[#DDD8CB] hover:bg-gray-50 text-[#14213D]'
                    }`}
                  >
                    Reconnect
                  </button>
                </div>
                <p className="text-[11px] text-[#718096] italic">
                  Simulates flaky network for testing drafts, queueing, and idempotent submissions.
                </p>
              </div>

              {/* Scheme Version Controls */}
              <div className="space-y-3 bg-[#F6F3EC] p-4 rounded-xl border border-[#DDD8CB]">
                <label className="text-xs font-bold text-[#14213D] uppercase tracking-wider block">
                  Synthetic Scheme Rules Version
                </label>
                <div className="flex items-center justify-between text-xs text-[#4A5568]">
                  <span>Active Rules:</span>
                  <span className="font-bold text-[#14213D] uppercase">
                    {state.schemeVersion}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={revertSchemesV1}
                    disabled={state.schemeVersion === 'v1'}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border text-center ${
                      state.schemeVersion === 'v1'
                        ? 'bg-blue-100 border-blue-400 font-bold text-blue-900'
                        : 'bg-white border-[#DDD8CB] hover:bg-gray-50 text-[#14213D]'
                    }`}
                  >
                    Rules v1 (Base)
                  </button>
                  <button
                    onClick={applySchemesV2}
                    disabled={state.schemeVersion === 'v2'}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border text-center ${
                      state.schemeVersion === 'v2'
                        ? 'bg-teal-100 border-teal-400 font-bold text-teal-900'
                        : 'bg-white border-[#DDD8CB] hover:bg-gray-50 text-[#14213D]'
                    }`}
                  >
                    Apply v2 Update
                  </button>
                </div>
              </div>

              {/* Test Profiles Toggle */}
              <div className="space-y-2 bg-[#F6F3EC] p-4 rounded-xl border border-[#DDD8CB]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#14213D]">
                    Show Twin & Test Profiles
                  </span>
                  <input
                    type="checkbox"
                    checked={state.showTestProfiles}
                    onChange={(e) => setShowTestProfiles(e.target.checked)}
                    className="w-4 h-4 accent-[#12706F] rounded"
                  />
                </div>
                <p className="text-[11px] text-[#718096]">
                  Unlocks P1b, P2b (proxy-swap twins), P4 (boundary marks/attendance), and P5 (clean Asha).
                </p>
              </div>

              {/* Demo Today Date Picker */}
              <div className="space-y-2 bg-[#F6F3EC] p-4 rounded-xl border border-[#DDD8CB]">
                <label className="text-xs font-bold text-[#14213D] block flex items-center gap-1.5">
                  <Calendar size={13} />
                  Demo "Today" Reference Date
                </label>
                <input
                  type="date"
                  value={state.todayStr}
                  onChange={(e) => setTodayStr(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#DDD8CB] rounded-lg text-xs text-[#14213D] font-mono focus:outline-none focus:ring-1 focus:ring-[#12706F]"
                />
                <button
                  onClick={() => setTodayStr('2026-10-26')}
                  className="text-[11px] text-[#12706F] hover:underline"
                >
                  Reset to default (2026-10-26)
                </button>
              </div>

              {/* Submissions Count */}
              <div className="bg-[#F6F3EC] p-4 rounded-xl border border-[#DDD8CB] text-xs space-y-1">
                <div className="flex justify-between items-center text-[#14213D] font-bold">
                  <span className="flex items-center gap-1">
                    <FileCheck size={14} className="text-[#12706F]" />
                    Recorded Submissions:
                  </span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#DDD8CB]">
                    {state.submissions.length}
                  </span>
                </div>
                <p className="text-[11px] text-[#718096]">
                  IndexedDB guarantees exact idempotent deduping across network drops.
                </p>
              </div>
            </div>

            {/* Reset All Button */}
            <div className="pt-6 border-t border-[#DDD8CB]">
              <button
                onClick={() => {
                  if (confirm('Reset all demo state and IndexedDB data to initial baseline?')) {
                    resetDemoData();
                    setIsOpen(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl border border-rose-200 text-xs font-bold transition-all"
              >
                <RefreshCw size={14} />
                <span>Reset All Demo State</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
