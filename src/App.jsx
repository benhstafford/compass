import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, CheckCircle2, X, Undo2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const STORAGE_KEY = 'compass-tasks-v1';

const SCORING_GUIDE = {
  careerAlignment: {
    label: 'Career alignment',
    description: 'How well this advances where you want your career to go.',
    levels: [
      { v: 1, l: 'Off-track or distracting' },
      { v: 2, l: 'Tangential to your goals' },
      { v: 3, l: 'Generally relevant' },
      { v: 4, l: 'Directly relevant' },
      { v: 5, l: 'Core to your trajectory' }
    ]
  },
  leverage: {
    label: 'Leverage',
    description: 'Visibility, influence, leadership opportunity. Will this be seen, valued, and demonstrate you driving outcomes?',
    levels: [
      { v: 1, l: 'Invisible, no influence' },
      { v: 2, l: 'Small audience, limited reach' },
      { v: 3, l: 'Moderate visibility within team' },
      { v: 4, l: 'Visible to leadership or cross-team' },
      { v: 5, l: 'High visibility AND clear leadership' }
    ]
  },
  effort: {
    label: 'Effort',
    description: 'Time and energy required. Subtracted from the score — high effort needs high payoff.',
    levels: [
      { v: 1, l: 'Trivial (under 30 min)' },
      { v: 2, l: 'Short (under 2 hours)' },
      { v: 3, l: 'Medium (half day)' },
      { v: 4, l: 'Substantial (1–3 days)' },
      { v: 5, l: 'Major (a week or more)' }
    ]
  }
};

const URGENCY_LABELS = ['—', 'Background', 'Soon-ish', 'Approaching', 'Imminent', 'Now or overdue'];

const calcUrgency = (dueDate) => {
  if (!dueDate) return 1;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const days = (due - now) / 86400000;
  if (days < 0) return 5;
  if (days <= 1) return 5;
  if (days <= 3) return 4;
  if (days <= 7) return 3;
  if (days <= 14) return 2;
  return 1;
};

const calcScore = (t) =>
  t.careerAlignment + t.leverage + 3 * calcUrgency(t.dueDate) - t.effort;

const scoreColors = (s) => {
  if (s >= 17) return { bg: '#c45b3f', fg: '#fafaf7' };
  if (s >= 12) return { bg: '#2c2c2a', fg: '#fafaf7' };
  if (s >= 7)  return { bg: '#888581', fg: '#fafaf7' };
  if (s >= 3)  return { bg: '#dcdad4', fg: '#5a5854' };
  return { bg: '#ececea', fg: '#a8a8a4' };
};

const PIE_COLORS = ['#c45b3f', '#2d5a3d', '#888581', '#d8956a', '#5a7a8c', '#a37862', '#7a8b6f', '#c8c4ba'];

