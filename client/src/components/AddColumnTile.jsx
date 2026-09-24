import { useState } from 'react';

export default function AddColumnTile({ onAdd }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState('');

  function commit() {
    const trimmed = label.trim();
    if (trimmed) onAdd(trimmed);
    setLabel('');
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="add-column-tile">
        <button className="add-column-btn" onClick={() => setEditing(true)}>
          + Add column
        </button>
      </div>
    );
  }

  return (
    <div className="add-column-tile add-column-tile-editing">
      <input
        autoFocus
        placeholder="Column name"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setLabel('');
            setEditing(false);
          }
        }}
        onBlur={commit}
      />
    </div>
  );
}
