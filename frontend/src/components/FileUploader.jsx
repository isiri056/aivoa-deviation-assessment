import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

const MAX_SIZE_MB = 10;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTS = ['.pdf', '.txt'];

export default function FileUploader({ onFileSelected, isUploading, uploadedFileName }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  const validateAndProcessFile = (file) => {
    setValidationError('');
    if (!file) return;

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setValidationError(`Invalid file type "${ext}". Only PDF and TXT documents are supported.`);
      return;
    }

    if (file.size > MAX_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setValidationError(`File is too large (${sizeMB}MB). Maximum allowed size is ${MAX_SIZE_MB}MB.`);
      return;
    }

    onFileSelected(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleClickBrowse = () => {
    if (fileInputRef.current && !isUploading) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            validateAndProcessFile(e.target.files[0]);
          }
        }}
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClickBrowse}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
            : 'border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
        } ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          {isUploading ? (
            <div className="flex flex-col items-center space-y-1.5 py-1">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <p className="text-xs font-semibold text-blue-700">
                Parsing document & running LangGraph extraction...
              </p>
            </div>
          ) : (
            <>
              <div className="p-2 bg-blue-100/60 text-blue-700 rounded-full">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  <span className="text-blue-700 hover:underline">Click to upload</span> or drag and drop
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pharmaceutical Incident Reports (PDF or TXT, max 10MB)
                </p>
              </div>
            </>
          )}

          {uploadedFileName && !validationError && !isUploading && (
            <div
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-blue-50 text-blue-800 rounded-md text-xs font-medium border border-blue-200 mt-1"
              style={{ textDecoration: 'none' }}
            >
              <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span
                className="truncate max-w-[200px] no-underline"
                style={{ textDecoration: 'none', textDecorationLine: 'none' }}
              >
                {uploadedFileName}
              </span>
              <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
            </div>
          )}
        </div>
      </div>

      {validationError && (
        <div className="flex items-center space-x-1.5 mt-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
