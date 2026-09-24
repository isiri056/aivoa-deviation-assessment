import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Database, Calendar, Tag, ShieldAlert, FileText, ChevronRight } from 'lucide-react';
import { fetchSavedDeviations } from '../store/deviationSlice';

export default function SavedDeviationsDrawer({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { savedDeviationsList } = useSelector((state) => state.deviation);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slideLeft">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Database Records ({savedDeviationsList.length})
              </h3>
              <p className="text-xs text-slate-500">
                Archived pharmaceutical deviation records from database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {savedDeviationsList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-slate-600">No records saved yet.</p>
              <p className="mt-1">Extract a deviation using AI and click "Save Deviation" to create a database record.</p>
            </div>
          ) : (
            savedDeviationsList.map((dev) => (
              <div
                key={dev.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-blue-300 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                      ID #{dev.id}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                      {dev.title}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        dev.initial_impact === 'High'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : dev.initial_impact === 'Medium'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {dev.initial_impact} Impact
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        dev.initial_severity === 'Critical'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : dev.initial_severity === 'Major'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {dev.initial_severity}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-700">Site:</span> {dev.site_plant}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Date:</span> {dev.date_of_occurrence}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Batch:</span>{' '}
                    <span className="font-mono">{dev.batch_lot_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Qty:</span> {dev.affected_quantity || 'N/A'}
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                  "{dev.detailed_description}"
                </p>

                {dev.recommended_action && (
                  <div className="text-[10px] bg-blue-50/50 border border-blue-100 rounded p-2 text-blue-900">
                    <span className="font-bold">CAPA Action:</span> {dev.recommended_action}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => dispatch(fetchSavedDeviations())}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
          >
            Refresh Records
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
