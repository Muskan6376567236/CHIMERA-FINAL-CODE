'use client';
import { useEffect, useState } from 'react';
import { chimera, ChartData } from '@/lib/api';
import Chart from '@/components/Chart';
import { formatValue } from '@/lib/utils';

export default function CustomersTab() {
  const [topCustomers, setTopCustomers] = useState<ChartData[]>([]);
  const [segments, setSegments] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      chimera.getTopCustomers(10),
      chimera.getCustomerSegments(),
    ]).then(([c, s]) => {
      setTopCustomers(c.data.data || []);
      setSegments(s.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '24px 32px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Customer Intelligence
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Top customers, segments, and revenue distribution
        </p>
      </div>

      {loading ? (
        <div>{[...Array(2)].map((_, i) => (
          <div key={i} className="shimmer" style={{ height: 300, borderRadius: 12, marginBottom: 16 }} />
        ))}</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Revenue by Customer Segment
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>By occupation</div>
              </div>
              <Chart
                data={segments}
                type="pie"
                xKey="occupation"
                yKeys={['revenue']}
                height={280}
              />
            </div>
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Segment Revenue Comparison
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Revenue vs customer count</div>
              </div>
              <Chart
                data={segments}
                type="bar"
                xKey="occupation"
                yKeys={['revenue', 'customers']}
                height={280}
              />
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>
              Top 10 Customers by Revenue
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a2a3a' }}>
                  {['Rank', 'Customer', 'Orders', 'Revenue', 'Profit'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#606078', fontWeight: 500, fontSize: 11 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1e1e2a' }}>
                    <td style={{ padding: '9px 12px', color: '#606078' }}>#{i + 1}</td>
                    <td style={{ padding: '9px 12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {c.customer_name}
                    </td>
                    <td style={{ padding: '9px 12px', color: 'var(--text-secondary)' }}>
                      {c.orders}
                    </td>
                    <td style={{ padding: '9px 12px', color: '#6366f1', fontWeight: 600 }}>
                      {formatValue(c.revenue as number, 'currency')}
                    </td>
                    <td style={{ padding: '9px 12px', color: '#10b981', fontWeight: 600 }}>
                      {formatValue(c.profit as number, 'currency')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
