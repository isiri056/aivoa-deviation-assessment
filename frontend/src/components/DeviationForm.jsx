import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  RotateCcw,
  Save,
  Sparkles,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Building2,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  updateField,
  updateAssessmentField,
  resetForm,
  saveDeviation,
  dismissSaveSuccess,
} from '../store/deviationSlice';
import RiskAssessmentCard from './RiskAssessmentCard';

export default function DeviationForm() {
  const dispatch = useDispatch();
  const {
    deviation,
    assessment,
    aiPopulatedFields,
    processingState,
    saveSuccess,
    savedRecordId,
  } = useSelector((state) => state.deviation);

  const [formValidationErrors, setFormValidationErrors] = useState({});

  const handleFieldChange = (field, value) => {
    dispatch(updateField({ field, value }));
    if (formValidationErrors[field]) {
      setFormValidationErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!deviation.site_plant?.trim()) errors.site_plant = 'Site / Plant is required';
    if (!deviation.date_of_occurrence?.trim()) errors.date_of_occurrence = 'Date of Occurrence is required';
    if (!deviation.title?.trim()) errors.title = 'Title / Short Description is required';
    if (!deviation.source?.trim()) errors.source = 'Source is required';
    if (!deviation.detailed_description?.trim()) errors.detailed_description = 'Detailed Description is required';
    if (!assessment.impact?.trim()) errors.impact = 'Initial Impact is required';
    if (!assessment.severity?.trim()) errors.severity = 'Initial Severity is required';

    setFormValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }
    dispatch(saveDeviation());
  };

  const handleReset = () => {
    if (
      deviation.title ||
      deviation.batch_lot_number ||
      deviation.detailed_description
    ) {
      if (window.confirm('Are you sure you want to reset the deviation form? All current values will be cleared.')) {
        dispatch(resetForm());
        setFormValidationErrors({});
      }
    } else {
      dispatch(resetForm());
      setFormValidationErrors({});
    }
  };

  // Helper badge component for AI-populated fields
  const AiBadge = ({ fieldName }) => {
    if (!aiPopulatedFields[fieldName]) return null;
    return (
      <span
        title="Field automatically extracted and populated by AI"
        className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 ml-1.5 animate-fadeIn"
      >
        <Sparkles className="w-2.5 h-2.5 text-blue-600" />
        <span>AI Extracted</span>
      </span>
    );
  };

  const isSaving = processingState.isSaving;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Form Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Log Deviation
            </h2>
            <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded">
              Form QA-04
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and finalize the structured manufacturing deviation record
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Form</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Deviation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Success Alert Banner */}
      {saveSuccess && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">
              Deviation recorded successfully! Record ID #{savedRecordId} is now archived in the database.
            </span>
          </div>
          <button
            onClick={() => dispatch(dismissSaveSuccess())}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Form Fields Area */}
      <div className="p-6 overflow-y-auto space-y-4 flex-1">
        {/* Row 1: Site / Plant & Date of Occurrence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              1. Site / Plant <span className="text-rose-500 font-bold">*</span>
              <AiBadge fieldName="site_plant" />
            </label>
            <input
              type="text"
              value={deviation.site_plant}
              onChange={(e) => handleFieldChange('site_plant', e.target.value)}
              placeholder="e.g. API Synthesis Facility - Plant 1"
              className={`w-full text-xs bg-slate-50/50 border rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors ${
                formValidationErrors.site_plant
                  ? 'border-rose-400 focus:ring-rose-400'
                  : aiPopulatedFields.site_plant
                  ? 'border-blue-300 bg-blue-50/20'
                  : 'border-slate-300'
              }`}
            />
            {formValidationErrors.site_plant && (
              <p className="text-[11px] text-rose-500 mt-1">{formValidationErrors.site_plant}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              2. Date of Occurrence <span className="text-rose-500 font-bold">*</span>
              <AiBadge fieldName="date_of_occurrence" />
            </label>
            <input
              type="date"
              value={deviation.date_of_occurrence}
              onChange={(e) => handleFieldChange('date_of_occurrence', e.target.value)}
              className={`w-full text-xs bg-slate-50/50 border rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors ${
                formValidationErrors.date_of_occurrence
                  ? 'border-rose-400 focus:ring-rose-400'
                  : aiPopulatedFields.date_of_occurrence
                  ? 'border-blue-300 bg-blue-50/20'
                  : 'border-slate-300'
              }`}
            />
            {formValidationErrors.date_of_occurrence && (
              <p className="text-[11px] text-rose-500 mt-1">{formValidationErrors.date_of_occurrence}</p>
            )}
          </div>
        </div>

        {/* Row 2: Title / Short Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            3. Title / Short Description <span className="text-rose-500 font-bold">*</span>
            <AiBadge fieldName="title" />
          </label>
          <input
            type="text"
            value={deviation.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="e.g. Drying temperature excursion during Paracetamol API synthesis"
            className={`w-full text-xs bg-slate-50/50 border rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors ${
              formValidationErrors.title
                ? 'border-rose-400 focus:ring-rose-400'
                : aiPopulatedFields.title
                ? 'border-blue-300 bg-blue-50/20'
                : 'border-slate-300'
            }`}
          />
          {formValidationErrors.title && (
            <p className="text-[11px] text-rose-500 mt-1">{formValidationErrors.title}</p>
          )}
        </div>

        {/* Row 3: Source & Related Product / Material */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              4. Source <span className="text-rose-500 font-bold">*</span>
              <AiBadge fieldName="source" />
            </label>
            <input
              type="text"
              value={deviation.source}
              onChange={(e) => handleFieldChange('source', e.target.value)}
              placeholder="e.g. Production Operator, SCADA Alert, QC Lab"
              className={`w-full text-xs bg-slate-50/50 border rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors ${
                formValidationErrors.source
                  ? 'border-rose-400 focus:ring-rose-400'
                  : aiPopulatedFields.source
                  ? 'border-blue-300 bg-blue-50/20'
                  : 'border-slate-300'
              }`}
            />
            {formValidationErrors.source && (
              <p className="text-[11px] text-rose-500 mt-1">{formValidationErrors.source}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              5. Related Product / Material
              <AiBadge fieldName="product_material" />
            </label>
            <input
              type="text"
              value={deviation.product_material}
              onChange={(e) => handleFieldChange('product_material', e.target.value)}
              placeholder="e.g. Paracetamol API (Acetaminophen)"
              className={`w-full text-xs bg-slate-50/50 border rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors ${
                aiPopulatedFields.product_material
                  ? 'border-blue-300 bg-blue-50/20'
                  : 'border-slate-300'
              }`}
            />
          </div>
        </div>

        {/* Row 4: Batch / Lot Number & Affected Quantity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              6. Batch / Lot Number
              <AiBadge fieldName="batch_lot_number" />
            </label>
            <input
              type="text"
              value={deviation.batch_lot_number}
              onChange={(e) => handleFieldChange('batch_lot_number', e.target.value)}
              placeholder="e.g. API-260924"
              className={`w-full text-xs font-mono bg-slate-50/50 border rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors ${
                aiPopulatedFields.batch_lot_number
                  ? 'border-blue-300 bg-blue-50/20'
                  : 'border-slate-300'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              7. Affected Quantity
              <AiBadge fieldName="affected_quantity" />
            </label>
            <input
              type="text"
              value={deviation.affected_quantity}
              onChange={(e) => handleFieldChange('affected_quantity', e.target.value)}
              placeholder="e.g. 500 kg"
              className={`w-full text-xs bg-slate-50/50 border rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors ${
                aiPopulatedFields.affected_quantity
                  ? 'border-blue-300 bg-blue-50/20'
                  : 'border-slate-300'
              }`}
            />
          </div>
        </div>

        {/* Row 5: Detailed Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            8. Detailed Description <span className="text-rose-500 font-bold">*</span>
            <AiBadge fieldName="detailed_description" />
          </label>
          <textarea
            rows={4}
            value={deviation.detailed_description}
            onChange={(e) => handleFieldChange('detailed_description', e.target.value)}
            placeholder="Comprehensive description of the manufacturing deviation, equipment involved, parameters exceeded, duration, and immediate containment..."
            className={`w-full text-xs bg-slate-50/50 border rounded-lg p-3 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors ${
              formValidationErrors.detailed_description
                ? 'border-rose-400 focus:ring-rose-400'
                : aiPopulatedFields.detailed_description
                ? 'border-blue-300 bg-blue-50/20'
                : 'border-slate-300'
            }`}
          />
          {formValidationErrors.detailed_description && (
            <p className="text-[11px] text-rose-500 mt-1">{formValidationErrors.detailed_description}</p>
          )}
        </div>

        {/* Rows 9 & 10: Risk Assessment Card (Impact & Severity) */}
        <RiskAssessmentCard
          impact={assessment.impact}
          severity={assessment.severity}
          reason={assessment.reason}
          recommendedAction={assessment.recommended_action}
          onImpactChange={(val) => dispatch(updateAssessmentField({ field: 'impact', value: val }))}
          onSeverityChange={(val) => dispatch(updateAssessmentField({ field: 'severity', value: val }))}
          onReasonChange={(val) => dispatch(updateAssessmentField({ field: 'reason', value: val }))}
          onActionChange={(val) => dispatch(updateAssessmentField({ field: 'recommended_action', value: val }))}
          isAiGenerated={Boolean(assessment.impact || assessment.severity)}
        />
      </div>
    </div>
  );
}
