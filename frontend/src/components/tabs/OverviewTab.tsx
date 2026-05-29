'use client';
import { useEffect, useState } from 'react';
import { chimera, KPI, ChartData } from '@/lib/api';
import KPICard from '@/components/KPICard';
import Chart from '@/components/Chart';
import {
  DollarSign, TrendingUp, ShoppingCart, Users,
  RotateCcw, Package, Percent, BarChart2
} from 'lucide-react';

const KPI_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  total_revenue: { icon: <DollarSign size={14} />, color: '#6366f1' },
  total_profit: { icon: <TrendingUp size={14} />, color: '#10b981' },
  profit_margin: { icon: <Percent size={14} />, color: '#06b6d4' },
  total_orders: { icon: <ShoppingCart size={14} />, color: '#f59e0b' },
  total_customers: { icon: <Users size={14} />, color: '#8b5cf6' },
  total_returns: { icon: <RotateCcw size={14} />, color: '#ef4444' },
  return_rate: { icon: <RotateCcw size={14} />, color: '#ef4444' },
  total_qty_sold: { icon: <Package size={14} />, color: '#06b6d4' },
  yoy_revenue_change: { icon: <BarChart2 size={14} />, color: '#f59e0b' },
};

const PRIMARY_KPIS = [
  'total_revenue', 'total_profit', 'profit_margin',
  'total_orders', 'total_customers', 'total_returns',
  'return_rate', 'yoy_revenue_change',
];

export default function OverviewTab() {
  const [kpis, setKPIs] = useState<Record<string, KPI>>({});
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [regionData, setRegionData] = useState<ChartData[]>([]);
  const [categoryData, setCategoryData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      chimera.getKPIs(),
      chimera.getRevenueByMonth(),
      chimera.getRevenueByRegion(),
      chimera.getRevenueByCategory(),
    ]).then(([kpisRes, revRes, regRes, catRes]) => {
      setKPIs(kpisRes.data.kpis || {});
      setRevenueData(revRes.data.data || []);
      setRegionData(regRes.data.data || []);
      setCategoryData(catRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="shimmer" style={{ height: 100, borderRadius: 12 }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div className="shimmer" style={{ height: 320, borderRadius: 12 }} />
          <div className="shimmer" style={{ height: 320, borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Executive Overview
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          AdventureWorks · 2016–2017 · Medallion Gold Layer
        </p>
      </div>

      {/* KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
        marginBottom: 24,
      }}>
        {PRIMARY_KPIS.map((name) => {
          const kpi = kpis[name];
          if (!kpi) return null;
          const meta = KPI_ICONS[name] || { color: '#6366f1' };
          return (
            <KPICard
              key={name}
              name={name}
              kpi={kpi}
              icon={<span style={{ color: meta.color }}>{meta.icon}</span>}
              accentColor={meta.color}
            />
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Revenue Trend */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Monthly Revenue & Profit
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>2016–2017 trend</div>
          </div>
          <Chart
            data={revenueData}
            type="area"
            xKey="period"
            yKeys={['revenue', 'profit']}
            height={240}
          />
        </div>

        {/* Revenue by Category */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Revenue by Category
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Product mix</div>
          </div>
          <Chart
            data={categoryData}
            type="pie"
            xKey="category"
            yKeys={['revenue']}
            height={240}
          />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Revenue by Region
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>All territories ranked</div>
        </div>
        <Chart
          data={regionData}
          type="bar"
          xKey="region"
          yKeys={['revenue', 'profit']}
          height={260}
        />
      </div>
    </div>
  );
}
