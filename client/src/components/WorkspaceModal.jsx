import { useState } from 'react';
import { WORKSPACE_COLORS } from '../constants';

function ColorPicker({ value, onChange }) {
  return (
    <div className="color-picker">
      {WORKSPACE_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className={`color-swatch ${value === c ? 'color-swatch-selected' : ''}`}
          style={{ backgroundColor: c }}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  );
}

function WorkspaceRow({ workspace, onRename, onRecolor, onDelete }) {
  const [name, setName] = useState(workspace.name);

  function commitName() {
    const trimmed = name.trim();
    if (trimmed && trimmed !== workspace.name) onRename(workspace.id, trimmed);
    else setName(workspace.name);
  }

  return (
    <div className="workspace-row">
      <input
        className="workspace-row-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
      />
      <ColorPicker value={workspace.color} onChange={(color) => onRecolor(workspace.id, color)} />
      <button className="workspace-row-delete" onClick={() => onDelete(workspace)} title="Delete workspace">
        Delete
      </button>
    </div>
  );
}

export default function WorkspaceModal({ workspaces, onClose, onCreate, onRename, onRecolor, onDelete }) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(WORKSPACE_COLORS[0]);

  function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreate({ name: newName.trim(), color: newColor });
    setNewName('');
    setNewColor(WORKSPACE_COLORS[(WORKSPACE_COLORS.indexOf(newColor) + 1) % WORKSPACE_COLORS.length]);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal workspace-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>Manage workspaces</span>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {workspaces.length === 0 && (
          <div className="comments-empty">No workspaces yet. Add one below to start separating tickets.</div>
        )}

        <div className="workspace-list">
          {workspaces.map((w) => (
            <WorkspaceRow
              key={w.id}
              workspace={w}
              onRename={onRename}
              onRecolor={onRecolor}
              onDelete={onDelete}
            />
          ))}
        </div>

        <form onSubmit={handleCreate} className="workspace-create-form">
          <input
            placeholder="New workspace name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <button type="submit" className="primary-btn">
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
