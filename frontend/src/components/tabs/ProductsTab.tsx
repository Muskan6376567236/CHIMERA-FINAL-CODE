'use client';
import { useEffect, useState } from 'react';
import { chimera, ChartData } from '@/lib/api';
import Chart from '@/components/Chart';
import { formatValue } from '@/lib/utils';

export default function ProductsTab() {
  const [products, setProducts] = useState<ChartData[]>([]);
  const [category, setCategory] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      chimera.getTopProducts(10),
      chimera.getRevenueByCategory(),
    ]).then(([p, c]) => {
      setProducts(p.data.data || []);
      setCategory(c.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const truncate = (str: string, n = 24) =>
    str?.length > n ? str.slice(0, n) + '…' : str;

  const chartData = products.map(p => ({
    ...p,
    product_name: truncate(p.product_name as string),
  }));

  return (
    <div style={{ padding: '24px 32px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Product Performance
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Top products by revenue and category breakdown
        </p>
      </div>

      {loading ? (
        <div>{[...Array(2)].map((_, i) => (
          <div key={i} className="shimmer" style={{ height: 300, borderRadius: 12, marginBottom: 16 }} />
        ))}</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Top 10 Products by Revenue
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Revenue & Profit</div>
              </div>
              <Chart
                data={chartData}
                type="bar"
                xKey="product_name"
                yKeys={['revenue', 'profit']}
                height={280}
              />
            </div>
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Revenue by Category
                </div>
              </div>
              <Chart
                data={category}
                type="pie"
                xKey="category"
                yKeys={['revenue']}
                height={280}
              />
            </div>
          </div>

          {/* Table */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>
              Product Leaderboard
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a2a3a' }}>
                    {['Rank', 'Product', 'Revenue', 'Profit', 'Qty Sold', 'Margin %'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#606078', fontWeight: 500, fontSize: 11 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1e1e2a' }}>
                      <td style={{ padding: '9px 12px', color: '#606078' }}>#{i + 1}</td>
                      <td style={{ padding: '9px 12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {truncate(p.product_name as string, 36)}
                      </td>
                      <td style={{ padding: '9px 12px', color: '#6366f1', fontWeight: 600 }}>
                        {formatValue(p.revenue as number, 'currency')}
                      </td>
                      <td style={{ padding: '9px 12px', color: '#10b981', fontWeight: 600 }}>
                        {formatValue(p.profit as number, 'currency')}
                      </td>
                      <td style={{ padding: '9px 12px', color: 'var(--text-secondary)' }}>
                        {formatValue(p.quantity as number, 'number')}
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{
                          background: 'rgba(16,185,129,0.15)',
                          color: '#10b981',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                        }}>
                          {(p.margin_pct as number)?.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
