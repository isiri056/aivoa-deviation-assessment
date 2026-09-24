import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ShieldCheck, Activity, Database, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { checkHealth, fetchSavedDeviations } from '../store/deviationSlice';

export default function Navbar({ onOpenHistory }) {
  const dispatch = useDispatch();
  const { healthStatus, savedDeviationsList } = useSelector((state) => state.deviation);

  useEffect(() => {
    dispatch(checkHealth());
    dispatch(fetchSavedDeviations());
    const interval = setInterval(() => {
      dispatch(checkHealth());
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const isConnected = healthStatus?.status === 'healthy';
  const groqReady = healthStatus?.groq_configured;
  const modelName = healthStatus?.groq_model || 'llama-3.3-70b-versatile';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Module Identification */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-xs font-bold text-lg tracking-wider">
            Ai
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 tracking-tight text-base">Aivoa.ai</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                Deviation Intake Module
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              API Manufacturing QMS • Automated GxP Deviation Intake
            </p>
          </div>
        </div>

        {/* System Telemetry & Actions */}
        <div className="flex items-center space-x-4">
          {/* Engine / Model Indicator */}
          <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 bg-slate-50 rounded-md border border-slate-200 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500">LLM Engine:</span>
            <span className="font-mono font-medium text-slate-700">{modelName}</span>
            {groqReady ? (
              <span className="inline-flex items-center text-emerald-600 font-medium">
                <CheckCircle2 className="w-3 h-3 ml-1 mr-0.5" /> Ready
              </span>
            ) : (
              <span className="inline-flex items-center text-amber-600 font-medium" title="GROQ_API_KEY not configured in backend/.env">
                <AlertCircle className="w-3 h-3 ml-1 mr-0.5" /> Key Required
              </span>
            )}
          </div>

          {/* Database & Health status */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-600 font-medium">
              {isConnected ? 'API Live' : 'Connecting...'}
            </span>
          </div>

          {/* Saved Deviations Database View */}
          <button
            onClick={onOpenHistory}
            className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition-colors border border-slate-200 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>Records</span>
            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {savedDeviationsList.length}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
