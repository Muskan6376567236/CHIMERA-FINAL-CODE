'use client';
import { useEffect, useState } from 'react';
import { chimera, ChartData } from '@/lib/api';
import Chart from '@/components/Chart';
import { formatValue } from '@/lib/utils';

export default function RevenueTab() {
  const [monthly, setMonthly] = useState<ChartData[]>([]);
  const [yoy, setYoY] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      chimera.getRevenueByMonth(),
      chimera.getYoYComparison(),
    ]).then(([m, y]) => {
      setMonthly(m.data.data || []);
      setYoY(y.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const totalRevenue = monthly.reduce((s, d) => s + (d.revenue as number || 0), 0);
  const totalProfit  = monthly.reduce((s, d) => s + (d.profit  as number || 0), 0);

  return (
    <div style={{ padding: '24px 32px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Revenue Analysis
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Monthly trends · Year-over-Year · $18.5M total revenue
        </p>
      </div>

      {loading ? (
        <div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="shimmer" style={{ height: 300, borderRadius: 12, marginBottom: 16 }} />
          ))}
        </div>
      ) : (
        <>
          {/* Summary Bands */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Total Revenue', value: formatValue(totalRevenue, 'currency'), color: '#6366f1' },
              { label: 'Total Profit',  value: formatValue(totalProfit,  'currency'), color: '#10b981' },
              { label: 'Profit Margin', value: ((totalProfit / totalRevenue) * 100).toFixed(1) + '%', color: '#06b6d4' },
            ].map(s => (
              <div key={s.label} className="glass-card" style={{ padding: '14px 18px', borderLeft: '3px solid ' + s.color }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Monthly Revenue & Profit */}
          <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Monthly Revenue & Profit
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Jan 2016 – Dec 2017 · 18 months
              </div>
            </div>
            <Chart data={monthly} type="area" xKey="period" yKeys={['revenue', 'profit']} height={300} />
          </div>

          {/* YoY Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {yoy.map((y) => {
              const yr = y.year as number;
              const rev = y.revenue as number;
              const prof = y.profit as number;
              const margin = ((prof / rev) * 100).toFixed(1);
              return (
                <div key={yr} className="glass-card" style={{ padding: 24 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                    Year {yr}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>Revenue</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#6366f1' }}>{formatValue(rev, 'currency')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>Profit</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{formatValue(prof, 'currency')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>Orders</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>{(y.orders as number).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>Margin</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#06b6d4' }}>{margin}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Monthly Orders */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Monthly Orders Volume
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Order count 2016–2017</div>
            </div>
            <Chart data={monthly} type="bar" xKey="period" yKeys={['orders']} height={240} />
          </div>
        </>
      )}
    </div>
  );
}
