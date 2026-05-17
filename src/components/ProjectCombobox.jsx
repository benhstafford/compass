import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Pencil, Plus } from 'lucide-react';

export default function ProjectCombobox({ value, onChange, allProjects, onRenameProject }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState('');
  const containerRef = useRef();
  const searchRef = useRef();

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        closeAll();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0);
  }, [open]);

  const closeAll = () => {
    setOpen(false);
    setQuery('');
    setAdding(false);
    setEditingProject(null);
    setEditName('');
  };

  const filtered = allProjects.filter(p =>
    p.toLowerCase().includes(query.toLowerCase())
  );

  const handleOpen = () => {
    setOpen(true);
    setQuery('');
    setAdding(false);
    setEditingProject(null);
  };

  const handleSelect = (p) => {
    onChange(p);
    closeAll();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    closeAll();
  };

  const handleAddConfirm = () => {
    const name = newName.trim();
    if (name) {
      onChange(name);
      closeAll();
    } else {
      setAdding(false);
      setNewName('');
    }
  };

  const handleRenameConfirm = () => {
    const name = editName.trim();
    if (name && name !== editingProject) {
      onRenameProject?.(editingProject, name);
      if (value === editingProject) onChange(name);
    }
    setEditingProject(null);
    setEditName('');
  };

  const startEditing = (e, p) => {
    e.stopPropagation();
    setEditingProject(p);
    setEditName(p);
    setAdding(false);
  };

  const stopKey = (e, fn) => {
    e.stopPropagation();
    if (e.key === 'Enter') fn();
    if (e.key === 'Escape') {
      e.preventDefault();
      closeAll();
    }
  };

  const itemHover = (e, enter) => {
    e.currentTarget.style.background = enter ? '#f5f4f0' : 'transparent';
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Trigger */}
      <div
        onClick={open ? closeAll : handleOpen}
        style={{
          fontSize: 14,
          borderBottom: `1px solid ${open ? '#1a1a1a' : '#d8d6d0'}`,
          padding: '6px 0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 32,
          transition: 'border-color 0.15s',
          userSelect: 'none',
        }}
      >
        <span style={{ color: value ? 'inherit' : '#b8b6b1', flex: 1 }}>
          {value || '—'}
        </span>
        <ChevronDown
          size={13}
          style={{
            color: '#888581',
            flexShrink: 0,
            transition: 'transform 0.15s',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 2px)',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #d8d6d0',
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(26,26,26,0.13)',
            zIndex: 200,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {/* Search */}
          <div style={{ padding: '6px 10px', borderBottom: '1px solid #e8e6e0', position: 'sticky', top: 0, background: '#fff' }}>
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search…"
              style={{
                width: '100%', fontSize: 13, padding: '3px 0',
                background: 'transparent', border: 'none', outline: 'none',
                fontFamily: 'inherit', color: 'inherit',
              }}
              onKeyDown={e => {
                if (e.key === 'Escape') { e.stopPropagation(); closeAll(); }
              }}
            />
          </div>

          {/* Clear option */}
          {value && (
            <div
              onClick={handleClear}
              style={{ padding: '8px 10px', fontSize: 13, color: '#888581', cursor: 'pointer' }}
              onMouseEnter={e => itemHover(e, true)}
              onMouseLeave={e => itemHover(e, false)}
            >
              — No project
            </div>
          )}

          {/* Project rows */}
          {filtered.map(p =>
            editingProject === p ? (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderBottom: '1px solid #f0eee8' }}>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => stopKey(e, handleRenameConfirm)}
                  autoFocus
                  style={{
                    flex: 1, fontSize: 13, background: 'transparent', border: 'none',
                    borderBottom: '1px solid #1a1a1a', outline: 'none',
                    padding: '2px 0', fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={handleRenameConfirm}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#2d5a3d', padding: '2px 5px', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}
                >
                  ✓
                </button>
                <button
                  onClick={() => { setEditingProject(null); setEditName(''); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#888581', padding: '2px 5px', fontSize: 12, fontFamily: 'inherit' }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                key={p}
                onClick={() => handleSelect(p)}
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px 10px' }}
                onMouseEnter={e => itemHover(e, true)}
                onMouseLeave={e => itemHover(e, false)}
              >
                <span style={{ flex: 1, fontSize: 13 }}>{p}</span>
                {value === p && <Check size={12} style={{ color: '#2d5a3d', flexShrink: 0, marginRight: 4 }} />}
                <button
                  onClick={e => startEditing(e, p)}
                  title="Rename"
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: '#c8c5be', padding: '2px 4px', display: 'inline-flex',
                    alignItems: 'center', transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#888581')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#c8c5be')}
                >
                  <Pencil size={11} />
                </button>
              </div>
            )
          )}

          {filtered.length === 0 && !adding && (
            <div style={{ padding: '8px 10px', fontSize: 12, color: '#a8a8a4' }}>No matches</div>
          )}

          {/* Add new project */}
          {adding ? (
            <div style={{ padding: '7px 10px', borderTop: '1px solid #e8e6e0', display: 'flex', alignItems: 'center', gap: 8, position: 'sticky', bottom: 0, background: '#fff' }}>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => stopKey(e, handleAddConfirm)}
                placeholder="Project name…"
                autoFocus
                style={{
                  flex: 1, fontSize: 13, background: 'transparent', border: 'none',
                  borderBottom: '1px solid #1a1a1a', outline: 'none',
                  padding: '2px 0', fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleAddConfirm}
                style={{
                  background: '#1a1a1a', border: 'none', borderRadius: 3,
                  cursor: 'pointer', color: '#fafaf7', padding: '4px 10px',
                  fontSize: 11, fontWeight: 500, fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}
              >
                Add
              </button>
            </div>
          ) : (
            <div
              onClick={() => { setAdding(true); setEditingProject(null); }}
              style={{
                padding: '8px 10px', borderTop: '1px solid #e8e6e0',
                cursor: 'pointer', fontSize: 12, color: '#888581',
                display: 'flex', alignItems: 'center', gap: 6,
                position: 'sticky', bottom: 0, background: '#fff',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f5f4f0')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              <Plus size={12} /> Add new project
            </div>
          )}
        </div>
      )}
    </div>
  );
}
