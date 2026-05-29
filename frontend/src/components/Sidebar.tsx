'use client';
import { useStore } from '@/lib/store';
import {
  LayoutDashboard, TrendingUp, ShoppingBag, Users,
  RotateCcw, GitBranch, MessageSquare, Database,
  Zap, Activity, FolderOpen
} from 'lucide-react';

const navItems = [
  { id: 'upload',         label: 'Upload Data',  icon: FolderOpen },
  { id: 'overview',       label: 'Overview',     icon: LayoutDashboard },
  { id: 'revenue',        label: 'Revenue',      icon: TrendingUp },
  { id: 'products',       label: 'Products',     icon: ShoppingBag },
  { id: 'customers',      label: 'Customers',    icon: Users },
  { id: 'returns',        label: 'Returns',      icon: RotateCcw },
  { id: 'relationships',  label: 'Data Model',   icon: GitBranch },
  { id: 'chat',           label: 'AI Analyst',   icon: MessageSquare },
  { id: 'explorer',       label: 'SQL Explorer', icon: Database },
  { id: 'pipeline',       label: 'Pipeline',     icon: Zap },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, pipelineStatus } = useStore();

  return (
    <aside style={{
      width: 220, minHeight: '100vh',
      background: '#111118', borderRight: '1px solid #2a2a3a',
      display: 'flex', flexDirection: 'column', padding: 0,
      position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #2a2a3a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #06b6d4)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.05em', color: '#f0f0f8' }}>CHIMERA</div>
            <div style={{ fontSize: 10, color: '#6060a0', letterSpacing: '0.1em' }}>BI PLATFORM</div>
          </div>
        </div>
      </div>

      {/* Status badge */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #2a2a3a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%',
            background: pipelineStatus === 'complete' ? '#10b981' : pipelineStatus === 'running' ? '#f59e0b' : '#606078' }}
            className={pipelineStatus === 'running' ? 'pulse-dot' : ''} />
          <span style={{ fontSize: 11, color: '#9090a8' }}>
            {pipelineStatus === 'complete' ? 'AdventureWorks Ready' :
             pipelineStatus === 'running'  ? 'Processing...' : 'Run Pipeline First'}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 14px', marginBottom: 2,
                borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: active ? '#6366f1' : '#9090a8',
                fontSize: 13, fontWeight: active ? 600 : 400,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)'; (e.currentTarget as HTMLElement).style.color = '#c0c0d8'; }}}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9090a8'; }}}
            >
              <Icon size={16} />
              <span>{label}</span>
              {active && <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#6366f1' }} />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #2a2a3a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={12} color="#6060a0" />
          <span style={{ fontSize: 10, color: '#6060a0' }}>v1.0.0 · DuckDB + Ollama</span>
        </div>
      </div>
    </aside>
  );
}
