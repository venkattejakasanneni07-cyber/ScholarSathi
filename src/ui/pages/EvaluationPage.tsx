import React, { useState } from 'react';
import { useApp } from '../../store/context';
import { runAllEvaluations, FullEvaluationReport } from '../../engine/evaluation';
import rawGoldLabels from '../../data/gold.json';
import { GoldLabel } from '../../engine/types';
import {
  BarChart3,
  Play,
  Download,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const EvaluationPage: React.FC = () => {
  const { state } = useApp();
  const [report, setReport] = useState<FullEvaluationReport | null>(null);
  const [running, setRunning] = useState(false);

  const handleRunEvaluation = () => {
    setRunning(true);
    // Execute live evaluation in browser (Hard Rule 7: Never hard-code evaluation metrics)
    setTimeout(() => {
      const liveReport = runAllEvaluations(
        state.profiles,
        state.schemes,
        rawGoldLabels as unknown as GoldLabel[],
        state.config,
        state.todayStr
      );
      setReport(liveReport);
      setRunning(false);
    }, 200);
  };

  const handleExportJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scholarsathi-evaluation-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Title Header */}
      <div className="bg-[#FBFAF6] border border-[#DDD8CB] p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#718096] uppercase font-bold tracking-wider">
              <span>Scientific Rigor & Benchmarks</span>
              <span>/</span>
              <span className="text-[#12706F]">Live Evaluation Suite</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#14213D] mt-1">
              Model Evaluation & Fairness Metrics
            </h1>
            <p className="text-xs sm:text-sm text-[#4A5568] mt-1">
              All numbers on this page are computed <b>live in the browser</b> by executing the full decision engine across profiles, gold labels, and perturbation tests.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunEvaluation}
              disabled={running}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#12706F] hover:bg-[#0e5756] text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              <Play size={14} className={running ? 'animate-spin' : ''} />
              <span>{running ? 'Running Live Tests...' : 'Run All Evaluations'}</span>
            </button>
            {report && (
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#DDD8CB] hover:bg-[#F6F3EC] text-[#14213D] rounded-xl text-xs font-bold transition-all"
              >
                <Download size={14} />
                <span>Export JSON</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {!report && (
        <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-12 text-center space-y-3">
          <BarChart3 size={40} className="mx-auto text-gray-400" />
          <h3 className="font-bold text-base text-[#14213D]">Evaluations Ready to Run</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Click <b>"Run All Evaluations"</b> to test accuracy across 35 gold labels, portfolio baseline improvements, 100-run perturbation stability, and proxy fairness gaps.
          </p>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Section 1: Accuracy & Confusion Matrix */}
          <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDD8CB] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#14213D]">
                  1. Tri-State Eligibility Accuracy vs Gold Labels
                </h3>
                <p className="text-xs text-gray-500">
                  Compared across 35 hand-written gold truth pairs (7 profiles × 5 schemes).
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-[#12706F] font-mono">
                  {report.accuracy.accuracyPct}%
                </span>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Accuracy</span>
              </div>
            </div>

            {/* 3x3 Confusion Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-[#F6F3EC] text-gray-600 font-bold">
                    <th className="p-2.5 text-left border border-[#DDD8CB]">Predicted ↓ / Gold →</th>
                    <th className="p-2.5 border border-[#DDD8CB]">Gold MET</th>
                    <th className="p-2.5 border border-[#DDD8CB]">Gold UNMET</th>
                    <th className="p-2.5 border border-[#DDD8CB]">Gold UNKNOWN</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2.5 text-left font-bold border border-[#DDD8CB] bg-[#F6F3EC]">
                      Pred MET
                    </td>
                    <td className="p-2.5 border border-[#DDD8CB] font-mono font-bold text-emerald-800 bg-emerald-50">
                      {report.accuracy.confusionMatrix.MET.MET}
                    </td>
                    <td className="p-2.5 border border-[#DDD8CB] font-mono text-gray-500">
                      {report.accuracy.confusionMatrix.UNMET.MET}
                    </td>
                    <td className="p-2.5 border border-[#DDD8CB] font-mono text-gray-500">
                      {report.accuracy.confusionMatrix.UNKNOWN.MET}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-left font-bold border border-[#DDD8CB] bg-[#F6F3EC]">
                      Pred UNMET
                    </td>
                    <td className="p-2.5 border border-[#DDD8CB] font-mono text-gray-500">
                      {report.accuracy.confusionMatrix.MET.UNMET}
                    </td>
                    <td className="p-2.5 border border-[#DDD8CB] font-mono font-bold text-emerald-800 bg-emerald-50">
                      {report.accuracy.confusionMatrix.UNMET.UNMET}
                    </td>
                    <td className="p-2.5 border border-[#DDD8CB] font-mono text-gray-500">
                      {report.accuracy.confusionMatrix.UNKNOWN.UNMET}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-left font-bold border border-[#DDD8CB] bg-[#F6F3EC]">
                      Pred UNKNOWN
                    </td>
                    <td className="p-2.5 border border-[#DDD8CB] font-mono text-gray-500">
                      {report.accuracy.confusionMatrix.MET.UNKNOWN}
                    </td>
                    <td className="p-2.5 border border-[#DDD8CB] font-mono text-gray-500">
                      {report.accuracy.confusionMatrix.UNMET.UNKNOWN}
                    </td>
                    <td className="p-2.5 border border-[#DDD8CB] font-mono font-bold text-emerald-800 bg-emerald-50">
                      {report.accuracy.confusionMatrix.UNKNOWN.UNKNOWN}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {report.accuracy.mismatches.length === 0 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-700" />
                <span>Zero classification mismatches across all boundary conditions and ambiguous rules!</span>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-xs font-bold text-rose-800">Mismatches:</span>
                {report.accuracy.mismatches.map((m, i) => (
                  <div key={i} className="text-xs text-rose-700 p-2 bg-rose-50 rounded">
                    Profile {m.profileId}, Scheme {m.schemeId}: expected {m.expected}, got {m.actual} ({m.reason})
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Portfolio Value vs Naive Baseline */}
          <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="border-b border-[#DDD8CB] pb-3">
              <h3 className="font-bold text-base text-[#14213D]">
                2. Portfolio Value vs Naive Award Baseline
              </h3>
              <p className="text-xs text-gray-500">
                Evaluating utility gain across scenario profiles P1 (Asha), P2 (Ravi), P3 (Meena), and P5 (Clean Asha).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {report.baselineComparisons.map((bc) => (
                <div key={bc.profileId} className="p-3 bg-white border border-[#DDD8CB] rounded-xl space-y-2">
                  <div className="font-bold text-[#14213D] truncate">{bc.profileLabel}</div>
                  <div className="space-y-1 text-[11px] text-[#4A5568]">
                    <div className="flex justify-between">
                      <span>ScholarSathi U:</span>
                      <span className="font-mono font-bold text-[#12706F]">
                        {bc.scholarSathiUtility}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Baseline U:</span>
                      <span className="font-mono font-bold text-gray-500">{bc.baselineUtility}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-100 pt-1 font-bold text-[#12706F]">
                      <span>Delta Δ:</span>
                      <span className="font-mono">+{bc.utilityDiff}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#718096] italic">
                    Modelled, not a guarantee
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Stability Under Perturbation */}
          <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDD8CB] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#14213D]">
                  3. Decision Stability (100 Perturbed Runs)
                </h3>
                <p className="text-xs text-gray-500">
                  Tests robustness with random perturbations (hours ±1, income ±5%, marks ±2%, attendance ±2%).
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-[#12706F] font-mono">
                  {report.stability.consistencyPct}%
                </span>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Stable Runs</span>
              </div>
            </div>

            <div className="p-3 bg-white border border-[#DDD8CB] rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span>Baseline Recommended Set:</span>
                <span className="font-mono font-bold text-[#12706F]">
                  [{report.stability.baseSetIds.join(', ')}]
                </span>
              </div>
              <div className="flex justify-between">
                <span>Most Common Alternative:</span>
                <span className="font-mono text-gray-600">
                  [{report.stability.mostCommonAlternativeIds.join(', ')}] ({report.stability.alternativeCount} runs)
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Fairness Gap Across Twin Pairs */}
          <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDD8CB] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#14213D]">
                  4. Fairness Gap (Proxy-Swap Audit)
                </h3>
                <p className="text-xs text-gray-500">
                  Ensures all twin differences are fully accounted for by published proxy criteria.
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  report.fairness.pass
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                {report.fairness.pass ? 'PASS (Gap = 0)' : 'FAIL'}
              </div>
            </div>

            <p className="text-xs text-[#4A5568]">
              Unexplained score gap across demographic swap twins (P1/P1b, P2/P2b): <b>{report.fairness.overallUnexplainedGap}</b>. All observed differences stem from Scheme D's published district eligibility criterion D2.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
