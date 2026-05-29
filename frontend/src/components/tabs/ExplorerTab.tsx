'use client';
import { useState } from 'react';
import { chimera } from '@/lib/api';
import { Play, Database, AlertCircle, Copy, Check } from 'lucide-react';

const EXAMPLE_QUERIES = [
  {
    label: 'Revenue by Year',
    sql: 'SELECT YEAR(orderdate) AS year, ROUND(SUM(revenue),2) AS revenue, ROUND(SUM(profit),2) AS profit, COUNT(DISTINCT ordernumber) AS orders FROM fact_sales GROUP BY 1 ORDER BY 1',
  },
  {
    label: 'Top 10 Products',
    sql: 'SELECT p.productname, p.categoryname, ROUND(SUM(s.revenue),2) AS revenue, SUM(s.orderquantity) AS units FROM fact_sales s LEFT JOIN dim_products p ON s.productkey=p.productkey GROUP BY 1,2 ORDER BY 3 DESC LIMIT 10',
  },
  {
    label: 'Revenue by Region',
    sql: 'SELECT t.region, t.country, ROUND(SUM(s.revenue),2) AS revenue, COUNT(DISTINCT s.ordernumber) AS orders FROM fact_sales s LEFT JOIN dim_territories t ON s.territorykey=t.salesterritorykey GROUP BY 1,2 ORDER BY 3 DESC',
  },
  {
    label: 'Monthly Returns',
    sql: "SELECT STRFTIME(returndate::DATE,'%Y-%m') AS month, SUM(returnquantity) AS returns FROM fact_returns GROUP BY 1 ORDER BY 1",
  },
  {
    label: 'Customer Segments',
    sql: 'SELECT c.occupation, COUNT(DISTINCT s.customerkey) AS customers, ROUND(SUM(s.revenue),2) AS revenue FROM fact_sales s LEFT JOIN dim_customers c ON s.customerkey=c.customerkey GROUP BY 1 ORDER BY 3 DESC',
  },
  {
    label: 'Product Category Breakdown',
    sql: 'SELECT p.categoryname, p.subcategoryname, ROUND(SUM(s.revenue),2) AS revenue, ROUND(AVG(p.productprice),2) AS avg_price FROM fact_sales s LEFT JOIN dim_products p ON s.productkey=p.productkey GROUP BY 1,2 ORDER BY 3 DESC',
  },
];

export default function ExplorerTab() {
  const [sql, setSQL] = useState(EXAMPLE_QUERIES[0].sql);
  const [results, setResults] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    if (!sql.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const res = await chimera.runSQL(sql);
      setResults(res.data.rows || []);
      setColumns(res.data.columns || []);
      setRowCount(res.data.row_count || 0);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: '24px 32px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          SQL Explorer
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          DuckDB SQL · Gold layer: fact_sales, fact_returns, dim_customers, dim_products, dim_territories
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        {/* Sidebar */}
        <div>
          <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Database size={12} style={{ display: 'inline', marginRight: 4 }} />
              Gold Tables
            </div>
            {['fact_sales','fact_returns','dim_customers','dim_products','dim_territories'].map(t => (
              <div key={t} onClick={() => setSQL(`SELECT * FROM ${t} LIMIT 100`)}
                style={{ padding: '6px 10px', marginBottom: 4, borderRadius: 6, cursor: 'pointer', fontFamily: 'monospace', fontSize: 11, color: '#6366f1', background: 'rgba(99,102,241,0.08)', transition: 'all 0.15s' }}>
                {t}
              </div>
            ))}
          </div>
          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sample Queries
            </div>
            {EXAMPLE_QUERIES.map(q => (
              <button key={q.label} onClick={() => setSQL(q.sql)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', marginBottom: 4, borderRadius: 6, cursor: 'pointer', fontSize: 11, color: 'var(--text-secondary)', background: 'transparent', border: 'none', transition: 'all 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Editor + Results */}
        <div>
          <div className="glass-card" style={{ marginBottom: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>DuckDB SQL Editor · Ctrl+Enter to run</span>
              <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={run} disabled={loading}
                style={{ padding: '6px 14px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: 6, color: 'white', fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: loading ? 0.6 : 1 }}>
                <Play size={12} /> {loading ? 'Running...' : 'Run Query'}
              </button>
            </div>
            <textarea
              value={sql}
              onChange={e => setSQL(e.target.value)}
              onKeyDown={e => e.ctrlKey && e.key === 'Enter' && run()}
              style={{ width: '100%', minHeight: 140, background: '#0d0d16', color: '#e0e0f0', fontFamily: 'monospace', fontSize: 12, padding: '14px 16px', border: 'none', outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
              spellCheck={false}
            />
          </div>

          {error && (
            <div className="glass-card" style={{ padding: 14, marginBottom: 12, borderColor: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={16} color="#ef4444" />
              <span style={{ fontSize: 12, color: '#ef4444', fontFamily: 'monospace' }}>{error}</span>
            </div>
          )}

          {results.length > 0 && (
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Results</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{rowCount.toLocaleString()} rows</span>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {columns.map(c => (
                        <th key={c} style={{ padding: '8px 14px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', background: '#111118', position: 'sticky', top: 0 }}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(42,42,58,0.5)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#16161f')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        {columns.map(c => (
                          <td key={c} style={{ padding: '8px 14px', color: 'var(--text-primary)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            {row[c] === null ? <span style={{ color: 'var(--text-muted)' }}>null</span> : String(row[c])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
