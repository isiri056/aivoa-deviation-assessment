import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AlertCircle, X, Sparkles, KeyRound } from 'lucide-react';
import Navbar from '../components/Navbar';
import DeviationForm from '../components/DeviationForm';
import AIAssistant from '../components/AIAssistant';
import SavedDeviationsDrawer from '../components/SavedDeviationsDrawer';
import { clearError } from '../store/deviationSlice';

export default function DeviationPage() {
  const dispatch = useDispatch();
  const { error, healthStatus } = useSelector((state) => state.deviation);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const groqConfigured = healthStatus?.groq_configured;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Top Navigation */}
      <Navbar onOpenHistory={() => setIsHistoryOpen(true)} />

      {/* API Key Advisory Notice (shown only if GROQ_API_KEY is not configured in backend/.env) */}
      {!groqConfigured && healthStatus && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <span className="font-bold">Groq API Key Required:</span> To enable live LangGraph AI extraction with Groq ({healthStatus.groq_model || 'llama-3.3-70b-versatile'}), please add your <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">GROQ_API_KEY</code> into <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">backend/.env</code>.
              </span>
            </div>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="text-amber-800 hover:text-amber-950 font-bold underline ml-3 flex-shrink-0"
            >
              Get Free Key
            </a>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 sm:px-6 animate-fadeIn">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
            <button
              onClick={() => dispatch(clearError())}
              className="text-rose-700 hover:text-rose-900 p-1 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace (Two-Column Desktop Layout) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[750px]">
          {/* Left Form: Log Deviation (60% width on large screens) */}
          <section className="lg:col-span-7 h-full flex flex-col">
            <DeviationForm />
          </section>

          {/* Right Assistant: AI Deviation Assistant (40% width on large screens) */}
          <section className="lg:col-span-5 h-full flex flex-col">
            <AIAssistant />
          </section>
        </div>
      </main>

      {/* Saved Deviations Drawer */}
      <SavedDeviationsDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}
