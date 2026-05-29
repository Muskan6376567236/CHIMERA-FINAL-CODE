'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { chimera } from '@/lib/api';
import { useStore } from '@/lib/store';
import {
  Upload, FileText, X, CheckCircle2, AlertCircle,
  Loader2, Zap, Trash2, RefreshCw, Database
} from 'lucide-react';

interface FileItem {
  file: File;
  status: 'pending' | 'done' | 'error';
}

interface ServerFile {
  filename: string;
  size_kb: number;
}

export default function UploadTab() {
  const { setPipelineStatus } = useStore();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [serverFiles, setServerFiles] = useState<ServerFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pipelining, setPipelining] = useState(false);
  const [uploadResult, setUploadResult] = useState<string>('');
  const [pipelineResult, setPipelineResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) =>
    setLog(p => [...p, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  useEffect(() => {
    chimera.listFiles().then(r => setServerFiles(r.data.files || [])).catch(() => {});
  }, []);

  const addFiles = (incoming: File[]) => {
    const csvs = incoming.filter(f => f.name.toLowerCase().endsWith('.csv'));
    const nonCsv = incoming.filter(f => !f.name.toLowerCase().endsWith('.csv'));
    if (nonCsv.length) setError(`Skipped ${nonCsv.length} non-CSV file(s): ${nonCsv.map(f => f.name).join(', ')}`);
    else setError('');
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.file.name));
      const newOnes = csvs.filter(f => !existingNames.has(f.name)).map(f => ({ file: f, status: 'pending' as const }));
      return [...prev, ...newOnes];
    });
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const removeFile = (name: string) =>
    setFiles(p => p.filter(f => f.file.name !== name));

  const upload = async () => {
    if (!files.length) return;
    setUploading(true);
    setError('');
    setUploadResult('');
    setLog([]);
    addLog(`Uploading ${files.length} CSV file(s)...`);

    const form = new FormData();
    files.forEach(f => form.append('files', f.file));

    try {
      const res = await chimera.uploadCSVs(form);
      setUploadResult(res.data.message);
      setFiles(prev => prev.map(f => ({ ...f, status: 'done' })));
      const saved: ServerFile[] = res.data.files || [];
      setServerFiles(saved);
      addLog(`Upload complete: ${saved.map((f: ServerFile) => f.filename).join(', ')}`);
      addLog('Ready to run pipeline.');
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || 'Upload failed';
      setError(msg);
      addLog('ERROR: ' + msg);
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
    } finally {
      setUploading(false);
    }
  };

  const runPipeline = async () => {
    if (!serverFiles.length) {
      setError('Upload files first.');
      return;
    }
    setPipelining(true);
    setPipelineResult(null);
    setError('');
    addLog('Starting Medallion Pipeline on uploaded data...');
    addLog('Stage 1: Bronze — raw CSV ingestion');
    try {
      const res = await chimera.runPipeline();
      addLog(`Bronze: ${res.data.bronze_tables} tables ingested`);
      addLog('Stage 2: Silver — cleaning, type casting');
      addLog(`Silver: ${res.data.silver_tables} tables cleaned`);
      addLog('Stage 3: Gold — semantic model + KPIs');
      addLog('Pipeline complete! Dashboard ready.');
      setPipelineResult(res.data);
      setPipelineStatus('complete');
      // Load KPIs to show summary
      const kpiRes = await chimera.getKPIs();
      setPipelineResult((p: any) => ({ ...p, kpis: kpiRes.data.kpis }));
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || 'Pipeline failed';
      setError(msg);
      addLog('ERROR: ' + msg);
    } finally {
      setPipelining(false);
    }
  };

  const clearAll = async () => {
    try {
      await chimera.clearFiles();
      setFiles([]);
      setServerFiles([]);
      setPipelineResult(null);
      setUploadResult('');
      setLog([]);
      setError('');
      setPipelineStatus('idle');
      addLog('All files and medallion layers cleared.');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Clear failed');
    }
  };

  const formatBytes = (kb: number) =>
    kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb.toFixed(0) + ' KB';

  const step = serverFiles.length > 0 ? (pipelineResult ? 3 : 2) : (files.length > 0 ? 1 : 0);

  return (
    <div style={{ padding: '24px 32px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Upload Your Data
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Upload any CSV files · CHIMERA auto-detects schema, relationships, and builds dashboards
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
        {[
          { n: 1, label: 'Select CSVs' },
          { n: 2, label: 'Upload' },
          { n: 3, label: 'Run Pipeline' },
          { n: 4, label: 'View Dashboard' },
        ].map(({ n, label }, i, arr) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                background: step >= n ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#2a2a3a',
                color: step >= n ? 'white' : '#606078',
                transition: 'all 0.3s',
              }}>
                {step > n ? <CheckCircle2 size={14} /> : n}
              </div>
              <span style={{ fontSize: 12, color: step >= n ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: step === n ? 600 : 400 }}>
                {label}
              </span>
            </div>
            {i < arr.length - 1 && (
              <div style={{ width: 32, height: 1, background: step > n ? '#6366f1' : '#2a2a3a', transition: 'all 0.3s' }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Left: Drop zone + file list */}
        <div>
          {/* Drop Zone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#6366f1' : '#2a2a3a'}`,
              borderRadius: 16,
              padding: '40px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'rgba(99,102,241,0.05)' : '#111118',
              transition: 'all 0.2s',
              marginBottom: 16,
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              multiple
              style={{ display: 'none' }}
              onChange={e => addFiles(Array.from(e.target.files || []))}
            />
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
              background: dragging ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.08)',
              border: `1px solid ${dragging ? '#6366f1' : 'rgba(99,102,241,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}>
              <Upload size={24} color={dragging ? '#6366f1' : '#606078'} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              {dragging ? 'Drop files here' : 'Drag & drop CSV files'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              or click to browse · Multiple files supported · CSV only
            </div>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Selected Files ({files.length})
                </span>
                <button onClick={() => setFiles([])}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11 }}>
                  Clear all
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {files.map(({ file, status }) => (
                  <div key={file.name} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8,
                    background: status === 'done' ? 'rgba(16,185,129,0.06)' : status === 'error' ? 'rgba(239,68,68,0.06)' : '#16161f',
                    border: `1px solid ${status === 'done' ? 'rgba(16,185,129,0.2)' : status === 'error' ? 'rgba(239,68,68,0.2)' : '#2a2a3a'}`,
                  }}>
                    <FileText size={14} color={status === 'done' ? '#10b981' : status === 'error' ? '#ef4444' : '#6366f1'} />
                    <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{file.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatBytes(file.size / 1024)}</span>
                    {status === 'done' && <CheckCircle2 size={14} color="#10b981" />}
                    {status === 'error' && <AlertCircle size={14} color="#ef4444" />}
                    {status === 'pending' && (
                      <button onClick={e => { e.stopPropagation(); removeFile(file.name); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', marginBottom: 16 }}>
              <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={upload} disabled={!files.length || uploading || pipelining}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 20px', borderRadius: 10, border: 'none', cursor: (!files.length || uploading) ? 'not-allowed' : 'pointer',
                background: !files.length || uploading ? '#2a2a3a' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: 'white', fontSize: 13, fontWeight: 600, opacity: (!files.length || uploading) ? 0.5 : 1,
                transition: 'all 0.2s',
              }}>
              {uploading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={15} />}
              {uploading ? 'Uploading...' : 'Upload Files'}
            </button>

            <button onClick={runPipeline} disabled={!serverFiles.length || pipelining || uploading}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 20px', borderRadius: 10, border: 'none',
                cursor: (!serverFiles.length || pipelining) ? 'not-allowed' : 'pointer',
                background: !serverFiles.length || pipelining ? '#2a2a3a' : 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', fontSize: 13, fontWeight: 600, opacity: (!serverFiles.length || pipelining) ? 0.5 : 1,
                transition: 'all 0.2s',
              }}>
              {pipelining ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={15} />}
              {pipelining ? 'Building...' : 'Run Pipeline'}
            </button>

            <button onClick={clearAll} disabled={uploading || pipelining}
              style={{
                padding: '12px 16px', borderRadius: 10, border: '1px solid #2a2a3a',
                background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                transition: 'all 0.15s',
              }}
              title="Clear all files">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Currently on server */}
          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Database size={14} color="#6366f1" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                Files on Server ({serverFiles.length})
              </span>
              <button onClick={() => chimera.listFiles().then(r => setServerFiles(r.data.files || []))}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <RefreshCw size={12} />
              </button>
            </div>
            {serverFiles.length === 0 ? (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>No files uploaded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {serverFiles.map(f => (
                  <div key={f.filename} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 6, background: '#111118' }}>
                    <span style={{ fontSize: 11, color: '#6366f1', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.filename}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>{formatBytes(f.size_kb)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Log */}
          {log.length > 0 && (
            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Log
              </div>
              <div style={{ fontFamily: 'monospace', maxHeight: 180, overflowY: 'auto' }}>
                {log.map((l, i) => (
                  <div key={i} style={{ fontSize: 10, color: i === log.length - 1 && pipelining ? '#06b6d4' : '#9090a8', marginBottom: 3, lineHeight: 1.5 }}>
                    {l}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pipeline result KPIs */}
          {pipelineResult?.kpis && (
            <div className="glass-card" style={{ padding: 16, borderColor: 'rgba(16,185,129,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <CheckCircle2 size={14} color="#10b981" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>Pipeline Complete</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(pipelineResult.kpis).map(([k, v]: [string, any]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 6, background: '#111118' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {k.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>
                      {typeof v.value === 'number'
                        ? v.format === 'currency' ? '$' + Math.round(v.value).toLocaleString()
                        : v.format === 'percent' ? v.value.toFixed(2) + '%'
                        : v.value.toLocaleString()
                        : String(v.value)}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { const s = document.querySelector('[data-tab="overview"]'); }}
                style={{ marginTop: 12, width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                View Dashboard →
              </button>
            </div>
          )}

          {/* Tips */}
          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tips</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Upload multiple CSVs at once',
                'CHIMERA auto-detects joins and keys',
                'Date columns are parsed automatically',
                'Money columns ($ prefix) are cleaned',
                'Duplicates are removed in Silver layer',
                'Works with any business CSV data',
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: 6 }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
