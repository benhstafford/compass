import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { calcScore, scoreColors, PIE_COLORS } from '../lib/scoring';
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

  // Best completed task per project from last 7 days
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  oneWeekAgo.setHours(0, 0, 0, 0);
  const recentTasks = tasks.filter(t => new Date(t.completedAt) >= oneWeekAgo);
  const bestByProject = {};
  for (const t of recentTasks) {
    const key = t.project || '(no project)';
    if (!bestByProject[key] || calcScore(t) > calcScore(bestByProject[key])) {
      bestByProject[key] = t;
    }
  }
  const bestTasks = Object.entries(bestByProject).sort((a, b) => calcScore(b[1]) - calcScore(a[1]));

  return (
    <div>
      <div className="stat-summary">
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

      {bestTasks.length > 0 && (
        <div style={{ marginBottom: 32, paddingBottom: 8 }}>
          <h3 className="label" style={{ marginBottom: 12, marginTop: 0 }}>Best of last 7 days</h3>
          {bestTasks.map(([proj, task]) => {
            const s = calcScore(task);
            const col = scoreColors(s);
            const completedDate = task.completedAt
              ? new Date(task.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              : null;
            return (
              <div key={proj} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #e8e6e0' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, lineHeight: 1.3 }}>{task.title}</div>
                  <div style={{ fontSize: 11, color: '#888581', marginTop: 2, display: 'flex', gap: 8 }}>
                    <span>{proj}</span>
                    {completedDate && <span style={{ color: '#c8c5be' }}>· {completedDate}</span>}
                  </div>
                </div>
                <div className="mono" style={{ width: 36, height: 36, borderRadius: '50%', background: col.bg, color: col.fg, fontSize: 14, fontWeight: 500, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pie-grid">
        <PieBlock title="By project" data={projectData} />
        <PieBlock title="By effort" data={byEffort} />
      </div>
    </div>
  );
}
