import React, { useState } from 'react';
import { useApp } from '../../store/context';
import { optimizePortfolio } from '../../engine/optimizer';
import { computeNaiveBaseline } from '../../engine/baseline';
import { computeRankingDiff, generateCounterfactuals } from '../../engine/weights';
import { StatusChip } from '../components/StatusChip';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  Award,
  Clock,
  Calendar,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Scale,
  Info,
} from 'lucide-react';

export const PlannerPage: React.FC = () => {
  const {
    state,
    currentProfile,
    setWeights,
    resetWeights,
    updateProfileFields,
  } = useApp();

  const [compareBaseline, setCompareBaseline] = useState(false);

  const schemes = state.schemes;
  const config = state.config;
  const today = state.todayStr;
  const weights = state.weights;
  const prevWeights = state.previousWeights || weights;

  // Run portfolio optimizer
  const optResult = optimizePortfolio(schemes, currentProfile, config, weights, today);
  const baselineSet = computeNaiveBaseline(schemes, currentProfile, config, weights, today);

  // Compute ranking diffs and counterfactuals
  const rankingDiff = computeRankingDiff(schemes, currentProfile, config, prevWeights, weights, today);
  const counterfactuals = generateCounterfactuals(schemes, currentProfile, config, weights, today);

  const bestSet = optResult.bestSet;
  const alternativeSets = optResult.alternativeSets;
  const availableHours = optResult.availableHours;
  const renewalHours = optResult.mandatoryRenewalHours;

  return (
    <div className="space-y-6 pb-16">
      {/* Title & Guidance Header */}
      <div className="bg-[#FBFAF6] border border-[#DDD8CB] p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#718096] uppercase font-bold tracking-wider">
              <span>Weekly Workload Optimizer</span>
              <span>/</span>
              <span className="text-[#12706F]">Portfolio Planner</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#14213D] mt-1">
              Personalized Scholarship Portfolio
            </h1>
            <p className="text-xs sm:text-sm text-[#4A5568] mt-1">
              Balances grant awards, time constraints, evidence arrival delays, and paperwork workload.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-[#14213D] bg-[#F6F3EC] px-3 py-2 rounded-xl border border-[#DDD8CB] cursor-pointer">
              <input
                type="checkbox"
                checked={compareBaseline}
                onChange={(e) => setCompareBaseline(e.target.checked)}
                className="w-4 h-4 accent-[#12706F] rounded"
              />
              <span>Compare with Award-Size Baseline</span>
            </label>
          </div>
        </div>
      </div>

      {/* Baseline Comparison Notice (When Toggled) */}
      {compareBaseline && (
        <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#9A5A00] flex items-center gap-2">
              <Scale size={16} />
              Side-by-Side: Naive Award-Size Baseline vs ScholarSathi Portfolio
            </h3>
            <span className="text-[11px] text-[#718096] italic">
              Modelled under stated assumptions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Baseline Card */}
            <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-700 uppercase">Naive Award Baseline</span>
                <span className="font-mono font-bold text-rose-700">
                  Score: {baselineSet.totalUtility}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                Sorts by award size only; ignores eligibility checks and evidence wait times.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {baselineSet.schemes.map((s) => (
                  <span
                    key={s.id}
                    className="bg-gray-100 text-gray-800 font-bold px-2 py-0.5 rounded border text-[11px]"
                  >
                    Scheme {s.id} (₹{s.award.toLocaleString('en-IN')})
                  </span>
                ))}
              </div>
              {baselineSet.schemeIds.includes('B') && (
                <div className="text-[11px] text-rose-800 font-medium bg-rose-50 p-2 rounded border border-rose-200">
                  ⚠️ Baseline picks Scheme B for its large ₹22,000 award, even though the student is <b>Unmet</b> on parent income!
                </div>
              )}
            </div>

            {/* ScholarSathi Card */}
            <div className="bg-[#E6F4F1] p-4 rounded-xl border border-[#12706F]/30 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#12706F] uppercase">ScholarSathi Set</span>
                <span className="font-mono font-bold text-[#12706F]">
                  Score: {bestSet.totalUtility}
                </span>
              </div>
              <p className="text-[11px] text-[#4A5568]">
                Eliminates unmet schemes, checks document readiness, and optimizes utility.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {bestSet.schemes.map((s) => (
                  <span
                    key={s.id}
                    className="bg-white text-[#12706F] font-bold px-2 py-0.5 rounded border border-[#12706F]/20 text-[11px]"
                  >
                    Scheme {s.id} (₹{s.award.toLocaleString('en-IN')})
                  </span>
                ))}
              </div>
              <div className="text-[11px] text-emerald-800 font-medium bg-emerald-50 p-2 rounded border border-emerald-200">
                ✓ Filters out impossible paperwork, prevents wasted application effort, and protects mandatory renewals.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main 3-Column Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Controls & Hours (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Hours Controller */}
          <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#DDD8CB] pb-2">
              <h3 className="font-bold text-sm text-[#14213D] flex items-center gap-1.5">
                <Clock size={16} className="text-[#12706F]" />
                Weekly Hours Budget
              </h3>
              <span className="font-mono font-bold text-xs text-[#12706F]">
                {currentProfile.freeHoursThisWeek} h total
              </span>
            </div>

            <div className="space-y-1">
              <input
                type="range"
                min="2"
                max="40"
                value={currentProfile.freeHoursThisWeek}
                onChange={(e) => updateProfileFields({ freeHoursThisWeek: Number(e.target.value) })}
                className="w-full accent-[#12706F]"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>2 h</span>
                <span>20 h</span>
                <span>40 h</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#DDD8CB] space-y-1 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Free hours available:</span>
                <span className="font-bold text-[#14213D]">{currentProfile.freeHoursThisWeek} h</span>
              </div>
              {renewalHours > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Mandatory renewal deduction:</span>
                  <span className="font-bold">-{renewalHours} h</span>
                </div>
              )}
              <div className="flex justify-between text-[#12706F] font-bold border-t border-gray-100 pt-1">
                <span>Net available for new schemes:</span>
                <span className="font-mono">{availableHours} h</span>
              </div>
            </div>
          </div>

          {/* Weight Sliders */}
          <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDD8CB] pb-2">
              <h3 className="font-bold text-sm text-[#14213D] flex items-center gap-1.5">
                <Sliders size={16} className="text-[#12706F]" />
                Optimization Weights
              </h3>
              <button
                onClick={resetWeights}
                className="text-[11px] text-[#12706F] hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Award Weight */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-[#14213D]">Award Value (₹)</span>
                  <span className="font-mono font-bold text-[#12706F]">{weights.award}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.award}
                  onChange={(e) => setWeights({ ...weights, award: Number(e.target.value) })}
                  className="w-full accent-[#12706F]"
                />
              </div>

              {/* Chance Weight */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-[#14213D]">Chance of Finishing</span>
                  <span className="font-mono font-bold text-[#12706F]">{weights.chance}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.chance}
                  onChange={(e) => setWeights({ ...weights, chance: Number(e.target.value) })}
                  className="w-full accent-[#12706F]"
                />
              </div>

              {/* Slack Weight */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-[#14213D]">Deadline Slack</span>
                  <span className="font-mono font-bold text-[#12706F]">{weights.slack}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.slack}
                  onChange={(e) => setWeights({ ...weights, slack: Number(e.target.value) })}
                  className="w-full accent-[#12706F]"
                />
              </div>

              {/* Effort Penalty Weight */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-[#14213D]">Effort Workload Penalty</span>
                  <span className="font-mono font-bold text-[#12706F]">{weights.effort}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.effort}
                  onChange={(e) => setWeights({ ...weights, effort: Number(e.target.value) })}
                  className="w-full accent-[#12706F]"
                />
              </div>
            </div>
          </div>

          {/* Model Constants Read-Only Inspector */}
          <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-4 shadow-sm space-y-2 text-xs">
            <h4 className="font-bold text-[#14213D] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Info size={13} className="text-[#12706F]" />
              How We Estimate Finishing (Config)
            </h4>
            <div className="space-y-1 text-[11px] text-[#4A5568] bg-white p-2.5 rounded-lg border border-[#DDD8CB]">
              <div className="flex justify-between">
                <span>Evidence valid probability:</span>
                <span className="font-mono font-bold">{config.pEvidenceValid}</span>
              </div>
              <div className="flex justify-between">
                <span>Evidence re-issue (on-time):</span>
                <span className="font-mono font-bold">{config.pEvidenceReissueBeforeSafe}</span>
              </div>
              <div className="flex justify-between">
                <span>Buffer days (good / unreliable):</span>
                <span className="font-mono font-bold">
                  {config.bufferDaysGood}d / {config.bufferDaysUnreliable}d
                </span>
              </div>
              <div className="flex justify-between">
                <span>Unknown eligibility factor:</span>
                <span className="font-mono font-bold">{config.unknownPElig}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Recommended Set & Alternatives (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Best Set Card */}
          <div className="bg-[#FBFAF6] border-2 border-[#12706F] rounded-2xl p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDD8CB] pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#12706F] bg-[#E6F4F1] px-2 py-0.5 rounded">
                  Recommended For This Week
                </span>
                <h3 className="text-lg font-black text-[#14213D] mt-1">
                  Optimal Applications Plan
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">
                  Total Award
                </span>
                <span className="text-lg font-black text-[#12706F] font-mono">
                  ₹{bestSet.totalAward.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Hours Allocation Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-[#14213D]">Hours Allocation</span>
                <span className="font-mono text-gray-600">
                  {bestSet.totalEffortHours + renewalHours} / {currentProfile.freeHoursThisWeek} h used
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
                {renewalHours > 0 && (
                  <div
                    style={{ width: `${(renewalHours / currentProfile.freeHoursThisWeek) * 100}%` }}
                    className="bg-amber-500 h-full"
                    title={`Renewal: ${renewalHours}h`}
                  ></div>
                )}
                {bestSet.schemes.map((s, idx) => (
                  <div
                    key={s.id}
                    style={{
                      width: `${(s.effortHours / currentProfile.freeHoursThisWeek) * 100}%`,
                    }}
                    className={`${
                      idx % 2 === 0 ? 'bg-[#12706F]' : 'bg-[#2A9D8F]'
                    } h-full border-r border-white/40`}
                    title={`Scheme ${s.id}: ${s.effortHours}h`}
                  ></div>
                ))}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                {renewalHours > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Renewal ({renewalHours}h)
                  </span>
                )}
                {bestSet.schemes.map((s) => (
                  <span key={s.id} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#12706F]"></span>
                    Scheme {s.id} ({s.effortHours}h)
                  </span>
                ))}
              </div>
            </div>

            {/* Mandatory Renewal Included */}
            {currentProfile.existingScholarship && (
              <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-amber-950">
                    Mandatory Item: {currentProfile.existingScholarship.name}
                  </div>
                  <div className="text-[11px] text-amber-800">
                    Due: {currentProfile.existingScholarship.renewalDue}
                  </div>
                </div>
                <span className="bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px]">
                  {renewalHours}h reserved
                </span>
              </div>
            )}

            {/* Chosen Schemes List */}
            <div className="space-y-2">
              {bestSet.schemes.map((s) => {
                const sc = optResult.allSchemeScores[s.id];
                return (
                  <div
                    key={s.id}
                    className="p-3.5 bg-white border border-[#DDD8CB] rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-[#14213D] text-white text-[11px] font-bold flex items-center justify-center">
                          {s.id}
                        </span>
                        <span className="font-bold text-[#14213D] text-sm">{s.name}</span>
                      </div>
                      <div className="text-[11px] text-[#4A5568]">
                        ₹{s.award.toLocaleString('en-IN')} • {s.effortHours}h effort • Start by:{' '}
                        <span className="font-mono font-bold text-[#12706F]">
                          {sc.latestSafeStart}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          sc.slackDays > 3
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {sc.slackDays > 3 ? 'Comfortable' : 'Tight schedule'}
                      </span>
                      <StatusChip status={sc.status} showSublabel={false} size="sm" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hard Rule 8 Planning Score Notice */}
            <div className="p-3 bg-[#E6F4F1] rounded-xl border border-[#12706F]/20 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#14213D]">Portfolio Planning Score:</span>
                <span className="font-mono text-base font-black text-[#12706F]">
                  {bestSet.totalUtility}
                </span>
              </div>
              <p className="text-[10px] text-[#718096] italic">
                Planning score (model estimate, not a prediction of results)
              </p>
            </div>

            {/* Why This Set Wins */}
            {bestSet.whyChosen && (
              <div className="space-y-1 text-xs">
                <span className="font-bold text-[#14213D] block">Why this set wins:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-gray-600 text-[11px]">
                  {bestSet.whyChosen.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Alternative Sets Table */}
          <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-[#14213D]">Next 4 Alternative Portfolios</h3>
            <div className="space-y-2">
              {alternativeSets.map((alt, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-[#DDD8CB] rounded-xl text-xs space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#14213D]">
                      Option {idx + 1}: [{alt.schemeIds.join(', ') || 'None'}]
                    </span>
                    <span className="font-mono text-[11px] text-gray-500">
                      Score: {alt.totalUtility}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>{alt.totalEffortHours} h total</span>
                    <span className="text-amber-800 italic">{alt.whyNotChosen}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Ranking Diff & Counterfactuals (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Live Ranking Diff */}
          <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-[#14213D] flex items-center justify-between">
              <span>Scheme Rankings by Utility</span>
              <span className="text-[10px] text-[#718096]">Live Diff</span>
            </h3>

            <div className="space-y-2">
              {rankingDiff
                .sort((a, b) => b.newScore.utility - a.newScore.utility)
                .map((rd) => (
                  <div
                    key={rd.schemeId}
                    className="p-2.5 bg-white border border-[#DDD8CB] rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#14213D]">
                        #{rd.newRank} Scheme {rd.schemeId}
                      </span>
                      <div className="flex items-center gap-1">
                        {rd.rankDelta > 0 && (
                          <span className="flex items-center text-emerald-700 font-bold text-[10px]">
                            <ArrowUp size={12} />+{rd.rankDelta}
                          </span>
                        )}
                        {rd.rankDelta < 0 && (
                          <span className="flex items-center text-rose-700 font-bold text-[10px]">
                            <ArrowDown size={12} />
                            {rd.rankDelta}
                          </span>
                        )}
                        {rd.rankDelta === 0 && (
                          <span className="text-gray-400 text-[10px]">—</span>
                        )}
                        <span className="font-mono font-bold ml-1 text-[#12706F]">
                          {rd.newUtility}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-gray-500 flex justify-between">
                      <span>Slack: {rd.newScore.slackDays}d</span>
                      <span className="capitalize">{rd.newScore.status.toLowerCase()}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Computed Counterfactual Sentences (Section 6.6) */}
          <div className="bg-[#E6F4F1] border border-[#12706F]/30 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#12706F] flex items-center gap-1.5">
              <Sparkles size={14} />
              Counterfactual Insights
            </h3>
            <div className="space-y-2 text-xs text-[#14213D]">
              {counterfactuals.map((sentence, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-white/70 p-2 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#12706F] mt-1.5 shrink-0"></span>
                  <p className="leading-snug text-[11px]">{sentence}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#718096] italic">
              Computed deterministically by testing weight shifts across 0 to 100.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
