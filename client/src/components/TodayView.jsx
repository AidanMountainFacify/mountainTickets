import { useMemo, useState } from 'react';

function TicketPicker({ tickets, onPick, onClose }) {
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return tickets.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 8);
  }, [tickets, query]);

  return (
    <div className="ticket-picker">
      <input
        autoFocus
        placeholder="Search tickets by title..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      />
      {matches.length > 0 && (
        <div className="ticket-picker-results">
          {matches.map((t) => (
            <button
              key={t.id}
              className="ticket-picker-result"
              onClick={() => {
                onPick(t.id);
                onClose();
              }}
            >
              MT-{t.id} — {t.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DailyItemRow({ item, workspace, onToggle, onOpenTicket, onDelete }) {
  const label = item.kind === 'ticket' && item.ticket ? item.ticket.title : item.text;

  return (
    <div className="checklist-row">
      <input
        type="checkbox"
        className="checklist-checkbox"
        checked={item.checked}
        onChange={(e) => onToggle(item.id, e.target.checked)}
      />
      {item.kind === 'ticket' && item.ticket ? (
        <button
          className={`daily-item-ticket-link ${item.checked ? 'checklist-text-done' : ''}`}
          onClick={() => onOpenTicket(item.ticket)}
        >
          {workspace && <span className="workspace-pill-dot" style={{ backgroundColor: workspace.color }} />}
          MT-{item.ticket.id} — {label}
        </button>
      ) : (
        <span className={`daily-item-text ${item.checked ? 'checklist-text-done' : ''}`}>{label}</span>
      )}
      <button className="checklist-delete" onClick={() => onDelete(item.id)} title="Remove item">
        ×
      </button>
    </div>
  );
}

export default function TodayView({
  open,
  items,
  tickets,
  workspacesById,
  onToggle,
  onAddNote,
  onAddTicket,
  onDelete,
  onOpenTicket,
  onOpenHistory,
  onClose,
}) {
  const [newNote, setNewNote] = useState('');
  const [pickingTicket, setPickingTicket] = useState(false);

  const today = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    []
  );

  function handleAddNote(e) {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(newNote.trim());
    setNewNote('');
  }

  const done = items.filter((i) => i.checked).length;

  return (
    <div className={`today-drawer ${open ? 'today-drawer-open' : ''}`}>
      <div className="today-header">
        <div>
          <h2 className="today-title">Today</h2>
          <div className="today-date">{today}</div>
        </div>
        <div className="today-header-actions">
          {items.length > 0 && (
            <span className="checklist-progress">
              {done}/{items.length}
            </span>
          )}
          <button className="secondary-btn" onClick={onOpenHistory}>
            History
          </button>
          <button className="modal-close" onClick={onClose} title="Close">
            ×
          </button>
        </div>
      </div>

      <div className="today-add-row">
        <form onSubmit={handleAddNote} className="checklist-add-form today-add-note-form">
          <input
            placeholder="Add a quick item..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <button type="submit" className="secondary-btn">
            Add
          </button>
        </form>
        <button className="secondary-btn" onClick={() => setPickingTicket((v) => !v)}>
          + Link ticket
        </button>
      </div>

      {pickingTicket && (
        <TicketPicker
          tickets={tickets}
          onPick={onAddTicket}
          onClose={() => setPickingTicket(false)}
        />
      )}

      <div className="today-list">
        {items.length === 0 && <div className="column-empty">Nothing on today's list yet</div>}
        {items.map((item) => (
          <DailyItemRow
            key={item.id}
            item={item}
            workspace={item.ticket ? workspacesById.get(item.ticket.workspace_id) : null}
            onToggle={onToggle}
            onOpenTicket={onOpenTicket}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
