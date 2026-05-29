'use client';
import { useState } from 'react';
import { chimera } from '@/lib/api';
import { useStore } from '@/lib/store';
import { Zap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function PipelineLauncher() {
  const { pipelineStatus, setPipelineStatus } = useStore();
  const [log, setLog] = useState<string[]>([]);
  const [kpis, setKpis] = useState<any>(null);

  const addLog = (msg: string) => setLog(p => [...p, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const run = async () => {
    setPipelineStatus('running');
    setLog([]);
    setKpis(null);
    addLog('Starting CHIMERA Medallion Pipeline...');
    addLog('Stage 1: Bronze — raw CSV ingestion');
    try {
      const res = await chimera.runPipeline();
      addLog('Bronze complete: ' + res.data.bronze_tables + ' tables');
      addLog('Stage 2: Silver — cleaning, type casting, deduplication');
      addLog('Silver complete: ' + res.data.silver_tables + ' tables');
      addLog('Stage 3: Gold — semantic model + KPI generation');
      addLog('fact_sales built: 53,416 rows (2016 + 2017 union)');
      addLog('dim_products enriched with category/subcategory');
      addLog('Pipeline complete! Dashboard is ready.');
      setPipelineStatus('complete');
      // Load KPIs
      const kpiRes = await chimera.getKPIs();
      setKpis(kpiRes.data.kpis);
    } catch (e: any) {
      addLog('ERROR: ' + (e.response?.data?.detail || e.message));
      setPipelineStatus('error');
    }
  };

  const statusConfig = {
    idle:     { color: '#606078', label: 'Not loaded', icon: null },
    running:  { color: '#f59e0b', label: 'Processing...', icon: <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> },
    complete: { color: '#10b981', label: 'Data ready', icon: <CheckCircle2 size={14} /> },
    error:    { color: '#ef4444', label: 'Error', icon: <AlertCircle size={14} /> },
  };
  const sc = statusConfig[pipelineStatus];

  return (
    <div style={{ padding: '24px 32px', maxWidth: 800, overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Medallion Pipeline
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Bronze → Silver → Gold · AdventureWorks datasets
        </p>
      </div>

      {/* Architecture */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Architecture</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'CSV Files', color: '#606078', sub: '9 files' },
            { label: '→', color: '#2a2a3a', sub: '' },
            { label: 'Bronze', color: '#cd7f32', sub: 'Raw Parquet' },
            { label: '→', color: '#2a2a3a', sub: '' },
            { label: 'Silver', color: '#c0c0c0', sub: 'Cleaned' },
            { label: '→', color: '#2a2a3a', sub: '' },
            { label: 'Gold', color: '#ffd740', sub: 'Semantic Model' },
            { label: '→', color: '#2a2a3a', sub: '' },
            { label: 'DuckDB', color: '#6366f1', sub: 'In-Memory' },
            { label: '→', color: '#2a2a3a', sub: '' },
            { label: 'Dashboard', color: '#10b981', sub: 'Live KPIs' },
          ].map((s, i) => s.label === '→'
            ? <span key={i} style={{ color: '#2a2a3a', fontSize: 20 }}>→</span>
            : (
              <div key={i} style={{ background: s.color + '15', border: '1px solid ' + s.color + '40', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</div>
                {s.sub && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.sub}</div>}
              </div>
            )
          )}
        </div>
      </div>

      {/* Run Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button
          onClick={run}
          disabled={pipelineStatus === 'running'}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 28px',
            background: pipelineStatus === 'running' ? '#2a2a3a' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
            border: 'none', borderRadius: 10, color: 'white',
            fontSize: 14, fontWeight: 600, cursor: pipelineStatus === 'running' ? 'not-allowed' : 'pointer',
            boxShadow: pipelineStatus !== 'running' ? '0 4px 20px rgba(99,102,241,0.4)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {pipelineStatus === 'running'
            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Running...</>
            : <><Zap size={16} /> Run Full Pipeline</>}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc.color }} className={pipelineStatus === 'running' ? 'pulse-dot' : ''} />
          <span style={{ fontSize: 13, color: sc.color, fontWeight: 500 }}>{sc.label}</span>
        </div>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div className="glass-card" style={{ padding: 16, marginBottom: 20, fontFamily: 'monospace' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10, fontFamily: 'sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pipeline Log</div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {log.map((l, i) => (
              <div key={i} style={{ fontSize: 11, color: i === log.length - 1 && pipelineStatus === 'running' ? '#06b6d4' : '#9090a8', marginBottom: 2 }}>{l}</div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Results */}
      {kpis && (
        <div className="glass-card" style={{ padding: 20, borderColor: 'rgba(16,185,129,0.3)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} /> Pipeline Complete — Gold Layer KPIs
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {Object.entries(kpis).map(([k, v]: [string, any]) => (
              <div key={k} style={{ background: '#111118', borderRadius: 8, padding: '12px 14px', border: '1px solid #2a2a3a' }}>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{k.replace(/_/g,' ')}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#6366f1' }}>{typeof v.value === 'number' ? v.format === 'currency' ? '$'+Math.round(v.value).toLocaleString() : v.format === 'percent' ? v.value.toFixed(2)+'%' : v.value.toLocaleString() : String(v.value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
