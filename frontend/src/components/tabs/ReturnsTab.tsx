'use client';
import { useEffect, useState } from 'react';
import { chimera, ChartData } from '@/lib/api';
import Chart from '@/components/Chart';

export default function ReturnsTab() {
  const [byMonth, setByMonth] = useState<ChartData[]>([]);
  const [byRegion, setByRegion] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([chimera.getReturnsByMonth(), chimera.getReturnsByRegion()])
      .then(([m, r]) => {
        setByMonth(m.data.data || []);
        setByRegion(r.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalReturns = byMonth.reduce((s, d) => s + (d.returns as number || 0), 0);

  return (
    <div style={{ padding: '24px 32px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Returns Analysis
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Return quantity trends · {totalReturns.toLocaleString()} total returns
        </p>
      </div>

      {loading ? (
        <div>{[...Array(2)].map((_, i) => (
          <div key={i} className="shimmer" style={{ height: 300, borderRadius: 12, marginBottom: 16 }} />
        ))}</div>
      ) : (
        <>
          <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Monthly Returns Volume</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>2015–2017</div>
            </div>
            <Chart data={byMonth} type="bar" xKey="month" yKeys={["returns"]} height={260} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Returns by Region & Category</div>
              </div>
              <Chart data={byRegion.slice(0, 10)} type="bar" xKey="region" yKeys={["total_returns"]} height={220} />
            </div>

            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Top Return Regions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {byRegion.slice(0, 8).map((r, i) => {
                  const max = byRegion[0]?.total_returns as number || 1;
                  const pct = ((r.total_returns as number) / max) * 100;
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{r.region} · {r.category}</span>
                        <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{r.total_returns}</span>
                      </div>
                      <div style={{ height: 4, background: '#2a2a3a', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: pct + '%', background: '#ef4444', borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
