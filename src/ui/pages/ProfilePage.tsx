import React, { useState } from 'react';
import { useApp } from '../../store/context';
import { t } from '../i18n';
import {
  User,
  GraduationCap,
  Users,
  FileText,
  Clock,
  Sparkles,
  History,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  PlusCircle,
  FileSpreadsheet,
  X,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const {
    currentProfile,
    state,
    addDeclaration,
    setGapExplanation,
    updateProfileFields,
    setTodayStr,
  } = useApp();

  const [activeHistoryField, setActiveHistoryField] = useState<string | null>(null);

  // Local state for editing fields
  const [form1Income, setForm1Income] = useState(
    currentProfile.parentIncome.find((d) => d.source.includes('Form 1'))?.value || 0
  );
  const [form2Income, setForm2Income] = useState(
    currentProfile.parentIncome.find((d) => d.source.includes('Form 2'))?.value || 0
  );
  const [marksInput, setMarksInput] = useState(
    currentProfile.marksPct.length > 0 ? currentProfile.marksPct[currentProfile.marksPct.length - 1].value : ''
  );
  const [attInput, setAttInput] = useState(
    currentProfile.attendancePct.length > 0 ? currentProfile.attendancePct[currentProfile.attendancePct.length - 1].value : ''
  );

  // Gap explanation modal state
  const [gapText, setGapText] = useState(currentProfile.gapExplanation?.text || '');
  const [gapDoc, setGapDoc] = useState(currentProfile.gapExplanation?.documentName || '');
  const [gapModalOpen, setGapModalOpen] = useState(false);

  // Sync inputs when profile changes
  React.useEffect(() => {
    setForm1Income(
      currentProfile.parentIncome.find((d) => d.source.includes('Form 1'))?.value || 0
    );
    setForm2Income(
      currentProfile.parentIncome.find((d) => d.source.includes('Form 2'))?.value || 0
    );
    setMarksInput(
      currentProfile.marksPct.length > 0 ? currentProfile.marksPct[currentProfile.marksPct.length - 1].value : ''
    );
    setAttInput(
      currentProfile.attendancePct.length > 0 ? currentProfile.attendancePct[currentProfile.attendancePct.length - 1].value : ''
    );
    setGapText(currentProfile.gapExplanation?.text || '');
    setGapDoc(currentProfile.gapExplanation?.documentName || '');
  }, [currentProfile.id]);

  const handleSaveIncomeForm1 = () => {
    addDeclaration('parentIncome', Number(form1Income), 'Form 1: State form');
  };

  const handleSaveIncomeForm2 = () => {
    addDeclaration('parentIncome', Number(form2Income), 'Form 2: Central form');
  };

  const handleSaveMarks = () => {
    if (marksInput !== '') {
      addDeclaration('marksPct', Number(marksInput), 'Mark Sheet');
    }
  };

  const handleSaveAttendance = () => {
    if (attInput !== '') {
      addDeclaration('attendancePct', Number(attInput), 'Attendance Certificate');
    }
  };

  const handleSaveGap = () => {
    if (gapText.trim() && gapDoc.trim()) {
      setGapExplanation({
        text: gapText.trim(),
        documentName: gapDoc.trim(),
      });
      setGapModalOpen(false);
    }
  };

  const handleClearGap = () => {
    setGapExplanation(null);
    setGapText('');
    setGapDoc('');
    setGapModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Title & Breadcrumb */}
      <div className="bg-[#FBFAF6] border border-[#DDD8CB] p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#718096] uppercase font-bold tracking-wider">
              <span>Student Services</span>
              <span>/</span>
              <span className="text-[#12706F]">Applicant Profile & Declarations</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#14213D] mt-1">
              {currentProfile.label}
            </h1>
            <p className="text-xs sm:text-sm text-[#4A5568] mt-1">
              Manage your academic records, multi-form declarations, documented explanations, and capacity.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#F6F3EC] px-3 py-2 rounded-xl border border-[#DDD8CB] text-xs">
            <span className="text-gray-500 font-medium">District:</span>
            <span className="font-bold font-mono text-[#14213D] bg-white px-2 py-0.5 rounded border border-[#DDD8CB]">
              {currentProfile.district}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Academics Card */}
        <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#DDD8CB] pb-3">
            <h3 className="font-bold text-base text-[#14213D] flex items-center gap-2">
              <GraduationCap className="text-[#12706F]" size={18} />
              Academics & Semester History
            </h3>
            <span className="text-[11px] text-[#718096]">Official Records</span>
          </div>

          {/* Marks and Attendance Input Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Marks */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#14213D]">Last Year Marks (%)</label>
                <button
                  onClick={() => setActiveHistoryField(activeHistoryField === 'marksPct' ? null : 'marksPct')}
                  className="text-[11px] text-[#12706F] hover:underline flex items-center gap-1"
                >
                  <History size={12} />
                  <span>History ({currentProfile.marksPct.length})</span>
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 72"
                  value={marksInput}
                  onChange={(e) => setMarksInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#DDD8CB] rounded-lg text-sm text-[#14213D] focus:outline-none focus:ring-1 focus:ring-[#12706F]"
                />
                <button
                  onClick={handleSaveMarks}
                  className="px-3 py-1.5 bg-[#12706F] text-white rounded-lg text-xs font-bold hover:bg-[#0e5756] transition-all whitespace-nowrap"
                >
                  Save
                </button>
              </div>
              {currentProfile.marksPct.length > 0 && (
                <span className="text-[10px] text-[#718096] inline-block">
                  Source: {currentProfile.marksPct[currentProfile.marksPct.length - 1].source}
                </span>
              )}
            </div>

            {/* Attendance */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#14213D]">Attendance (%)</label>
                <button
                  onClick={() => setActiveHistoryField(activeHistoryField === 'attendancePct' ? null : 'attendancePct')}
                  className="text-[11px] text-[#12706F] hover:underline flex items-center gap-1"
                >
                  <History size={12} />
                  <span>History ({currentProfile.attendancePct.length})</span>
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 78"
                  value={attInput}
                  onChange={(e) => setAttInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#DDD8CB] rounded-lg text-sm text-[#14213D] focus:outline-none focus:ring-1 focus:ring-[#12706F]"
                />
                <button
                  onClick={handleSaveAttendance}
                  className="px-3 py-1.5 bg-[#12706F] text-white rounded-lg text-xs font-bold hover:bg-[#0e5756] transition-all whitespace-nowrap"
                >
                  Save
                </button>
              </div>
              {currentProfile.attendancePct.length > 0 && (
                <span className="text-[10px] text-[#718096] inline-block">
                  Source: {currentProfile.attendancePct[currentProfile.attendancePct.length - 1].source}
                </span>
              )}
            </div>
          </div>

          {/* Semesters & Hard Rule 5: Non-editable history */}
          <div className="space-y-2 pt-2 border-t border-[#DDD8CB]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#14213D]">Semester Enrolment Record</span>
              <span className="text-[10px] text-[#718096] italic">Historical record (read-only)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {currentProfile.semesters.map((s) => (
                <div
                  key={s.name}
                  className={`p-2.5 rounded-xl border text-center ${
                    s.status === 'completed'
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50/80 border-amber-300 text-amber-950 font-bold'
                  }`}
                >
                  <div className="text-xs font-bold">{s.name}</div>
                  <div className="text-[10px] uppercase tracking-wider mt-0.5">
                    {s.status === 'completed' ? 'Completed' : 'Break / Gap'}
                  </div>
                </div>
              ))}
            </div>

            {/* Gap Documented Explanation Box */}
            {currentProfile.semesters.some((s) => s.status === 'gap') && (
              <div className="mt-3 p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#9A5A00] flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    Break in Enrolment Detected
                  </span>
                  <button
                    onClick={() => setGapModalOpen(true)}
                    className="text-xs font-bold text-[#12706F] hover:underline"
                  >
                    {currentProfile.gapExplanation ? 'Update Explanation' : '+ Add Documented Explanation'}
                  </button>
                </div>

                {currentProfile.gapExplanation ? (
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200 space-y-1">
                    <div className="font-semibold text-[#14213D]">
                      Reason: <span className="font-normal text-gray-700">{currentProfile.gapExplanation.text}</span>
                    </div>
                    <div className="text-[11px] text-[#718096]">
                      Supporting Document: <span className="font-medium text-[#14213D]">{currentProfile.gapExplanation.documentName}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#718096] italic leading-relaxed">
                    We keep your record exactly as it is. There is no option to delete or edit historical semesters.
                    To satisfy rules requiring documented gaps, add an explanation and a supporting document.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. Family & Income Declarations Card (Multi-declaration support) */}
        <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#DDD8CB] pb-3">
            <h3 className="font-bold text-base text-[#14213D] flex items-center gap-2">
              <Users className="text-[#12706F]" size={18} />
              Family & Multi-Form Income
            </h3>
            <span className="text-[11px] text-[#718096]">Multi-Declaration</span>
          </div>

          <div className="space-y-4">
            {/* Form 1: State Form Declaration */}
            <div className="p-3 bg-white rounded-xl border border-[#DDD8CB] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#14213D] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#12706F]"></span>
                  Form 1: State Portal Declaration
                </label>
                <span className="text-[10px] font-mono text-gray-500">Source: Form 1</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-xs text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={form1Income}
                    onChange={(e) => setForm1Income(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-1.5 bg-[#F6F3EC] border border-[#DDD8CB] rounded-lg text-sm font-mono text-[#14213D] focus:outline-none focus:ring-1 focus:ring-[#12706F]"
                  />
                </div>
                <button
                  onClick={handleSaveIncomeForm1}
                  className="px-3 py-1.5 bg-[#12706F] text-white rounded-lg text-xs font-bold hover:bg-[#0e5756] transition-all"
                >
                  Save Declaration
                </button>
              </div>
            </div>

            {/* Form 2: Central Form Declaration */}
            <div className="p-3 bg-white rounded-xl border border-[#DDD8CB] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#14213D] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Form 2: Central Portal Declaration
                </label>
                <span className="text-[10px] font-mono text-gray-500">Source: Form 2</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-xs text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={form2Income}
                    onChange={(e) => setForm2Income(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-1.5 bg-[#F6F3EC] border border-[#DDD8CB] rounded-lg text-sm font-mono text-[#14213D] focus:outline-none focus:ring-1 focus:ring-[#12706F]"
                  />
                </div>
                <button
                  onClick={handleSaveIncomeForm2}
                  className="px-3 py-1.5 bg-[#12706F] text-white rounded-lg text-xs font-bold hover:bg-[#0e5756] transition-all"
                >
                  Save Declaration
                </button>
              </div>
            </div>

            {/* Other Household Income (for Ambiguous Rule E2) */}
            <div className="p-3 bg-[#F6F3EC] rounded-xl border border-[#DDD8CB] space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#14213D]">
                  Other Household Members' Income
                </label>
                <span className="text-[10px] text-[#718096]">Non-parent earners</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-gray-400 font-bold">₹</span>
                <input
                  type="number"
                  value={currentProfile.otherHouseholdIncome}
                  onChange={(e) => updateProfileFields({ otherHouseholdIncome: Number(e.target.value) })}
                  className="w-full pl-7 pr-3 py-1.5 bg-white border border-[#DDD8CB] rounded-lg text-sm font-mono text-[#14213D] focus:outline-none focus:ring-1 focus:ring-[#12706F]"
                />
              </div>
              <p className="text-[11px] text-[#718096] italic">
                Used in ambiguous rules such as Scheme E (Rural Learner Support).
              </p>
            </div>
          </div>
        </div>

        {/* 3. Documents & Certificates Card */}
        <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#DDD8CB] pb-3">
            <h3 className="font-bold text-base text-[#14213D] flex items-center gap-2">
              <FileText className="text-[#12706F]" size={18} />
              Income Certificate Validity
            </h3>
            <span className="text-[11px] text-[#718096]">Official Verification</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#14213D] block mb-1">Issue Date</label>
                <input
                  type="date"
                  value={currentProfile.incomeCertificate.issuedOn}
                  onChange={(e) =>
                    updateProfileFields({
                      incomeCertificate: {
                        ...currentProfile.incomeCertificate,
                        issuedOn: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-white border border-[#DDD8CB] rounded-lg font-mono text-xs text-[#14213D]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#14213D] block mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={currentProfile.incomeCertificate.expiresOn}
                  onChange={(e) =>
                    updateProfileFields({
                      incomeCertificate: {
                        ...currentProfile.incomeCertificate,
                        expiresOn: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-white border border-[#DDD8CB] rounded-lg font-mono text-xs text-[#14213D]"
                />
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#DDD8CB] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#14213D]">Re-issue Requested?</span>
                <input
                  type="checkbox"
                  checked={currentProfile.incomeCertificate.reissue.requested}
                  onChange={(e) =>
                    updateProfileFields({
                      incomeCertificate: {
                        ...currentProfile.incomeCertificate,
                        reissue: {
                          ...currentProfile.incomeCertificate.reissue,
                          requested: e.target.checked,
                        },
                      },
                    })
                  }
                  className="w-4 h-4 accent-[#12706F] rounded"
                />
              </div>

              {currentProfile.incomeCertificate.reissue.requested && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    Expected Re-issue Arrival Date (ETA)
                  </label>
                  <input
                    type="date"
                    value={currentProfile.incomeCertificate.reissue.etaDate || ''}
                    onChange={(e) =>
                      updateProfileFields({
                        incomeCertificate: {
                          ...currentProfile.incomeCertificate,
                          reissue: {
                            ...currentProfile.incomeCertificate.reissue,
                            etaDate: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-1.5 bg-[#F6F3EC] border border-[#DDD8CB] rounded-lg font-mono text-xs text-[#14213D]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Capacity & Existing Scholarship Card */}
        <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#DDD8CB] pb-3">
            <h3 className="font-bold text-base text-[#14213D] flex items-center gap-2">
              <Clock className="text-[#12706F]" size={18} />
              Weekly Capacity & Renewal Commitments
            </h3>
            <span className="text-[11px] text-[#718096]">Time Feasibility</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Free Hours Slider */}
            <div className="p-3 bg-white rounded-xl border border-[#DDD8CB] space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#14213D]">
                  Free Hours Available This Week
                </label>
                <span className="text-base font-black text-[#12706F] font-mono">
                  {currentProfile.freeHoursThisWeek} hours
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                value={currentProfile.freeHoursThisWeek}
                onChange={(e) => updateProfileFields({ freeHoursThisWeek: Number(e.target.value) })}
                className="w-full accent-[#12706F]"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>1 h</span>
                <span>20 h</span>
                <span>40 h</span>
              </div>
            </div>

            {/* Existing Scholarship Renewal (Mandatory) */}
            {currentProfile.existingScholarship ? (
              <div className="p-3 bg-[#E6F4F1] border border-[#12706F]/20 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#12706F] flex items-center gap-1.5">
                    <CheckCircle size={14} />
                    Active Scholarship Renewal
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#14213D]">
                    {currentProfile.existingScholarship.renewalHours}h mandatory
                  </span>
                </div>
                <div className="text-xs text-[#14213D]">
                  {currentProfile.existingScholarship.name} (Due: {currentProfile.existingScholarship.renewalDue})
                </div>
                <p className="text-[11px] text-[#4A5568]">
                  Hours are deducted automatically from your weekly budget before allocating new schemes.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500">
                No active recurring scholarships needing renewal this week.
              </div>
            )}

            {/* Connectivity */}
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#DDD8CB]">
              <span className="font-bold text-[#14213D]">Internet Connectivity</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="conn"
                    checked={currentProfile.connectivity === 'good'}
                    onChange={() => updateProfileFields({ connectivity: 'good' })}
                    className="accent-[#12706F]"
                  />
                  <span>Good</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="conn"
                    checked={currentProfile.connectivity === 'unreliable'}
                    onChange={() => updateProfileFields({ connectivity: 'unreliable' })}
                    className="accent-[#12706F]"
                  />
                  <span>Unreliable (+3d buffer)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Drawer Modal */}
      {activeHistoryField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDD8CB] pb-2">
              <h4 className="font-bold text-sm text-[#14213D] flex items-center gap-1.5">
                <History size={16} className="text-[#12706F]" />
                Declaration History: {activeHistoryField}
              </h4>
              <button
                onClick={() => setActiveHistoryField(null)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {((currentProfile as any)[activeHistoryField] as any[])?.map((decl, idx) => (
                <div key={idx} className="p-2.5 bg-white border border-[#DDD8CB] rounded-xl text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-sm text-[#14213D]">{decl.value}</span>
                    <div className="text-[10px] text-gray-500">Source: {decl.source}</div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {new Date(decl.enteredAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gap Explanation Modal */}
      {gapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[#FBFAF6] border border-[#DDD8CB] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDD8CB] pb-2">
              <h4 className="font-bold text-sm text-[#14213D]">
                Documented Explanation for Semester Gap
              </h4>
              <button
                onClick={() => setGapModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#718096] italic">
              ScholarSathi strictly maintains your recorded semester history. To satisfy gap documentation criteria, provide a valid reason and reference supporting documentation.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#14213D] block mb-1">Reason / Explanation Text</label>
                <input
                  type="text"
                  placeholder="e.g. Medical leave / Family emergency"
                  value={gapText}
                  onChange={(e) => setGapText(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#DDD8CB] rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-[#14213D] block mb-1">Supporting Document Name</label>
                <input
                  type="text"
                  placeholder="e.g. Medical Leave Certificate from Hospital"
                  value={gapDoc}
                  onChange={(e) => setGapDoc(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#DDD8CB] rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-between pt-2 border-t border-[#DDD8CB]">
              {currentProfile.gapExplanation && (
                <button
                  onClick={handleClearGap}
                  className="px-3 py-1.5 text-xs text-rose-700 hover:underline"
                >
                  Remove Explanation
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setGapModalOpen(false)}
                  className="px-3 py-1.5 border border-[#DDD8CB] rounded-lg text-xs text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGap}
                  className="px-4 py-1.5 bg-[#12706F] text-white rounded-lg text-xs font-bold hover:bg-[#0e5756]"
                >
                  Save Explanation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
