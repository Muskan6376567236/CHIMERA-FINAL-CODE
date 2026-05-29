'use client';
import { useState, useRef, useEffect } from 'react';
import { chimera, ChartData, ChatResponse } from '@/lib/api';
import Chart from '@/components/Chart';
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { formatValue, formatKPIName } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  response?: ChatResponse;
  chartData?: ChartData[];
  timestamp: Date;
}

const SUGGESTIONS = [
  'Show monthly revenue trend',
  'Which region has highest revenue?',
  'Top 10 products by profit',
  'Give me an executive KPI summary',
  'Compare 2016 vs 2017 sales',
  'Customer segment analysis',
];

export default function ChatTab() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Hello! I'm CHIMERA AI, your autonomous BI analyst. I have full access to the AdventureWorks dataset — $18.5M revenue, 22K orders, 18K customers across 10 regions. Ask me anything!",
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState<Record<string, any>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChartData = async (dataKey: string): Promise<ChartData[]> => {
    const dataKeyMap: Record<string, () => Promise<any>> = {
      revenue_by_month: chimera.getRevenueByMonth,
      revenue_by_region: chimera.getRevenueByRegion,
      revenue_by_category: chimera.getRevenueByCategory,
      top_products: () => chimera.getTopProducts(10),
      top_customers: () => chimera.getTopCustomers(10),
      yoy_comparison: chimera.getYoYComparison,
      returns_by_month: chimera.getReturnsByMonth,
      customer_segments: chimera.getCustomerSegments,
    };
    const fn = dataKeyMap[dataKey];
    if (fn) {
      const res = await fn();
      return res.data.data || [];
    }
    return [];
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput('');
    setLoading(true);

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await chimera.sendChat(text);
      const response = res.data;
      const assistantMsg: Message = {
        role: 'assistant',
        content: response.content || 'No response',
        response: response as any,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Failed to get response. Make sure Ollama is running with phi3 model.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32,
          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={16} color="white" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>CHIMERA AI Analyst</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Powered by Ollama · phi3</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} className="pulse-dot" />
          <span style={{ fontSize: 11, color: '#10b981' }}>Live</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className="fade-in"
            style={{
              display: 'flex',
              gap: 12,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                : '#1e1e2a',
              border: msg.role === 'assistant' ? '1px solid #2a2a3a' : 'none',
            }}>
              {msg.role === 'user' ? <User size={14} color="white" /> : <Bot size={14} color="#6366f1" />}
            </div>

            {/* Bubble */}
            <div style={{ maxWidth: '75%', minWidth: 120 }}>
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                    : '#16161f',
                  border: msg.role === 'assistant' ? '1px solid #2a2a3a' : 'none',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {msg.content && msg.content !== 'undefined' && (
                  <div>{msg.content}</div>
                )}
              </div>

              {/* Chart response */}
              {msg.response?.type === 'chart' && msg.chartData && msg.chartData.length > 0 && (
                <div
                  className="glass-card fade-in"
                  style={{ padding: 16, marginTop: 8 }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {msg.response.title}
                  </div>
                  {msg.response.insight && (
                    <div style={{ fontSize: 11, color: '#10b981', marginBottom: 12 }}>
                      💡 {msg.response.insight}
                    </div>
                  )}
                  <Chart
                    data={msg.chartData}
                    type={msg.response.chart_type as any || 'bar'}
                    xKey={msg.response.x_key || Object.keys(msg.chartData[0])[0]}
                    yKeys={msg.response.y_keys || [Object.keys(msg.chartData[0])[1]]}
                    height={220}
                  />
                </div>
              )}

              {/* KPI response */}
              {msg.response?.type === 'kpi' && msg.response.kpis && (
                <div style={{ marginTop: 8 }}>
                  <KPIGrid kpiKeys={msg.response.kpis} />
                </div>
              )}

              {/* SQL response */}
              {msg.response?.type === 'sql' && msg.response.query && (
                <div className="glass-card" style={{ padding: 12, marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: '#606078', marginBottom: 6 }}>Generated SQL:</div>
                  <pre style={{
                    fontSize: 11,
                    color: '#06b6d4',
                    fontFamily: 'monospace',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.response.query}
                  </pre>
                </div>
              )}

              <div style={{ fontSize: 10, color: '#606078', marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: '#1e1e2a', border: '1px solid #2a2a3a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={14} color="#6366f1" />
            </div>
            <div style={{
              padding: '12px 16px',
              background: '#16161f',
              border: '1px solid #2a2a3a',
              borderRadius: '18px 18px 18px 4px',
              display: 'flex', alignItems: 'center', gap: 8,
              color: 'var(--text-secondary)', fontSize: 12,
            }}>
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              Analyzing your data...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div style={{
        padding: '8px 24px',
        borderTop: '1px solid #1e1e2a',
        display: 'flex', gap: 6, flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => send(s)}
            style={{
              padding: '4px 10px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 12,
              color: '#9090a8',
              fontSize: 11,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.target as HTMLButtonElement).style.background = 'rgba(99,102,241,0.2)';
              (e.target as HTMLButtonElement).style.color = '#6366f1';
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.background = 'rgba(99,102,241,0.1)';
              (e.target as HTMLButtonElement).style.color = '#9090a8';
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 24px 20px',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center',
          background: '#16161f',
          border: '1px solid #2a2a3a',
          borderRadius: 14,
          padding: '10px 14px',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
            placeholder="Ask about revenue, products, customers, regions..."
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim()
                ? '#2a2a3a'
                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
              border: 'none',
              borderRadius: 8,
              padding: '6px 12px',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
              color: 'white',
              fontSize: 12,
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
            Send
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function KPIGrid({ kpiKeys }: { kpiKeys: string[] }) {
  const [kpis, setKPIs] = useState<Record<string, any>>({});

  useEffect(() => {
    chimera.getKPIs().then(r => setKPIs(r.data.kpis || {}));
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 4 }}>
      {kpiKeys.map(key => {
        const kpi = kpis[key];
        if (!kpi) return null;
        return (
          <div
            key={key}
            style={{
              background: '#16161f',
              border: '1px solid #2a2a3a',
              borderRadius: 8,
              padding: '10px 14px',
            }}
          >
            <div style={{ fontSize: 10, color: '#606078', marginBottom: 2 }}>
              {formatKPIName(key)}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#6366f1' }}>
              {formatValue(kpi.value, kpi.format)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
