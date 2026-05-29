'use client';
import { useEffect, useState } from 'react';
import { chimera } from '@/lib/api';

const SCHEMA = {
  facts: [
    { name: 'fact_sales', rows: 53416, color: '#6366f1', keys: ['productkey','customerkey','territorykey'], measures: ['orderquantity','revenue','profit','cost'] },
    { name: 'fact_returns', rows: 1809, color: '#ef4444', keys: ['productkey','territorykey'], measures: ['returnquantity'] },
  ],
  dims: [
    { name: 'dim_products', rows: 293, color: '#10b981', key: 'productkey', attrs: ['productname','categoryname','subcategoryname','productprice','productcost'] },
    { name: 'dim_customers', rows: 18148, color: '#06b6d4', key: 'customerkey', attrs: ['firstname','lastname','occupation','annualincome','education'] },
    { name: 'dim_territories', rows: 10, color: '#f59e0b', key: 'salesterritorykey / territorykey', attrs: ['region','country','continent'] },
  ],
  relationships: [
    { from: 'fact_sales', fromKey: 'productkey', to: 'dim_products', toKey: 'productkey', type: 'Many-to-One' },
    { from: 'fact_sales', fromKey: 'customerkey', to: 'dim_customers', toKey: 'customerkey', type: 'Many-to-One' },
    { from: 'fact_sales', fromKey: 'territorykey', to: 'dim_territories', toKey: 'salesterritorykey', type: 'Many-to-One' },
    { from: 'fact_returns', fromKey: 'productkey', to: 'dim_products', toKey: 'productkey', type: 'Many-to-One' },
    { from: 'fact_returns', fromKey: 'territorykey', to: 'dim_territories', toKey: 'salesterritorykey', type: 'Many-to-One' },
  ],
};

export default function RelationshipsTab() {
  const [tables, setTables] = useState<string[]>([]);

  useEffect(() => {
    chimera.getTables().then(r => setTables(r.data.tables || [])).catch(() => {});
  }, []);

  return (
    <div style={{ padding: '24px 32px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Semantic Data Model
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Star Schema · Auto-built by Medallion Gold Layer · DuckDB
        </p>
      </div>

      {/* Star Schema Diagram */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>
          Star Schema Overview
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40, overflowX: 'auto' }}>
          {/* Dims left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {SCHEMA.dims.map(d => (
              <div key={d.name} style={{ background: `${d.color}12`, border: `1px solid ${d.color}40`, borderRadius: 8, padding: '10px 14px', minWidth: 180 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: d.color, marginBottom: 4 }}>{d.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{d.rows.toLocaleString()} rows · KEY: {d.key}</div>
              </div>
            ))}
          </div>

          {/* Arrow */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: 22 }}>
            ←→
          </div>

          {/* Facts center */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {SCHEMA.facts.map(f => (
              <div key={f.name} style={{ background: `${f.color}15`, border: `2px solid ${f.color}60`, borderRadius: 10, padding: '14px 18px', minWidth: 220 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: f.color, marginBottom: 6 }}>⚡ {f.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 8 }}>{f.rows.toLocaleString()} rows</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  <div style={{ marginBottom: 2, color: '#f59e0b' }}>Keys: {f.keys.join(', ')}</div>
                  <div>Measures: {f.measures.join(', ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Relationships Table */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
          Relationships ({SCHEMA.relationships.length})
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['Fact Table', 'Foreign Key', '', 'Dimension', 'Primary Key', 'Type'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SCHEMA.relationships.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(42,42,58,0.5)' }}>
                <td style={{ padding: '10px 12px', color: '#6366f1', fontFamily: 'monospace', fontWeight: 600 }}>{r.from}</td>
                <td style={{ padding: '10px 12px', color: '#f59e0b', fontFamily: 'monospace' }}>{r.fromKey}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: 16 }}>→</td>
                <td style={{ padding: '10px 12px', color: '#10b981', fontFamily: 'monospace', fontWeight: 600 }}>{r.to}</td>
                <td style={{ padding: '10px 12px', color: '#f59e0b', fontFamily: 'monospace' }}>{r.toKey}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{r.type}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dimension Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {SCHEMA.dims.map(d => (
          <div key={d.name} className="glass-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: d.color, marginBottom: 8 }}>{d.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 10 }}>{d.rows.toLocaleString()} rows</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {d.attrs.map(a => (
                <span key={a} style={{ background: `${d.color}12`, color: d.color, padding: '2px 7px', borderRadius: 4, fontSize: 10 }}>{a}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