const safeStorageGet = async (key) => {
  const value = localStorage.getItem(key);
  return value ? { value } : null;
};
const safeStorageSet = async (key, value) => {
  localStorage.setItem(key, value);
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState('focus');
  const [quickAdd, setQuickAdd] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [filterProject, setFilterProject] = useState('');

  useEffect(() => {
    (async () => {
      const result = await safeStorageGet(STORAGE_KEY);
      if (result?.value) {
        try { setTasks(JSON.parse(result.value)); } catch {}
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    safeStorageSet(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, loaded]);

  const addTask = (title) => {
    if (!title.trim()) return;
    const t = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      title: title.trim(),
      project: '',
      careerAlignment: 3, leverage: 3, effort: 3,
      dueDate: '',
      completed: false, completedAt: null,
      createdAt: new Date().toISOString(),
      scored: false
    };
    setTasks(prev => [t, ...prev]);
    setQuickAdd('');
  };

  const commitTask = (full) => {
    setTasks(prev => prev.map(t => t.id === full.id ? full : t));
  };

  const toggleComplete = (id) =>
    setTasks(prev => prev.map(t => t.id === id
      ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null }
      : t));

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const projects = useMemo(() =>
    [...new Set(tasks.map(t => t.project).filter(Boolean))].sort(), [tasks]);

  const focusTasks = useMemo(() =>
    tasks.filter(t => !t.completed)
      .filter(t => !filterProject || t.project === filterProject)
      .sort((a, b) => calcScore(b) - calcScore(a)),
    [tasks, filterProject]);

  const completedTasks = useMemo(() =>
    tasks.filter(t => t.completed)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)),
    [tasks]);

  const editingTask = editingId ? tasks.find(t => t.id === editingId) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf7', color: '#1a1a1a' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        body { margin: 0; font-family: 'IBM Plex Sans', system-ui, sans-serif; }
        * { box-sizing: border-box; }
        .mono { font-family: 'IBM Plex Mono', monospace; }
        .tab { font-size: 13px; font-weight: 500; padding: 10px 0; margin-right: 28px; background: transparent; border: none; color: #888581; cursor: pointer; transition: color 0.15s; border-bottom: 1.5px solid transparent; font-family: inherit; }
        .tab:hover { color: #1a1a1a; }
        .tab.active { color: #1a1a1a; border-bottom-color: #c45b3f; }
        .icn { background: transparent; border: none; padding: 6px; cursor: pointer; color: #888581; transition: color 0.15s; display: inline-flex; align-items: center; gap: 4px; font-family: inherit; }
        .icn:hover { color: #1a1a1a; }
        input, select { font-family: inherit; background: transparent; border: none; outline: none; color: inherit; }
        input::placeholder { color: #b8b6b1; }
        .scale-btn { width: 36px; height: 36px; border-radius: 50%; border: 1px solid #d8d6d0; background: transparent; font-family: 'IBM Plex Mono', monospace; font-size: 13px; font-weight: 500; color: #5a5854; cursor: pointer; transition: all 0.15s; }
        .scale-btn:hover { border-color: #1a1a1a; color: #1a1a1a; }
        .scale-btn.selected { background: #1a1a1a; color: #fafaf7; border-color: #1a1a1a; }
        .check-circle { width: 20px; height: 20px; border: 1.5px solid #c8c5be; border-radius: 50%; transition: all 0.2s; }
        .check-circle:hover { border-color: #1a1a1a; background: #1a1a1a; }
        .field-input { font-size: 14px; border-bottom: 1px solid #d8d6d0; width: 100%; padding: 6px 0; transition: border-color 0.15s; }
        .field-input:focus { border-bottom-color: #1a1a1a; }
        .modal-bg { position: fixed; inset: 0; background: rgba(26,26,26,0.4); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 50; }
        .primary-btn { background: #1a1a1a; color: #fafaf7; border: none; padding: 10px 24px; font-size: 13px; font-weight: 500; cursor: pointer; transition: opacity 0.15s; font-family: inherit; }
        .primary-btn:hover { opacity: 0.85; }
        .label { font-size: 11px; font-weight: 500; color: #888581; text-transform: uppercase; letter-spacing: 0.04em; }
      `}</style>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 28px 80px' }}>
        <header style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>Compass</h1>
            <span style={{ fontSize: 11, color: '#a8a8a4' }}>v0.2</span>
          </div>
          <p style={{ fontSize: 13, color: '#6b6b68', marginTop: 4, marginBottom: 22 }}>
            Pick what to work on next.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); addTask(quickAdd); }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#fff', border: '1px solid #e8e6e0', borderRadius: 4 }}
          >
            <Plus size={16} style={{ color: '#888581', flexShrink: 0 }} />
            <input
              type="text"
              value={quickAdd}
              onChange={(e) => setQuickAdd(e.target.value)}
              placeholder="What needs doing?"
              style={{ flex: 1, fontSize: 15 }}
              autoFocus
            />
            {quickAdd && (
              <span style={{ fontSize: 11, color: '#a8a8a4' }}>↵ enter</span>
            )}
          </form>
        </header>

        <nav style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e8e6e0', marginBottom: 20 }}>
          <button onClick={() => setView('focus')} className={`tab ${view === 'focus' ? 'active' : ''}`}>
            Focus <span style={{ fontSize: 11, marginLeft: 4, color: '#a8a8a4' }}>{focusTasks.length}</span>
          </button>
          <button onClick={() => setView('done')} className={`tab ${view === 'done' ? 'active' : ''}`}>
            Done <span style={{ fontSize: 11, marginLeft: 4, color: '#a8a8a4' }}>{completedTasks.length}</span>
          </button>
          <button onClick={() => setView('stats')} className={`tab ${view === 'stats' ? 'active' : ''}`}>
            Stats
          </button>
        </nav>

        {view === 'focus' && (
          <FocusView
            tasks={focusTasks}
            allProjects={projects}
            filterProject={filterProject}
            setFilterProject={setFilterProject}
            onEdit={setEditingId}
            onComplete={toggleComplete}
          />
        )}
        {view === 'done' && (
          <DoneView tasks={completedTasks} onUndo={toggleComplete} onDelete={deleteTask} />
        )}
        {view === 'stats' && <StatsView tasks={completedTasks} />}

        {editingTask && (
          <EditModal
            task={editingTask}
            allProjects={projects}
            onCommit={commitTask}
            onClose={() => setEditingId(null)}
            onDelete={() => deleteTask(editingTask.id)}
          />
        )}

        <footer style={{ marginTop: 56, paddingTop: 18, borderTop: '1px solid #e8e6e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="mono" style={{ fontSize: 11, color: '#888581' }}>
            score = career + leverage + 3×urgency − effort
          </span>
          <span className="mono" style={{ fontSize: 11, color: '#a8a8a4' }}>0 — 24</span>
        </footer>
      </div>
    </div>
  );
}

function FocusView({ tasks, allProjects, filterProject, setFilterProject, onEdit, onComplete }) {
  return (
    <div>
      {allProjects.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span className="label">Project</span>
          <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}
            style={{ fontSize: 12, padding: '5px 22px 5px 10px', border: '1px solid #d8d6d0', borderRadius: 3, cursor: 'pointer', background: '#fff', fontFamily: 'inherit' }}>
            <option value="">All</option>
            {allProjects.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {filterProject && (
            <button onClick={() => setFilterProject('')} className="icn" style={{ fontSize: 11 }}>
              <X size={12} /> clear
            </button>
          )}
        </div>
      )}
      {tasks.length === 0 ? (
        <EmptyState title="Nothing to do." sub="Add something above to begin." />
      ) : (
        tasks.map(t => <TaskRow key={t.id} task={t} onEdit={() => onEdit(t.id)} onComplete={() => onComplete(t.id)} />)
      )}
    </div>
  );
}

function TaskRow({ task, onEdit, onComplete }) {
  const score = calcScore(task);
  const c = scoreColors(score);
  const isOverdue = task.dueDate && new Date(task.dueDate + 'T00:00:00') < new Date(new Date().setHours(0,0,0,0));
  const dueText = task.dueDate ? new Date(task.dueDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid #e8e6e0' }}>
      <button onClick={onComplete} className="icn" style={{ flexShrink: 0, padding: 0 }} aria-label="Mark complete">
        <div className="check-circle" />
      </button>
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={onEdit}>
        <div style={{ fontSize: 14.5, lineHeight: 1.4, marginBottom: 3 }}>
          {task.title}
          {!task.scored && (
            <span style={{ fontSize: 10, color: '#c45b3f', marginLeft: 10, verticalAlign: '1px' }}>
              · unscored
            </span>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: '#888581', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {task.project && <span>{task.project}</span>}
          {task.project && dueText && <span style={{ color: '#c8c5be' }}>·</span>}
          {dueText && (
            <span style={{ color: isOverdue ? '#c45b3f' : '#888581' }}>
              {isOverdue ? `Overdue (${dueText})` : `Due ${dueText}`}
            </span>
          )}
        </div>
      </div>
      <div onClick={onEdit} className="mono"
        style={{ width: 44, height: 44, borderRadius: '50%', background: c.bg, color: c.fg, fontSize: 16, fontWeight: 500, flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s' }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
        {score}
      </div>
    </div>
  );
}

function DoneView({ tasks, onUndo, onDelete }) {
  if (tasks.length === 0) return <EmptyState title="Nothing checked off yet." />;
  const grouped = tasks.reduce((acc, t) => {
    const date = new Date(t.completedAt).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    (acc[date] = acc[date] || []).push(t);
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} style={{ marginBottom: 24 }}>
          <h3 className="label" style={{ marginBottom: 8, marginTop: 0 }}>{date}</h3>
          {items.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderBottom: '1px solid #e8e6e0' }}>
              <CheckCircle2 size={18} style={{ color: '#2d5a3d', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13.5, textDecoration: 'line-through', color: '#888581', margin: 0 }}>{t.title}</p>
                {t.project && (
                  <div style={{ fontSize: 11, color: '#a8a8a4', marginTop: 2 }}>{t.project}</div>
                )}
              </div>
              <button onClick={() => onUndo(t.id)} className="icn" title="Undo"><Undo2 size={14} /></button>
              <button onClick={() => onDelete(t.id)} className="icn" title="Delete"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function StatsView({ tasks }) {
  if (tasks.length === 0) return <EmptyState title="Stats appear once you start checking off tasks." />;

  const byProject = tasks.reduce((acc, t) => {
    const k = t.project || '(no project)';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const effortLabels = ['Trivial', 'Short', 'Medium', 'Substantial', 'Major'];
  const byEffort = effortLabels.map((name, i) => ({
    name,
    value: tasks.filter(t => t.effort === i + 1).length
  })).filter(d => d.value > 0);

  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
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

function EmptyState({ title, sub }) {
  return (
    <div style={{ padding: '70px 0', textAlign: 'center', color: '#888581' }}>
      <p style={{ fontSize: 17, fontWeight: 500, color: '#1a1a1a', marginBottom: 6, marginTop: 0 }}>{title}</p>
      {sub && <p style={{ fontSize: 13, margin: 0 }}>{sub}</p>}
    </div>
  );
}

function EditModal({ task, allProjects, onCommit, onClose, onDelete }) {
  const [local, setLocal] = useState(task);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    setLocal(task);
    setDeleted(false);
  }, [task.id]);

  const update = (updates) => setLocal(prev => ({ ...prev, ...updates }));
  const updateScored = (updates) => update({ ...updates, scored: true });

  const handleClose = () => {
    if (!deleted) onCommit(local);
    onClose();
  };

  const handleDelete = () => {
    setDeleted(true);
    onDelete();
    onClose();
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, deleted]);

  const score = calcScore(local);
  const c = scoreColors(score);
  const u = calcUrgency(local.dueDate);

  return (
    <div className="modal-bg" onClick={handleClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: '#fafaf7', maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(26,26,26,0.25)', borderRadius: 4 }}>
        <div style={{ padding: '26px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, paddingBottom: 16, borderBottom: '1px solid #e8e6e0', marginBottom: 20 }}>
            <input
              value={local.title}
              onChange={(e) => update({ title: e.target.value })}
              style={{ flex: 1, fontSize: 19, fontWeight: 500, letterSpacing: '-0.01em' }}
            />
            <div className="mono" style={{ width: 60, height: 60, borderRadius: '50%', background: c.bg, color: c.fg, fontSize: 22, fontWeight: 500, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {score}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 22 }}>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 4 }}>Project</label>
              <input list="proj-list" value={local.project} onChange={(e) => update({ project: e.target.value })} placeholder="—" className="field-input" />
              <datalist id="proj-list">{allProjects.map(p => <option key={p} value={p} />)}</datalist>
            </div>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 4 }}>Due date</label>
              <input type="date" value={local.dueDate} onChange={(e) => update({ dueDate: e.target.value })} className="field-input" />
            </div>
          </div>

          {Object.entries(SCORING_GUIDE).map(([key, guide]) => (
            <ScaleField key={key} guide={guide} value={local[key]} onChange={(v) => updateScored({ [key]: v })} />
          ))}

          <div style={{ paddingTop: 14, paddingBottom: 14, borderTop: '1px solid #e8e6e0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
              <h4 style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
                Urgency <span className="label" style={{ marginLeft: 8 }}>auto · ×3</span>
              </h4>
              <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>
                {u} <span style={{ color: '#888581', fontWeight: 400 }}>· {URGENCY_LABELS[u]}</span>
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#6b6b68', margin: 0 }}>Calculated from due date. Counts triple in the score.</p>
          </div>

          <div style={{ paddingTop: 16, paddingBottom: 4, borderTop: '1px solid #1a1a1a' }}>
            <p className="mono" style={{ fontSize: 11, color: '#5a5854', margin: 0 }}>
              {local.careerAlignment} <span style={{ color: '#888581' }}>career</span> + {local.leverage} <span style={{ color: '#888581' }}>leverage</span> + 3×{u} <span style={{ color: '#888581' }}>urgency</span> − {local.effort} <span style={{ color: '#888581' }}>effort</span> = <strong>{score}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, marginTop: 8, borderTop: '1px solid #e8e6e0' }}>
            <button onClick={handleDelete} className="icn" style={{ color: '#c45b3f', fontSize: 12 }}>
              <Trash2 size={13} /> Delete
            </button>
            <button onClick={handleClose} className="primary-btn">Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScaleField({ guide, value, onChange }) {
  const current = guide.levels.find(l => l.v === value);
  return (
    <div style={{ paddingTop: 14, paddingBottom: 14, borderTop: '1px solid #e8e6e0' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <h4 style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{guide.label}</h4>
        <span style={{ fontSize: 12 }} className="mono">
          <strong>{value}</strong> <span style={{ color: '#888581' }}>· {current?.l}</span>
        </span>
      </div>
      <p style={{ fontSize: 12, color: '#6b6b68', marginBottom: 10, marginTop: 0 }}>{guide.description}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {[1,2,3,4,5].map(v => (
          <button key={v} onClick={() => onChange(v)} className={`scale-btn ${value === v ? 'selected' : ''}`}>{v}</button>
        ))}
      </div>
    </div>
  );
}
