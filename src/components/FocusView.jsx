import { X } from 'lucide-react';
import EmptyState from './EmptyState';
import TaskRow from './TaskRow';

export default function FocusView({ tasks, allProjects, filterProject, setFilterProject, onEdit, onComplete, focusMode }) {
  const displayTasks = focusMode ? tasks.slice(0, 3) : tasks;

  return (
    <div>
      {!focusMode && allProjects.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span className="label">Project</span>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            style={{ fontSize: 12, padding: '5px 22px 5px 10px', border: '1px solid #d8d6d0', borderRadius: 3, cursor: 'pointer', background: '#fff', fontFamily: 'inherit' }}
          >
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
      {displayTasks.length === 0 ? (
        <EmptyState title={focusMode ? "No tasks to focus on." : "Nothing to do."} sub={focusMode ? "" : "Add something above to begin."} />
      ) : (
        displayTasks.map((t, i) => (
          <TaskRow
            key={t.id}
            task={t}
            onEdit={() => onEdit(t.id)}
            onComplete={() => onComplete(t.id)}
            rank={i}
            total={displayTasks.length}
          />
        ))
      )}
    </div>
  );
}
