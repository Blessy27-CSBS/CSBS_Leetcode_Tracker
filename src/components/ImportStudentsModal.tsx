import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Layers,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let rows: any[] = [];
        if (f.name.endsWith('.csv')) {
          const wb = XLSX.read(data, { type: 'binary' });
          const firstSheet = wb.SheetNames[0];
          rows = XLSX.utils.sheet_to_json(wb.Sheets[firstSheet]);
        } else {
          const wb = XLSX.read(data, { type: 'array' });
          const firstSheet = wb.SheetNames[0];
          rows = XLSX.utils.sheet_to_json(wb.Sheets[firstSheet]);
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
      if (res.insertedCount > 0) {
        onImportComplete();
      }
    } catch (err: any) {
      setParseError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

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

          {/* Drag and Drop Zone */}
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

          {parseError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Import Result Notification */}
          {importResult && (
            <div className={`p-4 rounded-lg border text-xs space-y-2 ${
              importResult.insertedCount > 0 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <div className="flex items-center space-x-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Import Completed: {importResult.insertedCount} students inserted.</span>
              </div>
              {importResult.errorsCount > 0 && (
                <div className="text-slate-700 space-y-1 pt-1 border-t border-slate-200">
                  <div className="font-semibold text-amber-800">
                    {importResult.errorsCount} rows skipped due to duplicate or invalid data:
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
                    {previewRows.slice(0, 8).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 text-slate-800 font-bold">{r.register_no || r['Register Number'] || r['Register No'] || '—'}</td>
                        <td className="py-1.5 px-3 text-slate-800 font-sans">{r.student_name || r['Student Name'] || r.name || '—'}</td>
                        <td className="py-1.5 px-3">{r.section || r['Section'] || 'A'}</td>
                        <td className="py-1.5 px-3">{r.year || r['Year'] || 'II'}</td>
                        <td className="py-1.5 px-3 text-blue-600">@{r.username || r['LeetCode Username'] || r['Username'] || '—'}</td>
                        <td className="py-1.5 px-3 text-slate-500 font-sans">{r.mentor || r['Mentor'] || '—'}</td>
                      </tr>
                    ))}
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
