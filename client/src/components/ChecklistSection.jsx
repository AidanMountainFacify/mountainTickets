import { useState } from 'react';

function ChecklistRow({ item, onToggle, onEditText, onDelete }) {
  const [text, setText] = useState(item.text);

  function commitText() {
    const trimmed = text.trim();
    if (trimmed && trimmed !== item.text) onEditText(item.id, trimmed);
    else setText(item.text);
  }

  return (
    <div className="checklist-row">
      <input
        type="checkbox"
        className="checklist-checkbox"
        checked={item.checked}
        onChange={(e) => onToggle(item.id, e.target.checked)}
      />
      <input
        className={`checklist-text ${item.checked ? 'checklist-text-done' : ''}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commitText}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
      <button className="checklist-delete" onClick={() => onDelete(item.id)} title="Remove item">
        ×
      </button>
    </div>
  );
}

export default function ChecklistSection({ items, onToggle, onAdd, onEditText, onDelete }) {
  const [newText, setNewText] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    if (!newText.trim()) return;
    onAdd(newText.trim());
    setNewText('');
  }

  const total = items.length;
  const done = items.filter((i) => i.checked).length;

  return (
    <div className="checklist-section">
      <div className="field-label-row">
        <label className="field-label">Action items</label>
        {total > 0 && (
          <span className="checklist-progress">
            {done}/{total}
          </span>
        )}
      </div>

      {items.length > 0 && (
        <div className="checklist-list">
          {items.map((item) => (
            <ChecklistRow key={item.id} item={item} onToggle={onToggle} onEditText={onEditText} onDelete={onDelete} />
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="checklist-add-form">
        <input
          placeholder="Add an action item..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <button type="submit" className="secondary-btn">
          Add
        </button>
      </form>
    </div>
  );
}
