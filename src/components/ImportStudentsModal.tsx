import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Layers,
  ArrowRight,
  RefreshCw,
  Terminal
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { BatchFetchProgress } from '../types';

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    insertedCount: number;
    errorsCount: number;
    errors: { row: number; identifier: string; error: string }[];
  } | null>(null);
  const [batchProgress, setBatchProgress] = useState<BatchFetchProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll background batch fetch progress when import finishes
  useEffect(() => {
    let timer: any = null;
    const pollProgress = async () => {
      try {
        const p = await api.getBatchProgress();
        setBatchProgress(p);
        if (p.is_running) {
          onImportComplete();
        }
      } catch (err) {
        // ignore
      }
    };

    if (isOpen && importResult && importResult.insertedCount > 0) {
      pollProgress();
      timer = setInterval(pollProgress, 1200);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, importResult]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      processFile(dropped);
    }
  };

  const processFile = (f: File) => {
    setFile(f);
    setParseError('');
    setImportResult(null);
    setBatchProgress(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let rows: any[] = [];
        if (f.name.endsWith('.csv')) {
          const wb = XLSX.read(data, { type: 'binary' });
          const firstSheet = wb.SheetNames[0];
          rows = XLSX.utils.sheet_to_json(wb.Sheets[firstSheet], { raw: false, defval: '' });
        } else {
          const wb = XLSX.read(data, { type: 'array' });
          const firstSheet = wb.SheetNames[0];
          rows = XLSX.utils.sheet_to_json(wb.Sheets[firstSheet], { raw: false, defval: '' });
        }

        if (rows.length === 0) {
          setParseError('The uploaded file does not contain any data rows.');
          setPreviewRows([]);
          return;
        }

        setPreviewRows(rows);
      } catch (err: any) {
        setParseError(`Failed to parse file: ${err.message || 'Invalid format'}`);
        setPreviewRows([]);
      }
    };

    if (f.name.endsWith('.csv')) {
      reader.readAsBinaryString(f);
    } else {
      reader.readAsArrayBuffer(f);
    }
  };

  const handleUploadSubmit = async () => {
    if (previewRows.length === 0) return;
    try {
      setImporting(true);
      const res = await api.importStudents(previewRows);
      setImportResult(res);
      if (res.insertedCount > 0 || (res.updatedCount || 0) > 0) {
        onImportComplete();
      }
    } catch (err: any) {
      setParseError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const pct = batchProgress && batchProgress.total > 0 
    ? Math.round((batchProgress.processed / batchProgress.total) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Bulk Import Students
              </h2>
              <p className="text-xs text-slate-500">
                Upload student rosters via Excel (.xlsx) or CSV format
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Template Download & Instructions banner */}
          {!importResult && (
            <div className="p-4 rounded-lg bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-semibold text-blue-900">Need the department format?</div>
                <div className="text-slate-600 text-[11px] mt-0.5">
                  Download the sample Excel template with columns for Register No, Name, Section, Year, and LeetCode Username.
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <a
                  href="/api/students/template?format=xlsx"
                  download
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel Template</span>
                </a>
                <a
                  href="/api/students/template?format=csv"
                  download
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                >
                  <span>CSV</span>
                </a>
              </div>
            </div>
          )}

          {/* Drag and Drop Zone */}
          {!importResult && (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/30 transition-all"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 mx-auto text-blue-600 mb-2" />
              <div className="text-sm font-semibold text-slate-800">
                {file ? file.name : 'Click to select or drag and drop roster file'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
              </div>
            </div>
          )}

          {parseError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Import Result Notification */}
          {importResult && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border text-xs space-y-2 ${
                (importResult.insertedCount > 0 || (importResult.updatedCount || 0) > 0)
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>
                    Roster Import Completed: {importResult.insertedCount} new student(s) added, {importResult.updatedCount || 0} existing student record(s) updated.
                  </span>
                </div>
                {importResult.errorsCount > 0 && (
                  <div className="text-slate-700 space-y-1 pt-1 border-t border-slate-200">
                    <div className="font-semibold text-amber-800">
                      {importResult.errorsCount} rows skipped due to invalid data:
                    </div>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 max-h-24 overflow-y-auto space-y-0.5">
                      {importResult.errors.map((err, i) => (
                        <li key={i}>
                          Row {err.row} ({err.identifier}): {err.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Automatic Profile Fetch Status Widget */}
              {batchProgress && (batchProgress.is_running || batchProgress.processed > 0) && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className={`w-4 h-4 text-blue-600 ${batchProgress.is_running ? 'animate-spin' : ''}`} />
                      <span className="text-xs font-bold text-slate-800">
                        {batchProgress.is_running 
                          ? '⚡ Automatically Fetching LeetCode Profile Statistics...' 
                          : '✓ Profile Statistics Fetch Complete!'}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-blue-600">{pct}%</span>
                  </div>

                  {/* Progress track */}
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        batchProgress.is_running ? 'bg-blue-600' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-md bg-white border border-slate-200">
                      <div className="text-slate-400 text-[10px] uppercase font-medium">Fetched</div>
                      <div className="font-mono font-bold text-slate-800">{batchProgress.processed} / {batchProgress.total}</div>
                    </div>
                    <div className="p-2 rounded-md bg-white border border-slate-200">
                      <div className="text-emerald-600 text-[10px] uppercase font-medium">Successful</div>
                      <div className="font-mono font-bold text-emerald-700">{batchProgress.successful}</div>
                    </div>
                    <div className="p-2 rounded-md bg-white border border-slate-200">
                      <div className="text-amber-600 text-[10px] uppercase font-medium">Failed</div>
                      <div className="font-mono font-bold text-amber-700">{batchProgress.failed}</div>
                    </div>
                  </div>

                  {batchProgress.current_student && (
                    <div className="text-xs text-blue-700 font-mono flex items-center space-x-1.5 truncate pt-1">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping shrink-0" />
                      <span>Fetching profile details for: {batchProgress.current_student}</span>
                    </div>
                  )}

                  {/* Console Log Feed */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-semibold">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Live Sync Activity</span>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-2.5 max-h-32 overflow-y-auto font-mono text-[11px] space-y-0.5 text-slate-300">
                      {batchProgress.logs.slice().reverse().slice(0, 10).map((log, i) => (
                        <div key={i} className={log.type === 'success' ? 'text-emerald-400' : log.type === 'warn' ? 'text-amber-400' : 'text-slate-300'}>
                          <span className="text-slate-500 mr-1.5">[{log.timestamp.split('T')[1]?.split('.')[0] || 'LOG'}]</span>
                          {log.message}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Parsed Preview Table */}
          {previewRows.length > 0 && !importResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                <span>Roster Preview ({previewRows.length} students detected)</span>
                <span className="text-[11px] text-slate-500">Ready for validation</span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-48 shadow-2xs">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Register No</th>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3">Section</th>
                      <th className="py-2 px-3">Year</th>
                      <th className="py-2 px-3">LeetCode Username</th>
                      <th className="py-2 px-3">Mentor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {previewRows.slice(0, 8).map((r, i) => {
                      const getVal = (keys: string[]) => {
                        for (const k of keys) {
                          if (r[k] !== undefined && r[k] !== null && r[k] !== '') return r[k].toString().trim();
                        }
                        for (const actualKey of Object.keys(r)) {
                          const clean = actualKey.toLowerCase().replace(/[^a-z0-9]/g, '');
                          for (const target of keys) {
                            const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
                            if (clean.includes(cleanTarget) && r[actualKey]) return r[actualKey].toString().trim();
                          }
                        }
                        return '';
                      };

                      const regNo = getVal(['register_no', 'register number', 'regno', 'reg']);
                      const name = getVal(['student_name', 'student name', 'name', 'student']);
                      const sec = getVal(['section', 'class', 'sec']) || 'Section A';
                      const yr = getVal(['year', 'yr']) || 'II Year';
                      const uname = getVal(['username', 'leetcode', 'user']);
                      const mentor = getVal(['mentor']);

                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 text-slate-800 font-bold">{regNo || '—'}</td>
                          <td className="py-1.5 px-3 text-slate-800 font-sans">{name || '—'}</td>
                          <td className="py-1.5 px-3">{sec}</td>
                          <td className="py-1.5 px-3">{yr}</td>
                          <td className="py-1.5 px-3 text-blue-600">{uname && !uname.startsWith('pending_') ? `@${uname}` : '—'}</td>
                          <td className="py-1.5 px-3 text-slate-500 font-sans">{mentor || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {previewRows.length > 8 && (
                <div className="text-[11px] text-slate-500 text-right italic">
                  + {previewRows.length - 8} more students in file
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer transition-colors"
          >
            {importResult ? 'Close' : 'Cancel'}
          </button>

          {!importResult && previewRows.length > 0 && (
            <button
              onClick={handleUploadSubmit}
              disabled={importing}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors disabled:opacity-50 shadow-2xs"
            >
              <span>{importing ? 'Validating & Importing...' : `Import ${previewRows.length} Students`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
