'use client';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { CHART_COLORS } from '@/lib/utils';

interface ChartProps {
  data: any[];
  type: 'area' | 'bar' | 'line' | 'pie';
  xKey: string;
  yKeys: string[];
  title?: string;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#16161f',
      border: '1px solid #2a2a3a',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <div style={{ color: '#9090a8', marginBottom: 4 }}>{label}</div>
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ color: entry.color, fontWeight: 600 }}>
          {entry.name}: {typeof entry.value === 'number'
            ? entry.value >= 1000
              ? `$${(entry.value / 1000).toFixed(0)}K`
              : entry.value.toFixed(0)
            : entry.value}
        </div>
      ))}
    </div>
  );
};

export default function Chart({ data, type, xKey, yKeys, title, height = 280 }: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data available</span>
      </div>
    );
  }

  const formatYAxis = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return String(val);
  };

  if (type === 'pie') {
    const pieData = data.map((d) => ({
      name: d[xKey],
      value: d[yKeys[0]],
    }));
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(val: number) => [`$${(val / 1000).toFixed(0)}K`, '']}
            contentStyle={{ background: '#16161f', border: '1px solid #2a2a3a', borderRadius: 8 }}
            labelStyle={{ color: '#9090a8' }}
          />
          <Legend
            formatter={(value) => <span style={{ color: '#9090a8', fontSize: 11 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fill: '#9090a8', fontSize: 10 }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fill: '#9090a8', fontSize: 10 }} tickFormatter={formatYAxis} />
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(v) => <span style={{ color: '#9090a8', fontSize: 11 }}>{v}</span>} />
          {yKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={CHART_COLORS[i]}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <defs>
            {yKeys.map((key, i) => (
              <linearGradient key={key} id={`grad_${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS[i]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS[i]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fill: '#9090a8', fontSize: 10 }} />
          <YAxis tick={{ fill: '#9090a8', fontSize: 10 }} tickFormatter={formatYAxis} />
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(v) => <span style={{ color: '#9090a8', fontSize: 11 }}>{v}</span>} />
          {yKeys.map((key, i) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={CHART_COLORS[i]}
              strokeWidth={2}
              fill={`url(#grad_${key})`}
              dot={false}
              activeDot={{ r: 4, fill: CHART_COLORS[i] }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // line
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: '#9090a8', fontSize: 10 }} />
        <YAxis tick={{ fill: '#9090a8', fontSize: 10 }} tickFormatter={formatYAxis} />
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={(v) => <span style={{ color: '#9090a8', fontSize: 11 }}>{v}</span>} />
        {yKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={CHART_COLORS[i]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
