import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  FileText,
  AlertTriangle,
  RotateCcw,
  CornerDownLeft,
  ChevronRight,
} from 'lucide-react';
import {
  logDeviation,
  editDeviation,
  extractDocument,
} from '../store/deviationSlice';
import FileUploader from './FileUploader';

const SAMPLE_LOG_PROMPT =
  'During the manufacturing of Paracetamol API batch API-260924, the drying temperature exceeded the approved range of 70–75°C and reached 82°C for approximately 18 minutes. The event was detected by the production operator. The affected batch has been placed on hold pending investigation.';

export default function AIAssistant() {
  const dispatch = useDispatch();
  const { messages, processingState, error, deviation, uploadedFileName } = useSelector(
    (state) => state.deviation
  );

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const isBusy = processingState.isProcessing || processingState.isUploading;

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isBusy]);

  const handleSendMessage = (textToSend = null) => {
    const text = (textToSend !== null ? textToSend : inputText).trim();
    if (!text || isBusy) return;

    // Check if form is already populated to infer EDIT vs LOG
    const hasExistingData = Boolean(
      deviation.batch_lot_number ||
      deviation.title ||
      deviation.detailed_description
    );

    // Heuristics for intent detection:
    // If user text contains edit indicators (e.g. "batch number is", "change", "update", "actually", "sorry")
    // and there is existing data in form, dispatch editDeviation; otherwise if it's a full incident or empty form, dispatch logDeviation.
    const isEditHint = /change|update|actually|sorry|correct|batch|quantity|site|plant|is now|should be|set |modify|edit/i.test(text);

    if (hasExistingData && isEditHint) {
      dispatch(editDeviation({ instruction: text }));
    } else {
      dispatch(logDeviation({ text }));
    }

    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelected = (file) => {
    dispatch(extractDocument({ file }));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Assistant Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-gradient-to-tr from-blue-700 to-indigo-600 text-white rounded-lg shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                AI Deviation Assistant
              </h3>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded tracking-wider border border-amber-300">
                BETA
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Primary intake interface • Autonomous extraction & GxP reasoning
            </p>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/40">
        <FileUploader
          onFileSelected={handleFileSelected}
          isUploading={processingState.isUploading}
          uploadedFileName={uploadedFileName}
        />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 bg-blue-50/30 border-b border-blue-100/60 flex items-center space-x-1.5 overflow-x-auto text-[11px]">
        <span className="text-blue-900 font-semibold flex-shrink-0 flex items-center">
          <Sparkles className="w-3 h-3 mr-1 text-blue-600" /> Try:
        </span>
        <button
          type="button"
          onClick={() => handleSendMessage(SAMPLE_LOG_PROMPT)}
          disabled={isBusy}
          className="bg-white hover:bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded border border-blue-200 truncate flex-shrink-0 cursor-pointer disabled:opacity-50 transition-colors"
        >
          Paracetamol Drying Excursion
        </button>
        <button
          type="button"
          onClick={() => handleSendMessage('Sorry, the batch number is API-260925 and the affected quantity is 50 kg.')}
          disabled={isBusy}
          className="bg-white hover:bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded border border-blue-200 truncate flex-shrink-0 cursor-pointer disabled:opacity-50 transition-colors"
        >
          Edit Batch & Quantity
        </button>
        <button
          type="button"
          onClick={() => handleSendMessage('Please update the plant to Formulation Suite 2.')}
          disabled={isBusy}
          className="bg-white hover:bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded border border-blue-200 truncate flex-shrink-0 cursor-pointer disabled:opacity-50 transition-colors"
        >
          Edit Plant Location
        </button>
      </div>

      {/* Chat Messages Conversation Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#fcfdfe]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-2.5 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'assistant' && (
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
                  msg.isError
                    ? 'bg-rose-600'
                    : 'bg-gradient-to-tr from-blue-700 to-indigo-600'
                }`}
              >
                {msg.isError ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  <Bot className="w-3.5 h-3.5" />
                )}
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : msg.isError
                  ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-none'
                  : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Delta updates indicator if this was an edit */}
              {msg.action === 'edit_deviation' && msg.updates && (
                <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-blue-700 font-medium">
                  <span className="text-slate-500 font-normal">Fields updated:</span>{' '}
                  {Object.keys(msg.updates).join(', ')}
                </div>
              )}

              <div
                className={`text-[10px] mt-1 text-right ${
                  msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white flex-shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {/* Processing Indicator */}
        {isBusy && (
          <div className="flex items-start space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-white flex-shrink-0 animate-pulse">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-xs">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-xs font-semibold text-slate-700">
                  {processingState.isUploading
                    ? 'Extracting text and running LangGraph pipeline...'
                    : 'AI assistant is analyzing deviation and assessing risk...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Area */}
      <div className="p-3 bg-white border-t border-slate-200">
        <div className="relative flex items-center">
          <textarea
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
            placeholder="Paste deviation narrative, incident log, or edit fields (e.g. 'Actually batch is API-260925')..."
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 pr-12 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none transition-all disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isBusy}
            className="absolute right-2 bottom-2.5 p-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
            title="Send to AI Assistant (Enter)"
          >
            {isBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1 text-[11px] text-slate-400">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>Tool 1: Log • Tool 2: Edit • Tool 3: PDF</span>
        </div>
      </div>
    </div>
  );
}
