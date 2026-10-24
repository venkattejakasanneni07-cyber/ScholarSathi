import React, { useState } from 'react';
import { useApp } from '../../store/context';
import { detectContradictions } from '../../engine/contradictions';
import { runFairnessTest } from '../../engine/fairness';
import { StatusChip } from '../components/StatusChip';
import {
  ShieldAlert,
  HelpCircle,
  RefreshCw,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Info,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';

export const ChecksPage: React.FC = () => {
  const {
    state,
    currentProfile,
    applySchemesV2,
    revertSchemesV1,
    updateQuestionStatus,
    resolveDeclarationConflict,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'contradictions' | 'questions' | 'simulator' | 'fairness'>('contradictions');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [v2Toast, setV2Toast] = useState<string | null>(null);

  const schemes = state.schemes;
  const config = state.config;
  const today = state.todayStr;

  const contradictions = detectContradictions(currentProfile, schemes, today);
  const fairnessReport = runFairnessTest(state.profiles, schemes, config, today);

  const handleCopyQuestion = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplyV2 = () => {
    applySchemesV2();
    setV2Toast('Rules updated: 3 changes applied successfully (v2 active).');
  };

  const handleRevertV1 = () => {
    revertSchemesV1();
    setV2Toast('Reverted successfully to rule version v1.');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Title */}
      <div className="bg-[#FBFAF6] border border-[#DDD8CB] p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#718096] uppercase font-bold tracking-wider">
              <span>System Checks & Verification</span>
              <span>/</span>
              <span className="text-[#12706F]">Audits & Simulator</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#14213D] mt-1">
              Contradictions, Office Queries & Rule Simulator
            </h1>
            <p className="text-xs sm:text-sm text-[#4A5568] mt-1">
              Neutral conflict detection, ambiguous rule interpretation questions, rule v2 updates, and fairness proxy tests.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-5 border-t border-[#DDD8CB] pt-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('contradictions')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'contradictions'
                ? 'bg-[#12706F] text-white shadow-xs'
                : 'bg-[#F6F3EC] text-[#4A5568] hover:text-[#14213D]'
            }`}
          >
            Contradictions ({contradictions.length})
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'questions'
                ? 'bg-[#12706F] text-white shadow-xs'
                : 'bg-[#F6F3EC] text-[#4A5568] hover:text-[#14213D]'
            }`}
          >
            Questions for Office ({state.questionsForOffice.length})
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'simulator'
                ? 'bg-[#12706F] text-white shadow-xs'
                : 'bg-[#F6F3EC] text-[#4A5568] hover:text-[#14213D]'
            }`}
          >
            Rule Update Simulator (v2)
          </button>
          <button
            onClick={() => setActiveTab('fairness')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'fairness'
                ? 'bg-[#12706F] text-white shadow-xs'
                : 'bg-[#F6F3EC] text-[#4A5568] hover:text-[#14213D]'
            }`}
          >
            Fairness Proxy Test
          </button>
        </div>
      </div>

      {v2Toast && (
        <div className="bg-teal-50 border border-teal-300 text-teal-950 p-4 rounded-xl flex items-center justify-between text-xs font-semibold">
          <span>{v2Toast}</span>
          <button onClick={() => setV2Toast(null)} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>
      )}

      {/* Tab 1: Contradictions */}
      {activeTab === 'contradictions' && (
        <div className="space-y-4">
          {contradictions.length === 0 ? (
            <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-8 text-center space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
              <h3 className="font-bold text-base text-[#14213D]">No Contradictions Detected</h3>
              <p className="text-xs text-gray-500">
                All declarations and document expiry dates are fully aligned with open schemes.
              </p>
            </div>
          ) : (
            contradictions.map((c) => (
              <div
                key={c.id}
                className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${
                      c.severity === 'Must-fix'
                        ? 'bg-rose-100 text-rose-900 border-rose-300'
                        : c.severity === 'Warning'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-blue-100 text-blue-900 border-blue-300'
                    }`}
                  >
                    {c.severity}
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">Field: {c.field}</span>
                </div>

                <p className="text-sm font-semibold text-[#14213D] leading-relaxed">
                  {c.message}
                </p>

                <div className="bg-white p-3 rounded-xl border border-[#DDD8CB] text-xs space-y-1">
                  <span className="font-bold text-[#12706F] block">How to resolve:</span>
                  <p className="text-[#4A5568] leading-relaxed">{c.howToResolve}</p>
                </div>

                {c.field === 'parentIncome' && (
                  <div className="flex gap-2 pt-1">
                    {c.involved.map((val, idx) => (
                      <button
                        key={idx}
                        onClick={() => resolveDeclarationConflict('parentIncome', val, 'Verified Resolution')}
                        className="px-3 py-1.5 bg-[#12706F] text-white rounded-lg text-xs font-bold hover:bg-[#0e5756] transition-all"
                      >
                        Keep ₹{Number(val).toLocaleString('en-IN')} as Correct
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Questions for Office */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-[#14213D]">
              Ambiguous Rule Interpretations & Office Queries
            </h3>
            <p className="text-xs text-gray-500">
              When scheme wording has multiple valid readings, ScholarSathi generates precise questions for the reviewing office.
            </p>

            <div className="space-y-3">
              {state.questionsForOffice.map((q) => (
                <div key={q.id} className="p-4 bg-white border border-[#DDD8CB] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#12706F] bg-[#E6F4F1] px-2 py-0.5 rounded">
                      Scheme {q.schemeId}: {q.schemeName} ({q.ruleId})
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        q.status === 'Answered'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-[#14213D]">{q.questionText}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleCopyQuestion(q.questionText, q.id)}
                      className="flex items-center gap-1.5 text-xs text-[#12706F] font-bold hover:underline"
                    >
                      {copiedId === q.id ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedId === q.id ? 'Copied to Clipboard' : 'Copy Question'}</span>
                    </button>

                    {q.status === 'Open' ? (
                      <button
                        onClick={() =>
                          updateQuestionStatus(q.id, 'Answered', 'Clarified by District Office')
                        }
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
                      >
                        Mark Answered
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-medium">
                        Answer: {q.studentAnswer}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Rule Update Simulator */}
      {activeTab === 'simulator' && (
        <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#DDD8CB] pb-3">
            <div>
              <h3 className="font-bold text-base text-[#14213D]">Mid-Event Rule Update v2 Simulator</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Test how official policy amendments alter deadlines, thresholds, and recommended sets.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono uppercase bg-[#14213D] text-white px-2.5 py-1 rounded">
                Active: {state.schemeVersion}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-xl border border-[#DDD8CB] space-y-2">
              <h4 className="font-bold text-xs text-[#14213D]">Version 1 (Baseline)</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Original scheme rules as published at the start of the event.
              </p>
              <button
                onClick={handleRevertV1}
                disabled={state.schemeVersion === 'v1'}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                Revert to v1
              </button>
            </div>

            <div className="p-4 bg-[#E6F4F1] rounded-xl border border-[#12706F]/30 space-y-2">
              <h4 className="font-bold text-xs text-[#12706F]">Version 2 (Official Update)</h4>
              <ul className="text-[11px] text-[#4A5568] space-y-1 list-disc pl-4">
                <li>Scheme A2 income limit raised to ₹3,00,000</li>
                <li>Scheme C deadline extended to 2026-11-30</li>
                <li>Scheme D1 marks threshold raised to 75%</li>
              </ul>
              <button
                onClick={handleApplyV2}
                disabled={state.schemeVersion === 'v2'}
                className="w-full py-2 bg-[#12706F] hover:bg-[#0e5756] text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                Apply Official Update v2
              </button>
            </div>
          </div>

          {state.changelog.length > 0 && (
            <div className="space-y-2 pt-3">
              <h4 className="font-bold text-xs text-[#14213D]">Changelog History</h4>
              <div className="space-y-2">
                {state.changelog.map((entry, idx) => (
                  <div key={idx} className="p-3 bg-white border border-[#DDD8CB] rounded-xl text-xs space-y-1">
                    <div className="flex justify-between font-bold text-[#14213D]">
                      <span>Version: {entry.version}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(entry.appliedAt).toLocaleString()}
                      </span>
                    </div>
                    <ul className="list-disc pl-4 text-gray-600 text-[11px] space-y-0.5">
                      {entry.notes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Fairness Proxy Test */}
      {activeTab === 'fairness' && (
        <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#DDD8CB] pb-3">
            <div>
              <h3 className="font-bold text-base text-[#14213D]">Fairness & Proxy-Swap Test</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Ensures demographic attributes (district D-101 vs D-205) do not create unexplained score bias.
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                fairnessReport.pass
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              {fairnessReport.pass ? 'PASS (Gap = 0)' : 'FAIL'}
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {fairnessReport.pairs.map((pair) => (
              <div key={pair.pairId} className="p-4 bg-white border border-[#DDD8CB] rounded-xl space-y-3">
                <div className="flex justify-between items-center font-bold text-[#14213D]">
                  <span>{pair.profileA} vs {pair.profileB}</span>
                  <span className="font-mono text-[#12706F]">
                    Unexplained Gap: {pair.unexplainedGap}
                  </span>
                </div>

                <div className="space-y-2">
                  {pair.differences.map((diff, idx) => (
                    <div key={idx} className="p-2.5 bg-[#F6F3EC] rounded-lg border border-[#DDD8CB] flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-[#14213D]">Scheme {diff.schemeId}: {diff.schemeName}</div>
                        <div className="text-[10px] text-gray-500">
                          {diff.isExplained ? `Explained: ${diff.documentedReason}` : 'Unexplained score variance'}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          diff.isExplained ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {diff.isExplained ? 'Explained Proxy' : 'Unexplained'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
