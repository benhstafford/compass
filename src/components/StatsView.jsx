import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { calcScore, PIE_COLORS } from '../lib/scoring';
import EmptyState from './EmptyState';

function PieBlock({ title, data }) {
  if (data.length === 0) return null;
  const total = data.reduce((s, x) => s + x.value, 0);
  return (
    <div>
      <h3 className="label" style={{ marginBottom: 10, marginTop: 0 }}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 130, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={32} outerRadius={62} paddingAngle={2}>
                {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#fafaf7', border: '1px solid #1a1a1a', borderRadius: 0, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {data.map((d, i) => {
            const pct = Math.round((d.value / total) * 100);
            return (
              <div key={d.name} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
                <div style={{ width: 8, height: 8, background: PIE_COLORS[i % PIE_COLORS.length], borderRadius: '50%', flexShrink: 0 }} />
                <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                <span className="mono" style={{ fontSize: 11, color: '#888581' }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function StatsView({ tasks }) {
  if (tasks.length === 0) return <EmptyState title="Stats appear once you start checking off tasks." />;

  const byProject = tasks.reduce((acc, t) => {
    const k = t.project || '(no project)';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const effortLabels = ['Trivial', 'Short', 'Medium', 'Substantial', 'Major'];
  const byEffort = effortLabels
    .map((name, i) => ({ name, value: tasks.filter(t => t.effort === i + 1).length }))
    .filter(d => d.value > 0);

  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const count = tasks.filter(t => { const c = new Date(t.completedAt); return c >= d && c < next; }).length;
    days.push({ date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), count });
  }

  const avgScore = tasks.reduce((s, t) => s + calcScore(t), 0) / tasks.length;
  const avgEffort = tasks.reduce((s, t) => s + t.effort, 0) / tasks.length;
  const projectData = Object.entries(byProject).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, paddingBottom: 22, marginBottom: 26, borderBottom: '1px solid #e8e6e0' }}>
        {[
          { label: 'Completed', value: tasks.length },
          { label: 'Avg score', value: avgScore.toFixed(1) },
          { label: 'Avg effort', value: avgEffort.toFixed(1) }
        ].map(s => (
          <div key={s.label}>
            <p className="label" style={{ margin: 0 }}>{s.label}</p>
            <p style={{ fontSize: 32, fontWeight: 500, marginTop: 4, marginBottom: 0, lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 32 }}>
        <h3 className="label" style={{ marginBottom: 10, marginTop: 0 }}>Last 14 days</h3>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={days} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#888581' }} axisLine={{ stroke: '#e8e6e0' }} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#888581' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip cursor={{ fill: '#ececea' }} contentStyle={{ background: '#fafaf7', border: '1px solid #1a1a1a', borderRadius: 0, fontSize: 11 }} />
            <Bar dataKey="count" fill="#c45b3f" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        <PieBlock title="By project" data={projectData} />
        <PieBlock title="By effort" data={byEffort} />
      </div>
    </div>
  );
}
