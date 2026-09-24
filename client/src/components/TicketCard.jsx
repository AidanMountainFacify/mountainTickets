import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { priorityInfo } from '../constants';

function formatDeadline(dateStr) {
  // Parse as local date, not UTC, so "2026-10-01" doesn't shift to Sep 30
  // for anyone west of UTC.
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isOverdue(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const deadline = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deadline < today;
}

export default function TicketCard({ ticket, onOpen, workspace }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priority = priorityInfo(ticket.priority);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="ticket-card"
      onClick={() => onOpen(ticket)}
    >
      <div className="ticket-card-id">MT-{ticket.id}</div>
      {workspace && (
        <span className="workspace-chip" style={{ backgroundColor: workspace.color }}>
          {workspace.name}
        </span>
      )}
      <div className="ticket-card-title">{ticket.title}</div>
      <div className="ticket-card-footer">
        <span className="priority-dot" style={{ backgroundColor: priority.color }} title={priority.label} />
        {ticket.checklist_total > 0 && (
          <span className={`checklist-badge ${ticket.checklist_checked === ticket.checklist_total ? 'checklist-badge-done' : ''}`}>
            ✓ {ticket.checklist_checked}/{ticket.checklist_total}
          </span>
        )}
        {ticket.labels.length > 0 && (
          <div className="ticket-card-labels">
            {ticket.labels.map((l) => (
              <span key={l} className="label-chip">
                {l}
              </span>
            ))}
          </div>
        )}
        {ticket.deadline && (
          <span className={`deadline-chip ${isOverdue(ticket.deadline) ? 'deadline-chip-overdue' : ''}`}>
            📅 {formatDeadline(ticket.deadline)}
          </span>
        )}
      </div>
    </div>
  );
}
