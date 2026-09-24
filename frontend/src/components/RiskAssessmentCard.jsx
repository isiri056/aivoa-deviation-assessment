import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Info, Sparkles } from 'lucide-react';

export default function RiskAssessmentCard({
  impact,
  severity,
  reason,
  recommendedAction,
  onImpactChange,
  onSeverityChange,
  onReasonChange,
  onActionChange,
  isAiGenerated = false,
}) {
  const getImpactBadgeClass = (val) => {
    switch ((val || '').toLowerCase()) {
      case 'high':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-200';
      case 'low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getSeverityBadgeClass = (val) => {
    switch ((val || '').toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300 ring-red-300';
      case 'major':
        return 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-200';
      case 'minor':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const hasAssessment = impact || severity || reason || recommendedAction;

  return (
    <div className="bg-slate-50/80 rounded-xl border border-slate-200/90 p-4 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-100/70 text-blue-700 rounded-md">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Initial GxP Risk Assessment
            </h4>
            <p className="text-[11px] text-slate-500">
              Evaluated against ICH Q9 Quality Risk Management principles
            </p>
          </div>
        </div>

        {isAiGenerated && hasAssessment && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-3 h-3 mr-1 text-blue-600" />
            AI Evaluated
          </span>
        )}
      </div>

      {/* Impact & Severity Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {/* Initial Impact */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
            <span>9. Initial Impact <span className="text-rose-500 font-bold">*</span></span>
            {impact && (
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getImpactBadgeClass(impact)}`}>
                {impact}
              </span>
            )}
          </label>
          <select
            value={impact || ''}
            onChange={(e) => onImpactChange(e.target.value)}
            className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Select Impact Level...</option>
            <option value="High">High (Direct CQA/CPP violation, product quarantine)</option>
            <option value="Medium">Medium (Process deviation requiring analytical verification)</option>
            <option value="Low">Low (No direct product or quality impact)</option>
          </select>
        </div>

        {/* Initial Severity */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
            <span>10. Initial Severity <span className="text-rose-500 font-bold">*</span></span>
            {severity && (
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getSeverityBadgeClass(severity)}`}>
                {severity}
              </span>
            )}
          </label>
          <select
            value={severity || ''}
            onChange={(e) => onSeverityChange(e.target.value)}
            className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Select Severity Level...</option>
            <option value="Critical">Critical (Severe risk to patient safety / GMP compliance)</option>
            <option value="Major">Major (Departure from validated limits, full QA investigation)</option>
            <option value="Minor">Minor (Minor procedural deviation, low residual risk)</option>
          </select>
        </div>
      </div>

      {/* Rationale & Recommended Actions */}
      <div className="space-y-2.5 pt-2 border-t border-slate-200/60 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
            Technical Severity Rationale:
          </label>
          <textarea
            rows={2}
            value={reason || ''}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="AI technical rationale will appear here, or enter manual risk assessment justification..."
            className="w-full bg-white border border-slate-200 rounded-md p-2 text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
            Recommended Containment & Next Action:
          </label>
          <textarea
            rows={2}
            value={recommendedAction || ''}
            onChange={(e) => onActionChange(e.target.value)}
            placeholder="Recommended containment action (e.g. quarantine batch, HPLC testing, notify QA lead)..."
            className="w-full bg-white border border-slate-200 rounded-md p-2 text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>
      </div>
    </div>
  );
}
