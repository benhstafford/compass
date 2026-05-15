import { useState, useEffect, useMemo } from 'react';
import { Plus, List, CheckSquare, BarChart2, Target, LogOut } from 'lucide-react';
import { calcScore } from './lib/scoring';
import { supabase, toDb, fromDb } from './lib/supabase';
import AuthGate from './components/AuthGate';
import FocusView from './components/FocusView';
import DoneView from './components/DoneView';
import StatsView from './components/StatsView';
import EditModal from './components/EditModal';

const LEGACY_STORAGE_KEY = 'compass-tasks-v1';

const SHARED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
  body { margin: 0; font-family: 'IBM Plex Sans', system-ui, sans-serif; }
  * { box-sizing: border-box; }
  .mono { font-family: 'IBM Plex Mono', monospace; }
  .tab { font-size: 13px; font-weight: 500; padding: 10px 0; margin-right: 28px; background: transparent; border: none; color: #888581; cursor: pointer; transition: color 0.15s; border-bottom: 1.5px solid transparent; font-family: inherit; display: inline-flex; align-items: center; gap: 6px; }
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
  .modal-bg { position: fixed; inset: 0; background: rgba(26,26,26,0.4); display: flex; align-items: flex-start; justify-content: center; padding: 5vh 16px 32px; z-index: 50; overflow-y: auto; }
  .primary-btn { background: #1a1a1a; color: #fafaf7; border: none; padding: 10px 24px; font-size: 13px; font-weight: 500; cursor: pointer; transition: opacity 0.15s; font-family: inherit; }
  .primary-btn:hover { opacity: 0.85; }
  .label { font-size: 11px; font-weight: 500; color: #888581; text-transform: uppercase; letter-spacing: 0.04em; }
  .focus-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit; border-radius: 3px; transition: all 0.15s; }
  .focus-btn-off { background: transparent; color: #888581; border: 1px solid #d8d6d0; }
  .focus-btn-off:hover { color: #1a1a1a; border-color: #888581; }
  .focus-btn-on { background: #1a1a1a; color: #fafaf7; border: 1px solid #1a1a1a; }
  .focus-btn-on:hover { opacity: 0.85; }
  .add-task-btn { padding: 7px 14px; font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit; border-radius: 3px; background: #1a1a1a; color: #fafaf7; border: none; white-space: nowrap; transition: opacity 0.15s; }
  .add-task-btn:hover { opacity: 0.8; }
  input[type=range] { -webkit-appearance: none; appearance: none; height: 3px; border-radius: 1.5px; outline: none; width: 100%; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #1a1a1a; cursor: pointer; margin-top: -7px; }
  input[type=range]::-webkit-slider-runnable-track { height: 3px; border-radius: 1.5px; }
  input[type=range]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #1a1a1a; cursor: pointer; border: none; }
  input[type=range]::-moz-range-track { height: 3px; background: #e8e6e0; border-radius: 1.5px; }
  input[type=range]::-moz-range-progress { height: 3px; background: #1a1a1a; border-radius: 1.5px; }
`;

export default function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState('tasks');
  const [focusMode, setFocusMode] = useState(false);
  const [quickAdd, setQuickAdd] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [filterProject, setFilterProject] = useState('');

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load tasks when user is known; migrate from localStorage on first sign-in
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoaded(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data && data.length === 0) {
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          try {
            const localTasks = JSON.parse(legacy);
            if (localTasks.length > 0) {
              await supabase.from('tasks').insert(localTasks.map(t => toDb(t, user.id)));
              setTasks(localTasks);
              localStorage.removeItem(LEGACY_STORAGE_KEY);
              setLoaded(true);
              return;
            }
          } catch {}
        }
      }

      setTasks((data ?? []).map(fromDb));
      setLoaded(true);
    })();
  }, [user]);

  // Real-time cross-device sync
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev =>
            prev.some(t => t.id === payload.new.id) ? prev : [fromDb(payload.new), ...prev]
          );
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(t => t.id === payload.new.id ? fromDb(payload.new) : t));
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  const addTask = async (title) => {
    if (!title.trim()) return;
    const t = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      title: title.trim(),
      project: '',
      provenance: '',
      careerAlignment: 3, leverage: 3, effort: 3,
      dueDate: '',
      completed: false, completedAt: null,
      createdAt: new Date().toISOString(),
      scored: false,
    };
    setTasks(prev => [t, ...prev]);
    setQuickAdd('');
    await supabase.from('tasks').insert(toDb(t, user.id));
  };

  const commitTask = async (full) => {
    setTasks(prev => prev.map(t => t.id === full.id ? full : t));
    await supabase.from('tasks').update(toDb(full, user.id)).eq('id', full.id);
  };

  const toggleComplete = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updated = {
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : null,
    };
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    await supabase.from('tasks').update(toDb(updated, user.id)).eq('id', id);
  };

  const deleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (editingId === id) setEditingId(null);
    await supabase.from('tasks').delete().eq('id', id);
  };

  const signOut = () => supabase.auth.signOut();

  const projects = useMemo(() =>
    [...new Set(tasks.map(t => t.project).filter(Boolean))].sort(), [tasks]);

  const focusTasks = useMemo(() =>
    tasks
      .filter(t => !t.completed)
      .filter(t => !filterProject || t.project === filterProject)
      .sort((a, b) => calcScore(b) - calcScore(a)),
    [tasks, filterProject]);

  const completedTasks = useMemo(() =>
    tasks
      .filter(t => t.completed)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)),
    [tasks]);

  const editingTask = editingId ? tasks.find(t => t.id === editingId) : null;

  const toggleFocusMode = () => {
    setFocusMode(f => !f);
    setView('tasks');
  };

  if (focusMode) {
    const top3 = focusTasks.slice(0, 3);
    return (
      <AuthGate user={user}>
        <div style={{ minHeight: '100vh', background: '#fafaf7', color: '#1a1a1a', textAlign: 'left' }}>
          <style>{SHARED_STYLES}</style>
          <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 28px 80px' }}>
            <header style={{ marginBottom: 56 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>Compass</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={toggleFocusMode} className="focus-btn focus-btn-on">
                    <Target size={13} /> Exit Focus
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#6b6b68', marginTop: 4, marginBottom: 0 }}>
                Pick what to work on next.
              </p>
            </header>

            <p className="label" style={{ marginBottom: 36, letterSpacing: '0.1em' }}>
              Top 3 — do these first
            </p>

            {top3.length === 0 ? (
              <p style={{ fontSize: 15, color: '#888581' }}>No tasks yet. Add some in normal mode.</p>
            ) : (
              top3.map((task, i) => {
                const isOverdue = task.dueDate && new Date(task.dueDate + 'T00:00:00') < new Date(new Date().setHours(0, 0, 0, 0));
                const dueText = task.dueDate
                  ? new Date(task.dueDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : null;
                return (
                  <div
                    key={task.id}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 28, paddingBottom: 40, marginBottom: 40, borderBottom: i < top3.length - 1 ? '1px solid #e8e6e0' : 'none', cursor: 'pointer' }}
                    onClick={() => setEditingId(task.id)}
                  >
                    <span
                      className="mono"
                      style={{ fontSize: 96, fontWeight: 600, lineHeight: 0.85, color: '#1a1a1a', flexShrink: 0, letterSpacing: '-0.04em', paddingTop: 6 }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, paddingTop: 10 }}>
                      <p style={{ fontSize: 24, fontWeight: 500, margin: 0, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                        {task.title}
                      </p>
                      {(task.project || dueText) && (
                        <p style={{ fontSize: 13, color: '#888581', margin: '8px 0 0' }}>
                          {task.project}
                          {task.project && dueText && ' · '}
                          {dueText && (
                            <span style={{ color: isOverdue ? '#c45b3f' : '#888581' }}>
                              {isOverdue ? `Overdue (${dueText})` : `Due ${dueText}`}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {editingTask && (
            <EditModal
              task={editingTask}
              allProjects={projects}
              onCommit={commitTask}
              onClose={() => setEditingId(null)}
              onDelete={() => deleteTask(editingTask.id)}
            />
          )}
        </div>
      </AuthGate>
    );
  }

  return (
    <AuthGate user={user}>
      <div style={{ minHeight: '100vh', background: '#fafaf7', color: '#1a1a1a', textAlign: 'left' }}>
        <style>{SHARED_STYLES}</style>

        <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 28px 80px' }}>
          <header style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>Compass</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: '#a8a8a4' }}>v0.2</span>
                <button onClick={toggleFocusMode} className="focus-btn focus-btn-off">
                  <Target size={13} /> Focus
                </button>
                <button
                  onClick={signOut}
                  title="Sign out"
                  style={{ background: 'transparent', border: 'none', padding: '4px 6px', cursor: 'pointer', color: '#a8a8a4', display: 'inline-flex', alignItems: 'center', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#1a1a1a'}
                  onMouseLeave={e => e.currentTarget.style.color = '#a8a8a4'}
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#6b6b68', marginTop: 4, marginBottom: 22 }}>
              Pick what to work on next.
            </p>

            <form
              onSubmit={(e) => { e.preventDefault(); addTask(quickAdd); }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fff', border: '1px solid #e8e6e0', borderRadius: 4 }}
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
              <button type="submit" className="add-task-btn">Add task</button>
            </form>
          </header>

          <nav style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e8e6e0', marginBottom: 20 }}>
            <button onClick={() => setView('tasks')} className={`tab ${view === 'tasks' ? 'active' : ''}`}>
              <List size={13} />
              Tasks <span style={{ fontSize: 11, marginLeft: 2, color: '#a8a8a4' }}>{focusTasks.length}</span>
            </button>
            <button onClick={() => setView('done')} className={`tab ${view === 'done' ? 'active' : ''}`}>
              <CheckSquare size={13} />
              Done <span style={{ fontSize: 11, marginLeft: 2, color: '#a8a8a4' }}>{completedTasks.length}</span>
            </button>
            <button onClick={() => setView('report')} className={`tab ${view === 'report' ? 'active' : ''}`}>
              <BarChart2 size={13} />
              Report
            </button>
          </nav>

          {view === 'tasks' && (
            <FocusView
              tasks={focusTasks}
              allProjects={projects}
              filterProject={filterProject}
              setFilterProject={setFilterProject}
              onEdit={setEditingId}
              onComplete={toggleComplete}
              focusMode={false}
            />
          )}
          {view === 'done' && (
            <DoneView tasks={completedTasks} onUndo={toggleComplete} onDelete={deleteTask} />
          )}
          {view === 'report' && <StatsView tasks={completedTasks} />}

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
    </AuthGate>
  );
}
