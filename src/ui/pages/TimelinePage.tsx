import React, { useState } from 'react';
import { useApp } from '../../store/context';
import { optimizePortfolio } from '../../engine/optimizer';
import { computeCompletionMetrics } from '../../engine/completion';
import { computeRenewalCompletionMetrics } from '../../engine/renewal';
import { StatusChip } from '../components/StatusChip';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  ExternalLink,
  ChevronRight,
  Sparkles,
  X,
  FileCheck,
} from 'lucide-react';

export const TimelinePage: React.FC = () => {
  const { state, currentProfile, submitApplication } = useApp();

  const schemes = state.schemes;
  const config = state.config;
  const today = state.todayStr;

  const optRes = optimizePortfolio(schemes, currentProfile, config, state.weights, today);
  const recommendedSchemes = optRes.bestSet.schemes;

  // Selected drawer scheme for action
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const selectedScheme = schemes.find((s) => s.id === selectedSchemeId);
  const draft = selectedSchemeId ? state.drafts[selectedSchemeId] : null;

  // Collect all timeline items
  interface TimelineItem {
    id: string;
    date: string;
    title: string;
    type: 'opening' | 'deadline' | 'safeStart' | 'renewal' | 'certificateETA' | 'submission';
    schemeId?: string;
    status: 'Not started' | 'In progress' | 'Ready' | 'Submitted' | 'Missed';
    description: string;
  }

  const items: TimelineItem[] = [];

  // Add scheme opening dates & deadlines
  for (const s of schemes) {
    items.push({
      id: `open-${s.id}`,
      date: s.opensOn,
      title: `Scheme ${s.id} Opens: ${s.name}`,
      type: 'opening',
      schemeId: s.id,
      status: today >= s.opensOn ? 'In progress' : 'Not started',
      description: `Applications open for ${s.name} (Award: ₹${s.award.toLocaleString('en-IN')})`,
    });

    const completion = computeCompletionMetrics(s, currentProfile, config, today);
    items.push({
      id: `safe-${s.id}`,
      date: completion.latestSafeStart,
      title: `Latest Safe Start: Scheme ${s.id}`,
      type: 'safeStart',
      schemeId: s.id,
      status: today > completion.latestSafeStart ? 'Missed' : 'Not started',
      description: `Must start paperwork for ${s.name} by this date to finish safely before deadline.`,
    });

    items.push({
      id: `deadline-${s.id}`,
      date: s.deadline,
      title: `Deadline: Scheme ${s.id} (${s.name})`,
      type: 'deadline',
      schemeId: s.id,
      status: today > s.deadline ? 'Missed' : 'Not started',
      description: `Final cutoff date for submitting ${s.name}.`,
    });
  }

  // Add certificate ETA if re-issue requested
  if (
    currentProfile.incomeCertificate.reissue.requested &&
    currentProfile.incomeCertificate.reissue.etaDate
  ) {
    items.push({
      id: 'cert-eta',
      date: currentProfile.incomeCertificate.reissue.etaDate,
      title: 'Income Certificate Re-issue ETA',
      type: 'certificateETA',
      status: today >= currentProfile.incomeCertificate.reissue.etaDate ? 'Ready' : 'In progress',
      description: 'Expected arrival date for renewed Family Income Certificate.',
    });
  }

  // Add existing scholarship renewal due
  if (currentProfile.existingScholarship) {
    const renComp = computeRenewalCompletionMetrics(
      currentProfile.existingScholarship,
      currentProfile,
      config,
      today
    );
    items.push({
      id: 'renewal-due',
      date: currentProfile.existingScholarship.renewalDue,
      title: `Renewal Due: ${currentProfile.existingScholarship.name}`,
      type: 'renewal',
      status: today > currentProfile.existingScholarship.renewalDue ? 'Missed' : 'Not started',
      description: `Mandatory annual renewal requiring ${currentProfile.existingScholarship.renewalHours} hours.`,
    });
  }

  // Add recorded submissions
  for (const sub of state.submissions) {
    items.push({
      id: `sub-${sub.submissionId}`,
      date: sub.submittedAt.slice(0, 10),
      title: `Submitted: Scheme ${sub.schemeId}`,
      type: 'submission',
      schemeId: sub.schemeId,
      status: 'Submitted',
      description: `Successfully recorded in IndexedDB (ID: ${sub.submissionId.slice(0, 8)}...)`,
    });
  }

  // Sort chronologically
  items.sort((a, b) => a.date.localeCompare(b.date));

  const handleDemoSubmit = async (schemeId: string) => {
    setSubmitting(true);
    try {
      const { record, isDuplicate } = await submitApplication(schemeId, {
        profileId: currentProfile.id,
        timestamp: new Date().toISOString(),
      });
      setSuccessToast(
        isDuplicate
          ? `Submission ${record.submissionId} was already recorded (Idempotent deduplicated).`
          : `Application for Scheme ${schemeId} successfully submitted (Demo ID: ${record.submissionId.slice(
              0,
              8
            )})`
      );
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Title */}
      <div className="bg-[#FBFAF6] border border-[#DDD8CB] p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#718096] uppercase font-bold tracking-wider">
              <span>Action Plan</span>
              <span>/</span>
              <span className="text-[#12706F]">Timeline & Application Tracker</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#14213D] mt-1">
              Application Milestones & Safe Start Tracker
            </h1>
            <p className="text-xs sm:text-sm text-[#4A5568] mt-1">
              Unified chronological timeline combining openings, evidence arrival ETAs, latest safe start dates, and deadlines.
            </p>
          </div>

          <div className="bg-[#E6F4F1] border border-[#12706F]/20 px-3 py-2 rounded-xl text-xs font-bold text-[#12706F]">
            Today Reference: {today}
          </div>
        </div>
      </div>

      {successToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-700" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-gray-500 hover:text-black">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Recommended Applications Quick Action Bar */}
      <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-[#14213D]">
          Recommended Applications This Week (Click to Track & Submit)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {recommendedSchemes.map((s) => {
            const isSubmitted = state.submissions.some((sub) => sub.schemeId === s.id);
            return (
              <div
                key={s.id}
                onClick={() => setSelectedSchemeId(s.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                  isSubmitted
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-white border-[#DDD8CB] hover:border-[#12706F] shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs font-mono bg-[#14213D] text-white px-2 py-0.5 rounded">
                    Scheme {s.id}
                  </span>
                  {isSubmitted ? (
                    <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded">
                      Submitted ✓
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#12706F] font-bold flex items-center gap-1">
                      Manage <ChevronRight size={12} />
                    </span>
                  )}
                </div>
                <div className="font-bold text-sm text-[#14213D] truncate">{s.name}</div>
                <div className="text-[11px] text-gray-500 flex justify-between">
                  <span>Deadline: {s.deadline}</span>
                  <span className="font-mono font-bold text-[#12706F]">₹{s.award.toLocaleString('en-IN')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vertical Timeline */}
      <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-[#14213D]">Unified Chronological Milestone Timeline</h3>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DDD8CB]">
          {items.map((item) => {
            const isTodayOrPast = item.date <= today;
            return (
              <div key={item.id} className="relative flex items-start gap-4">
                {/* Timeline Bullet Point */}
                <div
                  className={`absolute -left-6 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                    item.status === 'Submitted'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : item.status === 'Missed'
                      ? 'border-rose-600 bg-rose-600 text-white'
                      : isTodayOrPast
                      ? 'border-[#12706F] bg-[#12706F]'
                      : 'border-[#DDD8CB] bg-white'
                  }`}
                ></div>

                <div className="bg-white border border-[#DDD8CB] rounded-xl p-4 flex-1 shadow-xs space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#12706F] bg-[#E6F4F1] px-2 py-0.5 rounded">
                        {item.date}
                      </span>
                      <h4 className="font-bold text-sm text-[#14213D]">{item.title}</h4>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        item.status === 'Submitted'
                          ? 'bg-emerald-100 text-emerald-900'
                          : item.status === 'Missed'
                          ? 'bg-rose-100 text-rose-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#4A5568]">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Application Drawer Modal */}
      {selectedScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#DDD8CB] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#12706F] uppercase tracking-wider">
                  Scheme {selectedScheme.id} Application Workspace
                </span>
                <h3 className="font-bold text-base text-[#14213D] mt-0.5">
                  {selectedScheme.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSchemeId(null)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Evidence Checklist */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-[#14213D] uppercase tracking-wider text-[11px]">
                Evidence Checklist
              </h4>
              <div className="space-y-2">
                {selectedScheme.rules.flatMap((r) => r.evidence).map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white rounded-lg border border-[#DDD8CB] flex items-center justify-between"
                  >
                    <span className="font-medium text-[#14213D]">{ev}</span>
                    <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded text-[10px]">
                      Ready / Held
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-[#DDD8CB] flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                Idempotent submission via IndexedDB
              </span>
              <button
                disabled={submitting}
                onClick={() => handleDemoSubmit(selectedScheme.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#12706F] hover:bg-[#0e5756] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                <Send size={14} />
                <span>{submitting ? 'Submitting...' : 'Submit (Demo)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
