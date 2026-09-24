import { useEffect, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TicketCard from './TicketCard';

export default function Column({
  status,
  droppableId,
  tickets,
  onOpenTicket,
  onAddTicket,
  workspacesById,
  onRename,
  onDelete,
  canDelete,
  collapsed,
  onToggleCollapse,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  const [label, setLabel] = useState(status.label);

  useEffect(() => {
    setLabel(status.label);
  }, [status.label]);

  function commitLabel() {
    const trimmed = label.trim();
    if (trimmed && trimmed !== status.label) onRename(status.id, trimmed);
    else setLabel(status.label);
  }

  return (
    <div className="column">
      <div className="column-header">
        <button
          className="column-collapse-toggle"
          onClick={() => onToggleCollapse(status.id)}
          title={collapsed ? 'Expand column' : 'Collapse column'}
        >
          {collapsed ? '▸' : '▾'}
        </button>
        <input
          className="column-title-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={commitLabel}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
        />
        <span className="column-count">{tickets.length}</span>
        <button className="column-add" onClick={() => onAddTicket(status.id)} title="Add ticket">
          +
        </button>
        {canDelete && (
          <button className="column-delete" onClick={() => onDelete(status)} title="Delete column">
            ×
          </button>
        )}
      </div>
      <div ref={setNodeRef} className={`column-body ${isOver ? 'column-body-over' : ''}`}>
        {collapsed ? (
          <button className="column-collapsed-summary" onClick={() => onToggleCollapse(status.id)}>
            {tickets.length === 0 ? 'No tickets' : `${tickets.length} ticket${tickets.length === 1 ? '' : 's'} hidden`}
          </button>
        ) : (
          <>
            <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onOpen={onOpenTicket}
                  workspace={workspacesById.get(ticket.workspace_id)}
                />
              ))}
            </SortableContext>
            {tickets.length === 0 && <div className="column-empty">No tickets</div>}
          </>
        )}
      </div>
    </div>
  );
}
