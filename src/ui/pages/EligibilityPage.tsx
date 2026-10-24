import React, { useState } from 'react';
import { useApp } from '../../store/context';
import { t } from '../i18n';
import { evaluateAllSchemes } from '../../engine/rules';
import { analyzeAllSensitivity } from '../../engine/sensitivity';
import { StatusChip } from '../components/StatusChip';
import {
  HelpCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Clock,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Info,
} from 'lucide-react';

export const EligibilityPage: React.FC = () => {
  const { state, currentProfile, addQuestionForOffice } = useApp();
  const [filter, setFilter] = useState<'all' | 'open' | 'later'>('all');
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>('A'); // Expand A by default for Asha demo

  const schemes = state.schemes;
  const today = state.todayStr;

  const evaluationResults = evaluateAllSchemes(schemes, currentProfile, today);
  const sensitivities = analyzeAllSensitivity(schemes, currentProfile, today);

  // Filter schemes
  const filteredResults = evaluationResults.filter((er) => {
    if (filter === 'open') return er.timingStatus === 'open';
    if (filter === 'later') return er.timingStatus === 'not_open_yet';
    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header card */}
      <div className="bg-[#FBFAF6] border border-[#DDD8CB] p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#718096] uppercase font-bold tracking-wider">
              <span>Eligibility Verification</span>
              <span>/</span>
              <span className="text-[#12706F]">Tri-State Decision Board</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#14213D] mt-1">
              Synthetic Scheme Eligibility Directory
            </h1>
            <p className="text-xs sm:text-sm text-[#4A5568] mt-1">
              Every rule is rigorously evaluated using three-valued Kleene logic: <b>Met</b>, <b>Unmet</b>, or <b>Unknown</b>.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#F6F3EC] p-1.5 rounded-xl border border-[#DDD8CB] text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-[#12706F] text-white shadow-xs'
                  : 'text-[#4A5568] hover:text-[#14213D]'
              }`}
            >
              All ({evaluationResults.length})
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'open'
                  ? 'bg-[#12706F] text-white shadow-xs'
                  : 'text-[#4A5568] hover:text-[#14213D]'
              }`}
            >
              Open Now ({evaluationResults.filter((e) => e.timingStatus === 'open').length})
            </button>
            <button
              onClick={() => setFilter('later')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'later'
                  ? 'bg-[#12706F] text-white shadow-xs'
                  : 'text-[#4A5568] hover:text-[#14213D]'
              }`}
            >
              Opens Later ({evaluationResults.filter((e) => e.timingStatus === 'not_open_yet').length})
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Scheme Cards */}
      <div className="space-y-4">
        {filteredResults.map((er) => {
          const scheme = er.scheme;
          const isExpanded = expandedSchemeId === scheme.id;
          const sens = sensitivities[scheme.id];

          return (
            <div
              key={scheme.id}
              className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl shadow-sm transition-all overflow-hidden"
            >
              {/* Card Summary Header */}
              <div
                onClick={() => setExpandedSchemeId(isExpanded ? null : scheme.id)}
                className="p-5 cursor-pointer hover:bg-[#F6F3EC]/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#14213D] text-white text-xs font-bold flex items-center justify-center">
                      {scheme.id}
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-[#14213D]">
                      {scheme.name}
                    </h2>
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                      SYNTHETIC
                    </span>
                    {er.timingStatus === 'not_open_yet' && (
                      <span className="bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        Opens {scheme.opensOn}
                      </span>
                    )}
                    {er.timingStatus === 'closed' && (
                      <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        Closed
                      </span>
                    )}
                  </div>

                  {/* Scheme Metadata Badges */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#4A5568]">
                    <span className="font-bold text-[#14213D] font-mono">
                      Award: ₹{scheme.award.toLocaleString('en-IN')}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-[#12706F]" />
                      {scheme.effortHours}h effort
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={13} className="text-[#12706F]" />
                      Deadline: {scheme.deadline}
                    </span>
                    {scheme.excludesWith.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-medium">
                          Cannot combine with Scheme {scheme.excludesWith.join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Overall Tri-State Status Chip & Expand Chevron */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-[#DDD8CB]/60">
                  <div className="text-right">
                    <StatusChip status={er.status} showSublabel={true} size="md" />
                  </div>
                  <button
                    className="p-1.5 text-gray-400 hover:text-[#14213D] rounded-lg"
                    aria-label="Expand details"
                  >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {/* Expanded Rule Table & Sensitivity Section */}
              {isExpanded && (
                <div className="border-t border-[#DDD8CB] p-5 bg-white space-y-6">
                  {/* Rules Breakdown Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                        Published Scheme Rules Breakdown
                      </h4>
                      <span className="text-[11px] text-[#718096]">
                        Exact English text & multi-declaration audit
                      </span>
                    </div>

                    <div className="border border-[#DDD8CB] rounded-xl overflow-hidden divide-y divide-[#DDD8CB]">
                      {er.ruleResults.map((rr) => (
                        <div key={rr.ruleId} className="p-4 bg-[#FBFAF6] space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-extrabold text-[#12706F] bg-[#E6F4F1] px-2 py-0.5 rounded border border-[#12706F]/20">
                                  Rule {rr.ruleId}
                                </span>
                                {rr.ambiguous && (
                                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300">
                                    AMBIGUOUS WORDING
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-[#14213D] leading-snug">
                                {rr.ruleText}
                              </p>
                            </div>
                            <div>
                              <StatusChip status={rr.status} showSublabel={false} size="sm" />
                            </div>
                          </div>

                          {/* Values Used & Evidence */}
                          <div className="bg-white p-3 rounded-lg border border-[#DDD8CB] text-xs space-y-1.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                              <span className="text-gray-500">Value(s) Evaluated:</span>
                              <span className="font-mono font-bold text-[#14213D] break-all">
                                {rr.valuesUsed && rr.valuesUsed.length > 0
                                  ? rr.valuesUsed.join(' | ')
                                  : 'None provided (empty)'}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] border-t border-gray-100 pt-1">
                              <span className="text-gray-500">Required Evidence:</span>
                              <span className="font-medium text-[#12706F]">
                                {rr.evidence.join(', ')}
                              </span>
                            </div>
                          </div>

                          {/* Ambiguous Rule E2 Special Two-Reading Display */}
                          {rr.ambiguous && rr.interpretationsResult && (
                            <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#9A5A00] flex items-center gap-1.5">
                                  <HelpCircle size={14} />
                                  Dual Interpretation Notice (Rule E2)
                                </span>
                                <button
                                  onClick={() =>
                                    addQuestionForOffice({
                                      schemeId: scheme.id,
                                      schemeName: scheme.name,
                                      ruleId: rr.ruleId,
                                      ruleText: rr.ruleText,
                                      interpretations: rr.interpretationsResult!.map((ir) => ({
                                        id: ir.id,
                                        label: ir.label,
                                      })),
                                      questionText: `Rule ${rr.ruleId} wording is ambiguous between parents' income vs full household income. Which definition does the review authority apply?`,
                                    })
                                  }
                                  className="text-[11px] bg-[#12706F] text-white px-2.5 py-1 rounded-lg font-bold hover:bg-[#0e5756] transition-all"
                                >
                                  + Add to Questions for Office
                                </button>
                              </div>
                              <p className="text-[11px] text-[#4A5568]">
                                The rule text is unclear. Both readings are evaluated independently:
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {rr.interpretationsResult.map((ir) => (
                                  <div
                                    key={ir.id}
                                    className="p-2.5 bg-white rounded-lg border border-amber-200 flex items-center justify-between"
                                  >
                                    <div>
                                      <div className="font-bold text-[#14213D]">{ir.label}</div>
                                      <div className="text-[10px] text-gray-500 font-mono">
                                        Evaluated: ₹{ir.valueUsed}
                                      </div>
                                    </div>
                                    <StatusChip status={ir.status} showSublabel={false} size="sm" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* "What would change this result?" Sensitivity Section */}
                  {sens && sens.overallStatus !== 'MET' && (
                    <div className="p-4 bg-[#E6F4F1] border border-[#12706F]/30 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-2 text-[#12706F] font-bold text-xs uppercase tracking-wide">
                        <Sparkles size={15} />
                        <span>What Would Change This Result? (Sensitivity Analysis)</span>
                      </div>

                      <div className="space-y-1.5 text-xs text-[#14213D]">
                        {sens.flippingRules.map((fr) => (
                          <div key={fr.ruleId} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#12706F] mt-1.5 shrink-0"></span>
                            <span>{fr.message}</span>
                          </div>
                        ))}

                        {sens.conflictAdvice && (
                          <div className="mt-2 p-2.5 bg-white/80 rounded-lg border border-[#12706F]/20 text-xs text-[#14213D] font-medium">
                            <b>Notice:</b> {sens.conflictAdvice}
                          </div>
                        )}

                        <p className="text-[10px] text-[#718096] italic mt-2">
                          ScholarSathi provides diagnostic sensitivity to clarify policy conditions. We never suggest altering historical facts or submitted records.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
